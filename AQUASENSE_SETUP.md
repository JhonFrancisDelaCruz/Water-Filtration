# Aquasense bring-up and demonstration guide

## Hardware gate

The existing sketch previously contained GPIO 4 and GPIO 8/9 guesses. `Aquasense_ESP32/config.h` now deliberately leaves all three assignments unset and stops compilation until they are confirmed. Confirm the exact ESP32-S3 board pinout and actual wires before editing these values. Measure the turbidity module's analog output at its maximum expected output before connecting it to the ESP32-S3: the ESP32-S3 GPIO is not 5 V tolerant. Confirm OLED supply voltage, logic levels, I²C address, and the actual SDA/SCL pins as well. Do not connect an unverified AO voltage to an ADC pin.

The DFRobot module is the only water sensor. The firmware reports **raw ADC counts (0–4095)**, not NTU. Its Good/Warning/Poor boundaries cannot be set honestly until clean and cloudy water samples have been measured on this exact sensor and wiring.

## Credentials and setup

1. Rotate the Wi-Fi password and the device secret that appeared in the old sketch. Replace the device secret hash in the existing `devices.device_key_hash` row with lowercase SHA-256 hex of the new secret. Keep the raw secret only in the local ignored `Aquasense_ESP32/secrets.h` file on the device build machine.
2. Copy `Aquasense_ESP32/secrets.h.example` to `Aquasense_ESP32/secrets.h`. Set the project's publishable/anon key, actual device row UUID, and rotated per-device secret. Never put the Supabase service-role key in firmware or the app.
3. Set the confirmed GPIOs, actual OLED I²C address, and measured/calibrated ADC thresholds in `Aquasense_ESP32/config.h`. Set `TURBIDITY_CALIBRATED` true only after recording measurements in both clear and cloudy samples and determining which direction indicates clearer water.
4. Install the Arduino ESP32 core and the Adafruit GFX / SSD1306 libraries. The BLE code uses the ESP32 Arduino core BLE stack; LittleFS and Preferences are provided by the core.
5. Apply `front-end/supabase/migrations/202611270001_aquasense_mobile_rls.sql`. It is scoped to the existing Water Filter ESP32 UUID and replaces the two broad anon read policies. Inspect any future policy changes carefully because PostgreSQL permissive policies combine with OR. The migration adds policies/grants but no tables or columns.
6. Keep the deployed `receive-sensor-data` Edge Function JWT verification disabled because device authentication is performed by its per-device SHA-256 secret check. From `front-end/`, link the Supabase project (`supabase link --project-ref ljpfhypcsdvodiwuxkmy`) and deploy (`supabase functions deploy receive-sensor-data`). Confirm the Supabase-provided `SUPABASE_SERVICE_ROLE_KEY` is available only in the function runtime. The live project currently has generated `bigint` primary keys for `sensor_readings.id` and `alerts.id`; the Edge Function must preserve those IDs and use a separate UUID idempotency field or another schema-compatible strategy before device testing.
7. Copy `front-end/.env.example` to `front-end/.env` and set the project URL, publishable/anon key, and actual device UUID. The no-login app intentionally reads only the configured device through RLS. Those readings are visible to anyone who extracts the public app key and UUID, so do not use this design for private data.
8. Install app dependencies with `npm ci`. BLE requires a native development build; Expo Go cannot load the native BLE module. Generate/build a development app with `npx expo run:android` or `npx expo run:ios` after validating the package/plugin against the installed Expo SDK.

## Data contract

- Firmware sends `reading_id` (UUID v4), `turbidity_value` (integer raw ADC, 0–4095), `water_status` (`Good`, `Warning`, or `Poor`), and optional `recorded_at` (UTC ISO-8601) in JSON.
- It sends `x-device-id` and `x-device-secret` headers over certificate-verified HTTPS. The Edge Function hashes the submitted secret, validates the payload, stores the row using `reading_id` as the existing row ID, refreshes `devices.last_seen`, and creates an alert on entry into Warning/Poor. Retrying a queued reading reuses the same ID.
- BLE GATT UUIDs and payloads are shared in `Aquasense_ESP32/config.h` and `front-end/src/services/provisioning.js`. The phone writes SSID and password characteristics, then `CONNECT`; the ESP32 stores credentials in Preferences/NVS, joins Wi-Fi, checks verified TLS reachability to Supabase, then notifies `OK` or `FAIL:...`. BLE remains available for setup but is not part of routine sensor uploads.
- LittleFS stores queued JSON records. Successful server acknowledgement removes a record; connection/HTTP failure retains it for retry. BLE Wi-Fi writes require bonded LE Secure Connections encryption, but the current pairing does not provide MITM verification. NVS and LittleFS are not physically encrypted by this sketch. Production devices should enable ESP32 flash encryption and secure boot, protect the device secret in manufacturing, and add a user-verified BLE passkey before deployment.

## Demo test checklist

