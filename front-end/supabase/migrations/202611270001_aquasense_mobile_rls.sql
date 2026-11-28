-- Scopes the no-login mobile app to the existing Water Filter ESP32 device.
-- No tables or columns are added by this migration.
begin;

alter table public.devices enable row level security;
alter table public.sensor_readings enable row level security;
alter table public.alerts enable row level security;

-- Remove existing permissive all-device read policies. Permissive policies
-- combine with OR, so keeping these would bypass the device-scoped policies.
drop policy if exists "Allow app to read sensor readings" on public.sensor_readings;
drop policy if exists "Allow app to read alerts" on public.alerts;

drop policy if exists aquasense_app_device_read on public.devices;
create policy aquasense_app_device_read on public.devices
  for select to anon
  using (id = '4427891b-7a76-4512-b797-d158d8c4e619'::uuid);

drop policy if exists aquasense_app_readings_read on public.sensor_readings;
create policy aquasense_app_readings_read on public.sensor_readings
  for select to anon
  using (device_id = '4427891b-7a76-4512-b797-d158d8c4e619'::uuid);

drop policy if exists aquasense_app_alerts_read on public.alerts;
create policy aquasense_app_alerts_read on public.alerts
  for select to anon
  using (device_id = '4427891b-7a76-4512-b797-d158d8c4e619'::uuid);

drop policy if exists aquasense_app_alerts_mark_read on public.alerts;
create policy aquasense_app_alerts_mark_read on public.alerts
  for update to anon
  using (device_id = '4427891b-7a76-4512-b797-d158d8c4e619'::uuid)
  with check (device_id = '4427891b-7a76-4512-b797-d158d8c4e619'::uuid);

-- device_key_hash must never be selectable by the mobile/anon role.
revoke select on public.devices from anon, public;
grant select (id, device_name, is_online, last_seen, created_at) on public.devices to anon;
revoke select on public.sensor_readings, public.alerts from anon, public;
grant select (id, device_id, turbidity_value, water_status, created_at) on public.sensor_readings to anon;
grant select (id, device_id, message, severity, is_read, created_at) on public.alerts to anon;
revoke insert, update, delete on public.devices, public.sensor_readings, public.alerts from anon, public;
grant update (is_read) on public.alerts to anon;

commit;
