
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-device-id, x-device-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function jsonResponse(data: object, status = 200) {
  return Response.json(data, {
    status,
    headers: corsHeaders,
  });
}

function equalHexConstantTime(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function hashSecret(secret: string): Promise<string> {
  const encoded = new TextEncoder().encode(secret.trim());
  const hash = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    // 1. Get device credentials
    const deviceId = req.headers.get("x-device-id")?.trim();
    const deviceSecret = req.headers.get("x-device-secret")?.trim();

    if (!deviceId || !deviceSecret || !UUID_V4_RE.test(deviceId)) {
      return jsonResponse({
        error: "Missing device credentials",
      }, 401);
    }

    // 2. Find device
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("id, device_key_hash")
      .eq("id", deviceId)
      .maybeSingle();

    if (deviceError) {
      console.error("DEVICE LOOKUP ERROR:", deviceError);
      return jsonResponse({
        error: "Unable to verify device",
      }, 500);
    }

    if (!device) {
      return jsonResponse({
        error: "Device not found",
      }, 401);
    }

    // 3. Verify device secret
    const submittedHash = await hashSecret(deviceSecret);
    const storedHash = String(device.device_key_hash || "").trim().toLowerCase();

    if (!equalHexConstantTime(submittedHash, storedHash)) {
      return jsonResponse({
        error: "Invalid device credentials",
      }, 401);
    }

    // 4. Read sensor data
    let body;

    try {
      body = await req.json();
    } catch {
      return jsonResponse({
        error: "Invalid JSON request body",
      }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse({ error: "Invalid sensor data" }, 400);
    }

    const turbidityValue = body.turbidity_value;
    const waterStatus = body.water_status;
    const readingId = body.reading_id;
    const recordedAt = body.recorded_at;

    // 5. Validate sensor data
    if (
      typeof turbidityValue !== "number" ||
      !Number.isFinite(turbidityValue) ||
      !Number.isInteger(turbidityValue) ||
      turbidityValue < 0 ||
      turbidityValue > 4095 ||
      typeof waterStatus !== "string" ||
      !["Good", "Warning", "Poor"].includes(waterStatus) ||
      typeof readingId !== "string" ||
      !UUID_V4_RE.test(readingId) ||
      (recordedAt !== undefined && (
        typeof recordedAt !== "string" ||
        !ISO_TIMESTAMP_RE.test(recordedAt) ||
        !Number.isFinite(Date.parse(recordedAt))
      ))
    ) {
      return jsonResponse({
        error: "Invalid sensor data",
      }, 400);
    }

    // 6. Save sensor reading. device_reading_id is a UUID idempotency key;
    // the table keeps its generated bigint primary key.
    const { data: inserted, error: insertError } = await supabase
      .from("sensor_readings")
      .upsert({
        device_reading_id: readingId,
        device_id: deviceId,
        turbidity_value: turbidityValue,
        water_status: waterStatus,
        ...(recordedAt ? { created_at: recordedAt } : {}),
      }, { onConflict: "device_id,device_reading_id", ignoreDuplicates: true })
      .select("id")
      .maybeSingle();

    if (insertError) {
      console.error("SENSOR INSERT ERROR:", insertError);
      return jsonResponse({
        error: "Failed to save sensor reading",
      }, 500);
    }

    const isReplay = !inserted;
    if (isReplay) console.info("Acknowledging replayed reading", readingId);

    const { data: currentReading, error: currentReadingError } = await supabase
      .from("sensor_readings")
      .select("created_at")
      .eq("device_id", deviceId)
      .eq("device_reading_id", readingId)
      .maybeSingle();

    if (currentReadingError || !currentReading) {
      console.error("SAVED READING LOOKUP ERROR:", currentReadingError);
      return jsonResponse({ error: "Reading saved; its stored timestamp could not be checked" }, 500);
    }

    // 7. Update device status
    const { error: updateError } = await supabase
      .from("devices")
      .update({
        is_online: true,
        last_seen: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (updateError) {
      console.error("DEVICE UPDATE ERROR:", updateError);
      return jsonResponse({
        error: "Reading saved, but device status update failed",
      }, 500);
    }

    // 8. Create an alert once per transition into Warning/Poor. The alert's
    // device_reading_id is also unique, so a retry can safely finish this step.
    if (waterStatus !== "Good") {
      const { data: previous, error: previousError } = await supabase
        .from("sensor_readings")
        .select("water_status")
        .eq("device_id", deviceId)
        .lt("created_at", currentReading.created_at)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (previousError) {
        console.error("PREVIOUS READING LOOKUP ERROR:", previousError);
        return jsonResponse({ error: "Reading saved; alert state could not be checked" }, 500);
      }

      if (!previous || previous.water_status !== waterStatus) {
        const { error: alertError } = await supabase.from("alerts").upsert({
          device_reading_id: readingId,
          device_id: deviceId,
          message: waterStatus === "Poor"
            ? "Turbidity reached the poor water quality range. Check the water and filter."
            : "Turbidity reached the warning range. Monitor the filter and water quality.",
          severity: waterStatus.toLowerCase(),
          is_read: false,
        }, { onConflict: "device_id,device_reading_id", ignoreDuplicates: true });

        if (alertError) {
          console.error("ALERT UPSERT ERROR:", alertError);
          return jsonResponse({ error: "Reading saved; alert will be retried" }, 500);
        }
      }
    }

    // 9. Return success
    return jsonResponse({
      success: true,
      duplicate: isReplay,
      message: isReplay ? "Reading was already stored" : "Reading saved successfully",
    });

  } catch (error) {
    console.error("FUNCTION ERROR:", error);

    return jsonResponse({
      error: "Internal server error",
    }, 500);
  }
});
