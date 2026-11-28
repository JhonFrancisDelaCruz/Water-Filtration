# AquaSense setup and deployment runbook

This runbook records the repository-verified setup. Production deployment and migrations have **not** been performed. The current live schema was inspected read-only on 2026-11-28; the migrations still need a reviewed, approved deployment window.

## Hardware requirements before wiring

- Board: ESP32-S3 N16R8. GPIO assignments below are provisional and must be checked against the exact carrier board.
- Sensor: one analog turbidity sensor only. The exact DFRobot Gravity model is not confirmed. Do not connect AO to an ESP32 pin until the model and maximum AO voltage are verified. ESP32-S3 GPIO is not 5 V tolerant. For reference, DFRobot SEN0189 is specified for 5 V supply with 0–4.5 V analog output; if that is the actual model, AO needs a properly calculated divider before GPIO4. The ADC attenuation setting is not overvoltage protection.
- OLED: 0.96-inch I2C display; address 0x3C is provisional. Confirm voltage compatibility, address and wiring.
- RGB: GPIO5/6/7 are provisional. Confirm whether the LED is common-anode or common-cathode and use appropriate current limiting.

Current provisional map in `Aquasense_ESP32/config.h`: sensor ADC GPIO4, OLED SDA GPIO8/SCL GPIO9, RGB red/green/blue GPIO5/6/7. Do not treat this as a verified board wiring diagram.

## Firmware setup and build

Install Arduino CLI and the Espressif Arduino core. This firmware uses the Arduino-ESP32 4.0 BLE API; compile against the pinned core version. From the repository root in PowerShell:

```powershell
arduino-cli core update-index --additional-urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
arduino-cli core install esp32:esp32@4.0.0
arduino-cli lib install "Adafruit GFX Library"
arduino-cli lib install "Adafruit SSD1306"
Copy-Item Aquasense_ESP32/secrets.h.example Aquasense_ESP32/secrets.h
```

Fill the ignored local `Aquasense_ESP32/secrets.h` with the Supabase Function URL, public/publishable anon key, registered device UUID and device secret. Keep it out of source control and logs. The service-role key belongs only in Supabase-managed function secrets; it must never be put in firmware or the Expo app.

The configured FQBN for an ESP32-S3 N16R8 with 16 MB flash, OPI PSRAM and the built-in `huge_app` partition is:

```powershell
$board = 'esp32:esp32:esp32s3:FlashSize=16M,PSRAM=opi,PartitionScheme=huge_app'
arduino-cli compile --fqbn $board Aquasense_ESP32
arduino-cli upload --fqbn $board --port COMx Aquasense_ESP32
arduino-cli monitor --port COMx --config baudrate=115200
```

Replace `COMx` with the actual port. `huge_app` includes a SPIFFS-labelled data partition used by Arduino's `LittleFS` mount; the sketch calls `LittleFS.begin(false)` so a mount failure does not format storage. The repository has no custom partition table and does not require another filesystem library. This partition choice does not provide an OTA slot.

Firmware samples GPIO4 with 12-bit ADC reads, configured for ADC_11db, and a trimmed average of 30 samples spaced 20 ms apart. Those are raw ADC counts, not NTU. Rail and spread thresholds are provisional fault checks and need physical validation.

### Calibration

`TURBIDITY_CALIBRATED` is `false`; both ADC limits are zero. Keep this disabled until the actual sensor and safe analog interface are installed and repeated clear-water and cloudy-water ADC measurements are recorded on the assembled board. Determine the direction empirically. Do not infer NTU or thresholds from another sensor model. Then update the config with the measured limits and direction and enable calibration.

## App setup and checks

Use Node.js/npm compatible with the lockfile and install from `front-end`:

```powershell
Set-Location front-end
npm.cmd ci
Copy-Item .env.example .env
```

Set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_AQUASENSE_DEVICE_ID` in the ignored local `.env`. The device id must identify the registered device row. These are public client settings, not a service-role credential. Do not add login or registration; the app is intentionally no-login.

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npx.cmd expo-doctor
npx.cmd expo run:android
```

BLE provisioning requires a native development build with the Android BLE permissions and native module; Expo Go is not sufficient. Connect the ESP32 and Android device, grant Bluetooth/nearby-device permissions, choose a Wi-Fi network, and confirm provisioning succeeds. The device reports success only after Wi-Fi connects, system time is synchronized, and the configured Supabase host passes TLS verification.

For an Android store build, configure EAS once and build with the repository's chosen production profile:

```powershell
npx.cmd eas-cli@latest build:configure
npx.cmd eas-cli@latest build --platform android --profile production
```

Review `eas.json`, application identifiers, signing credentials, permissions and environment variables before starting a release build. No app has been built or published as part of this review.

## Supabase schema and function

The function uses device id + SHA-256 of the device secret for authentication, validates UUIDv4 reading ids and ADC/status fields, and uses `(device_id, device_reading_id)` for retry idempotency. The migration adds this key to readings and alerts while preserving generated bigint row IDs. The migration must be applied before deploying this function version, or writes referencing its new columns will fail.

The linked production schema was queried read-only. It currently has the `devices`, `sensor_readings`, and `alerts` columns the code expects, but has no `device_reading_id` columns or idempotency indexes. Its existing anon read policies on readings and alerts use `USING true`; the RLS migration is still pending. The Supabase migrations tracking table was not present. The CLI dry run lists both local migrations as pending. Do not apply migrations until the output is reviewed against a fresh live preflight and a production change window.

From `front-end`, authenticate the Supabase CLI against the intended project, then run the read-only preflight and dry run:

```powershell
supabase link --project-ref ljpfhypcsdvodiwuxkmy
supabase db query --file supabase/preflight.sql --read-only --remote
supabase db push --dry-run --remote
```

Review the displayed columns, policies, indexes, target project and both migration names. If the live schema has changed, stop and reconcile migrations before proceeding. **Do not run the following commands until that review and production approval are complete.** The safe sequence is:

```powershell
supabase db push --remote
supabase functions deploy receive-sensor-data --project-ref ljpfhypcsdvodiwuxkmy
```

Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as managed Edge Function secrets (never in the repository, frontend `.env`, firmware, or command history). Confirm the function's `verify_jwt = false` setting remains intentional because device authentication uses the device headers. Function deployment and migrations were not performed during this repository work.

### Device-secret rotation

If the secret may have been exposed, generate a new random secret locally, update the ignored firmware `secrets.h`, calculate its lowercase SHA-256 digest locally, then update only `devices.device_key_hash` for that device through an authorized Supabase SQL session. Coordinate the database hash update with reflashing the device so they use the same secret. Never print, paste, commit, or log the raw secret. Verify only that the device can authenticate after rotation. The read-only review checked that the production hash has the expected 64-character lowercase hex shape; it did not compare it with the local secret.

## Physical integration checks

After wiring has been independently verified, test the sensor voltage at the ESP32 ADC input before connecting it. Confirm it remains within the ESP32-S3 electrical limits through sensor power-up and all operating conditions. Then verify the OLED address/display, RGB polarity/current limiting, ADC stability, Wi-Fi provisioning and HTTPS upload. Use actual measured readings only. Confirm that retrying one captured reading id does not create a second row, that a new id does, and that warning/poor transitions create at most one alert per reading. Check live monitoring, history and alert rendering in the native app.

History fetches the selected period in 1000-row pages for full-period statistics and a sampled trend; the table displays at most the latest 500 rows to keep the screen responsive. Physical hardware and production access are required for the electrical, calibration, end-to-end BLE/TLS, and post-migration validation steps.