| # | Test | Expected result | Error clues |
|---|---|---|---|
| 1 | ESP32 startup on USB | Serial Monitor at 115200 shows Aquasense startup, storage state, BLE advertising, and Wi-Fi state. OLED shows Aquasense. | Reboot loop, brownout text, missing serial output, LittleFS mount failure, or OLED init failure. A storage mount failure must not be “fixed” by formatting if records matter. |
| 2 | Turbidity sensor connection/disconnection | ADC changes within the board's verified safe voltage range. Disconnecting the sensor shows `Check sensor`, makes the sample invalid, and produces no Good status or upload. | ADC stuck at 0/full scale suggests wiring, supply, ground, or disconnected sensor; stop and recheck voltage before reconnecting. Any invalid sample shown/uploaded as Good is a firmware bug. |
| 3 | Sensor stability | Repeated filtered readings settle in still water; spread stays below configured limit. | `Unstable` with high spread indicates bubbles, loose wiring, electrical noise, or an overly tight MAX_SPREAD setting. |
| 4 | Sensor calibration | Record repeated readings in representative clear and cloudy reference water; set direction and boundaries so classifications agree with those samples. | If cloudy and clear ranges overlap substantially, fix mechanical/electrical instability; do not force arbitrary limits or claim NTU. |
| 5 | OLED | Shows latest raw ADC, Good/Warning/Poor or invalid reason, Wi-Fi, and cloud/queue state. | Blank display: check confirmed SDA/SCL, address, supply, and I²C scan. Wrong/stale values: compare with serial output. |
| 6 | Wi-Fi join | Saved 2.4 GHz credentials connect and serial prints IP/RSSI; NTP time becomes valid. | Repeated `[WIFI] Reconnecting` means wrong password, 5 GHz-only SSID, weak signal, or router isolation. |
| 7 | Supabase authentication | A valid device UUID/secret gets HTTP 200; a wrong secret gets 401 without inserting data. | 401: wrong device row UUID or secret hash. 404: wrong function URL. TLS/negative HTTP code: clock, DNS, CA chain, or network issue. |
| 8 | Database insertion | One valid POST creates one `sensor_readings` row with raw count, same status, UUID row ID, and reading timestamp. | 400 means invalid body/range/UUID/status. 500 means inspect Edge Function logs and table schema/permissions. |
| 9 | Automatic alert | Transition Good→Warning or Good→Poor creates one matching `alerts` row; subsequent same-status samples do not flood alerts. Returning to Good then Warning creates a new alert. | Missing alert: inspect Edge Function logs and table insert permission; repeated alerts: inspect readings ordering and status transitions. |
| 10 | Mobile monitor | Dashboard/Monitor refresh from Supabase, show raw ADC and same status, and mark device offline after three minutes without server contact. | `Set the Expo public...` means `.env` absent; RLS error means migration/policy mismatch; stale values mean device is not uploading. |
| 11 | Historical retrieval | Day/Week/Month filters show timestamps in the selected range and chart/data rows use the same ADC values as the table. | Empty history despite known rows: verify device UUID, `created_at`, timezone/range, and RLS. |
| 12 | BLE Wi-Fi configuration | Native app build discovers `Aquasense-ESP32`, connects, sends SSID/password, receives result, and device reconnects with new credentials after reboot. | Permission error: grant Nearby devices/Bluetooth. Device/service not found: BLE name/UUID mismatch or stale firmware. `FAIL:WIFI`: SSID/password, 2.4 GHz, range, DNS/TLS. |
| 13 | Internet disconnection | Sensor remains sampled and valid records continue accumulating in LittleFS; OLED/serial indicate queued or unsent state. | Queue count does not rise: calibration disabled, invalid sensor, LittleFS unavailable, or capture interval issue. |
| 14 | Offline buffering | Disconnect internet while keeping power; verify queue JSON files remain and contain unique UUIDs/ADC/status. | Queue file write failure or capacity message indicates flash/storage limit; do not reset/format before recovery. |
| 15 | Reconnection and sync | Restore internet; oldest queued record uploads, database receives one row per ID with original recorded time when NTP had been available, and files disappear only after acknowledgement. | Repeated network errors: TLS/time/API/auth. Duplicates: verify deployed Edge Function uses `upsert` on the existing UUID `id` column and that firmware preserves the queue ID. |

## Known demo boundaries

- Firmware build is intentionally blocked until GPIOs and output voltage are verified, and sending is blocked until real calibration is set.
- No physical board, sensor samples, Supabase schema access, device secret rotation, native mobile device, or Edge Function deployment credentials were available in this workspace. Hardware and cloud tests above need the actual equipment/project before the final live demonstration.
- Device `is_online` is refreshed when the Edge Function receives a request. The app also derives effective online state from `last_seen`; no server cron job is added to rewrite old device rows to `is_online=false`.
- `recorded_at` is optional when the device has no trustworthy RTC/NTP time. Such an offline reading receives the database upload timestamp, because a resettable millis counter cannot produce a truthful wall-clock history.
