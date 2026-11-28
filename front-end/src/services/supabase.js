import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const deviceId = process.env.EXPO_PUBLIC_AQUASENSE_DEVICE_ID;

export const isBackendConfigured = Boolean(url && anonKey && deviceId);
export const aquasenseDeviceId = deviceId || '';

export const supabase = isBackendConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null;

export async function getDeviceSnapshot() {
  if (!supabase) throw new Error('Set the Expo public Supabase URL, anon key, and device ID.');
  const [deviceResult, readingResult] = await Promise.all([
    supabase.from('devices').select('id, device_name, is_online, last_seen, created_at').eq('id', deviceId).maybeSingle(),
    supabase.from('sensor_readings').select('id, device_id, turbidity_value, water_status, created_at').eq('device_id', deviceId).order('created_at', { ascending: false }).limit(100),
  ]);
  if (deviceResult.error) throw deviceResult.error;
  if (readingResult.error) throw readingResult.error;
  const device = deviceResult.data;
  if (device?.last_seen) device.is_online = Date.now() - Date.parse(device.last_seen) < 180000;
  return { device, readings: readingResult.data || [] };
}

export async function getReadings({ from, to } = {}) {
  if (!supabase) throw new Error('Set the Expo public Supabase URL, anon key, and device ID.');
  const pageSize = 1000;
  const readings = [];
  for (let offset = 0; ; offset += pageSize) {
    let query = supabase.from('sensor_readings')
      .select('id, device_id, turbidity_value, water_status, created_at')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
    const { data, error } = await query;
    if (error) throw error;
    readings.push(...(data || []));
    if (!data || data.length < pageSize) return readings;
  }
}

export async function getAlerts() {
  if (!supabase) throw new Error('Set the Expo public Supabase URL, anon key, and device ID.');
  const { data, error } = await supabase.from('alerts').select('id, device_id, message, severity, is_read, created_at').eq('device_id', deviceId).order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return data || [];
}

export async function markAlertRead(alertId) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('alerts').update({ is_read: true }).eq('id', alertId).eq('device_id', deviceId);
  if (error) throw error;
}

export function formatReading(value) {
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })} ADC`;
}
