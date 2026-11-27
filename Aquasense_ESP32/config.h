#pragma once

// Set these only after confirming the board wiring and sensor analog output.
// ESP32-S3 ADC inputs are not 5 V tolerant. Never connect a sensor AO above
// the ESP32-S3 GPIO's documented input limit; measure AO before connecting.
#define TURBIDITY_ADC_PIN 4
#define OLED_SDA_PIN 8
#define OLED_SCL_PIN 9
#define OLED_I2C_ADDRESS 0x3C

// BLE GATT protocol shared with front-end/src/services/provisioning.js
#define AQUASENSE_BLE_NAME "Aquasense-ESP32"
#define AQUASENSE_BLE_SERVICE "7a8e0001-4d3b-4c2a-9f61-425541515345"
#define AQUASENSE_BLE_SSID_CHAR "7a8e0002-4d3b-4c2a-9f61-425541515345"
#define AQUASENSE_BLE_PASSWORD_CHAR "7a8e0003-4d3b-4c2a-9f61-425541515345"
#define AQUASENSE_BLE_COMMAND_CHAR "7a8e0004-4d3b-4c2a-9f61-425541515345"
#define AQUASENSE_BLE_STATUS_CHAR "7a8e0005-4d3b-4c2a-9f61-425541515345"

// Calibration remains disabled until clear/cloudy reference measurements are recorded.
#define TURBIDITY_CALIBRATED false
#define ADC_DIRECTION_HIGHER_CLEARER true
#define ADC_GOOD_LIMIT 0
#define ADC_POOR_LIMIT 0

#if TURBIDITY_CALIBRATED && (ADC_GOOD_LIMIT < 0 || ADC_GOOD_LIMIT > 4095 || ADC_POOR_LIMIT < 0 || ADC_POOR_LIMIT > 4095)
#error "ADC calibration limits must be within the 12-bit ADC range 0–4095."
#endif
#if TURBIDITY_CALIBRATED && ADC_DIRECTION_HIGHER_CLEARER && (ADC_GOOD_LIMIT <= ADC_POOR_LIMIT)
#error "When higher ADC means clearer water, GOOD_LIMIT must be greater than POOR_LIMIT."
#endif
#if TURBIDITY_CALIBRATED && !ADC_DIRECTION_HIGHER_CLEARER && (ADC_GOOD_LIMIT >= ADC_POOR_LIMIT)
#error "When lower ADC means clearer water, GOOD_LIMIT must be less than POOR_LIMIT."
#endif
