#pragma once

// Provisional board wiring supplied for the current ESP32-S3 N16R8 setup.
// Confirm the carrier-board pinout before wiring peripherals.
#define TURBIDITY_ADC_PIN 4
#define OLED_SDA_PIN 8
#define OLED_SCL_PIN 9
// Provisional; confirm with the display's address scan before final wiring.
#define OLED_I2C_ADDRESS 0x3C

// Provisional RGB LED pins; verify the LED wiring, current limiting, and polarity.
#define RGB_RED_PIN 5
#define RGB_GREEN_PIN 6
#define RGB_BLUE_PIN 7

// GPIO4 is ADC1_CH3 on ESP32-S3. ADC_11db is configured in the sketch, but
// ADC attenuation does not protect a pin from overvoltage. Measure the sensor
// AO and use a correctly sized divider if needed before making this connection.

// BLE GATT protocol shared with front-end/src/services/provisioning.js
#define AQUASENSE_BLE_NAME "Aquasense-ESP32"
#define AQUASENSE_BLE_SERVICE "7a8e0001-4d3b-4c2a-9f61-425541515345"
#define AQUASENSE_BLE_SSID_CHAR "7a8e0002-4d3b-4c2a-9f61-425541515345"
#define AQUASENSE_BLE_PASSWORD_CHAR "7a8e0003-4d3b-4c2a-9f61-425541515345"
#define AQUASENSE_BLE_COMMAND_CHAR "7a8e0004-4d3b-4c2a-9f61-425541515345"
#define AQUASENSE_BLE_STATUS_CHAR "7a8e0005-4d3b-4c2a-9f61-425541515345"

// Calibration remains disabled until clear/cloudy reference measurements are recorded.
// To enable: measure raw ADC in clear water and in cloudy water, set the two
// limits below, then change TURBIDITY_CALIBRATED to true.
#define TURBIDITY_CALIBRATED false
#define ADC_DIRECTION_HIGHER_CLEARER true
#define ADC_GOOD_LIMIT 0
#define ADC_POOR_LIMIT 0

#if TURBIDITY_CALIBRATED && (ADC_GOOD_LIMIT < 0 || ADC_GOOD_LIMIT > 4095 || ADC_POOR_LIMIT < 0 || ADC_POOR_LIMIT > 4095)
#error "ADC calibration limits must be within the 12-bit ADC range 0 to 4095."
#endif
#if TURBIDITY_CALIBRATED && ADC_DIRECTION_HIGHER_CLEARER && (ADC_GOOD_LIMIT <= ADC_POOR_LIMIT)
#error "When higher ADC means clearer water, GOOD_LIMIT must be greater than POOR_LIMIT."
#endif
#if TURBIDITY_CALIBRATED && !ADC_DIRECTION_HIGHER_CLEARER && (ADC_GOOD_LIMIT >= ADC_POOR_LIMIT)
#error "When lower ADC means clearer water, GOOD_LIMIT must be less than POOR_LIMIT."
#endif
