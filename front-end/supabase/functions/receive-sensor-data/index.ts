
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

function jsonResponse(data: object, status = 200) {
  return Response.json(data, {
    status,
    headers: corsHeaders,
  });
}

async function hashSecret(secret: string): Promise<string> {
  const encoded = new TextEncoder().encode(secret.trim());
  const hash = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function equalHexConstantTime(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
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

    if (!deviceId || !deviceSecret) {
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
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(readingId) ||
      (recordedAt !== undefined && (typeof recordedAt !== "string" || !Number.isFinite(Date.parse(recordedAt))))
    ) {
      return jsonResponse({
        error: "Invalid sensor data",
      }, 400);
    }

    const { error: updateError } = await supabase
      .from("devices")
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq("id", deviceId);
    if (updateError) {
      console.error("DEVICE UPDATE ERROR:", updateError);
      return jsonResponse({ error: "Unable to update device status" }, 500);
    }

    // 6. Save sensor reading. The existing UUID primary key is the replay
    // idempotency key, so a device can safely retry after a lost response.
    const { data: inserted, error: insertError } = await supabase
      .from("sensor_readings")
      .upsert({
        id: readingId,
        device_id: deviceId,
        turbidity_value: turbidityValue,
        water_status: waterStatus,
        ...(recordedAt ? { created_at: recordedAt } : {}),
      }, { onConflict: "id", ignoreDuplicates: true })
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

    // 7. Alert only when entering Warning/Poor, rather than making an alert for
    // every periodic sample that remains in the same unhealthy state.
    if (waterStatus !== "Good") {
      const { data: previous } = await supabase
        .from("sensor_readings")
        .select("water_status")
        .eq("device_id", deviceId)
        .neq("id", readingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!previous || previous.water_status !== waterStatus) {
        const severity = waterStatus.toLowerCase();
        const { error: alertError } = await supabase.from("alerts").upsert({
          id: readingId,
          device_id: deviceId,
          message: waterStatus === "Poor"
            ? "Turbidity reached the poor water quality range. Check the water and filter."
            : "Turbidity reached the warning range. Monitor the filter and water quality.",
          severity,
          is_read: false,
        }, { onConflict: "id", ignoreDuplicates: true });
        if (alertError) {
          console.error("ALERT INSERT ERROR:", alertError);
          return jsonResponse({ error: "Reading saved; alert will be retried" }, 500);
        }
      }
    }

    // 8. Return success
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
