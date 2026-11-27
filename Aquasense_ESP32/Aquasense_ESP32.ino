
// Aquasense - ESP32-S3 turbidity monitor -> Supabase
// Sensor values are RAW ADC counts (0-4095), NOT NTU.

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <time.h>
#include <Preferences.h>
#include <LittleFS.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <BLESecurity.h>
#include <esp_system.h>

#include "config.h"
#include "secrets.h"

// Root CA certificate used to verify the Supabase server.
static const char SUPABASE_ROOT_CA[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF
+0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX
6UA5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq
+sWT8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3
qyHB5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3
x+UCB5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0
SHzUvKBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0
ahmbWnOlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk
3SzynTnjh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWB
fEbwrbwqHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13he
f4Y53CIrU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIB
BjAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umb
bjANBgkqhkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+IL
laS/V9lZLubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY
+EgPbk6ZGQ3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qk
SsisRcOj/KKNFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHI
InNzktHCgKQ5ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhd
jsnvzqvHu7UrTkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW
0wdeRlN8NwdCjNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWh
scdCb+ZAJzVcoyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjC
hP4kqKOJ2qxq4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4
rF2LN9d11TPAmRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g
1SgEEzwxA57demyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1An
X5iItreGCc=
-----END CERTIFICATE-----
)EOF";


// ===================== CONFIGURATION =====================

// ---- Pins ----
const int     SENSOR_PIN = TURBIDITY_ADC_PIN;
const int     SDA_PIN    = OLED_SDA_PIN;
const int     SCL_PIN    = OLED_SCL_PIN;
const uint8_t OLED_ADDR  = OLED_I2C_ADDRESS;

// ---- Sampling ----
const int           NUM_SAMPLES      = 30;   // samples per averaged reading
const int           TRIM_COUNT       = 3;    // lowest/highest samples discarded
const unsigned long SAMPLE_PERIOD_MS = 20;   // time between samples
const int           MAX_SPREAD       = 150;  // above this = "Unstable" (tune for your setup)
const int           ADC_RAIL_LOW     = 10;   // at/below = sensor probably disconnected
const int           ADC_RAIL_HIGH    = 4085; // at/above = sensor probably disconnected

// ---- Calibration / classification ----
// Fill these from YOUR Step 2 measurements, then set CALIBRATED = true.
const bool CALIBRATED            = TURBIDITY_CALIBRATED;
const bool ADC_HIGHER_IS_CLEARER = ADC_DIRECTION_HIGHER_CLEARER;
const int  GOOD_LIMIT            = ADC_GOOD_LIMIT;
const int  POOR_LIMIT            = ADC_POOR_LIMIT;
// Higher-is-clearer: adc >= GOOD_LIMIT -> Good, adc >= POOR_LIMIT -> Warning, else Poor
// Lower-is-clearer : adc <= GOOD_LIMIT -> Good, adc <= POOR_LIMIT -> Warning, else Poor

// ---- Timing ----
const unsigned long SEND_INTERVAL_MS = 60000;  // one reading per minute
const unsigned long RETRY_DELAY_MS   = 15000;
const unsigned long WIFI_RETRY_MS    = 10000;
const unsigned long OLED_PERIOD_MS   = 500;
const int           HTTP_TIMEOUT_MS  = 5000;

// ===================== STATE =====================

Adafruit_SSD1306 display(128, 64, &Wire, -1);
Preferences prefs;
BLECharacteristic* bleStatus = nullptr;
String pendingSsid, pendingPassword;
volatile bool wifiConfigRequested = false;
bool provisioningActive = false;
unsigned long provisioningStartedMs = 0;
unsigned long lastProvisionTlsCheckMs = 0;
unsigned long nextQueueAttemptMs = 0;
String savedSsid, savedPassword;
bool oledOk = false;
bool storageOk = false;

int  sampleBuf[NUM_SAMPLES];
int  sampleIdx = 0;
unsigned long lastSampleMs = 0;

int         latestAdc    = -1;
int         latestSpread = 0;
bool        latestValid  = false;
const char* invalidWhy   = "Starting";

bool wasConnected = false;
bool timeSyncStarted = false;
unsigned long lastWifiCheckMs = 0;
unsigned long lastWifiAttemptMs = 0;

bool firstSendDue = true;
unsigned long lastCycleMs = 0;
unsigned long lastSuccessMs = 0;
bool lastSendOk = false;
String cloudMsg = "Waiting";

unsigned long lastOledMs = 0;

// ===================== FUNCTION DECLARATIONS =====================
void connectWiFi();
void startBleProvisioning();
void serviceBleProvisioning();
void notifyBleStatus(const String& message);
void checkWiFiConnection();
void readTurbiditySensor();
void filterSensorReadings();
const char* classifyWaterQuality(int adc);
void updateOLED();
void handleSendSchedule();
bool sendSensorDataToSupabase(const String& payload);
bool handleSupabaseResponse(int code, const String& body);
bool isTimeSynced();
String makeReadingId();
bool enqueueReading();
void syncReadingQueue();

// ===================== SETUP / LOOP =====================

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== Aquasense ESP32-S3 starting ===");

  prefs.begin("aquasense", false);
  savedSsid = prefs.getString("ssid", "");
  savedPassword = prefs.getString("password", "");
  storageOk = LittleFS.begin(false);
  if (!storageOk) Serial.println("[QUEUE] LittleFS mount failed; not formatting flash to avoid erasing data");
  else if (!LittleFS.exists("/queue")) LittleFS.mkdir("/queue");
  startBleProvisioning();

  analogReadResolution(12);
  analogSetPinAttenuation(SENSOR_PIN, ADC_11db);

  Wire.begin(SDA_PIN, SCL_PIN);
  if (display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    oledOk = true;
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(2);
    display.setCursor(0, 20);
    display.println("Aquasense");
    display.display();
  } else {
    Serial.println("[OLED] init failed - continuing without display");
  }

  if (!CALIBRATED) {
    Serial.println("[WARN] CALIBRATED = false. Readings are shown but not sent as real data.");
  }
  if (savedSsid.length()) connectWiFi();
  else Serial.println("[WIFI] Not configured. Open Settings in the app to provision Wi-Fi over BLE.");
}

void loop() {
  readTurbiditySensor();
  checkWiFiConnection();
  serviceBleProvisioning();
  handleSendSchedule();
  syncReadingQueue();
  updateOLED();
  delay(1);
}

// ===================== WI-FI =====================

class WifiFieldCallbacks : public BLECharacteristicCallbacks {
  bool isSsid;
public:
  explicit WifiFieldCallbacks(bool ssid) : isSsid(ssid) {}
  void onWrite(BLECharacteristic* characteristic) override {
    String value = characteristic->getValue().c_str();
    if (isSsid) pendingSsid = value.substring(0, 32);
    else pendingPassword = value.substring(0, 63);
  }
};

class WifiCommandCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* characteristic) override {
    if (String(characteristic->getValue().c_str()) == "CONNECT") wifiConfigRequested = true;
  }
};

class WifiServerCallbacks : public BLEServerCallbacks {
  void onDisconnect(BLEServer*) override {
    BLEDevice::startAdvertising();
    Serial.println("[BLE] Client disconnected; advertising resumed");
  }
};

void startBleProvisioning() {
  BLEDevice::init(AQUASENSE_BLE_NAME);
  BLESecurity* security = new BLESecurity();
  security->setAuthenticationMode(true, false, true); // bonded LE Secure Connections; encrypted GATT writes
  BLEServer* server = BLEDevice::createServer();
  server->setCallbacks(new WifiServerCallbacks());
  BLEService* service = server->createService(AQUASENSE_BLE_SERVICE);
  BLECharacteristic* ssid = service->createCharacteristic(AQUASENSE_BLE_SSID_CHAR, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_ENC);
  BLECharacteristic* password = service->createCharacteristic(AQUASENSE_BLE_PASSWORD_CHAR, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_ENC);
  BLECharacteristic* command = service->createCharacteristic(AQUASENSE_BLE_COMMAND_CHAR, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_ENC);
  bleStatus = service->createCharacteristic(AQUASENSE_BLE_STATUS_CHAR, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  bleStatus->addDescriptor(new BLE2902());
  ssid->setCallbacks(new WifiFieldCallbacks(true));
  password->setCallbacks(new WifiFieldCallbacks(false));
  command->setCallbacks(new WifiCommandCallbacks());
  bleStatus->setValue("READY");
  service->start();
  BLEAdvertising* advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(AQUASENSE_BLE_SERVICE);
  advertising->setScanResponse(true);
  BLEDevice::startAdvertising();
  Serial.printf("[BLE] Advertising as %s for Wi-Fi setup\n", AQUASENSE_BLE_NAME);
}

void notifyBleStatus(const String& message) {
  if (!bleStatus) return;
  bleStatus->setValue(message.c_str());
  bleStatus->notify();
}

void serviceBleProvisioning() {
  const unsigned long now = millis();
  if (wifiConfigRequested && !provisioningActive) {
    wifiConfigRequested = false;
    if (!pendingSsid.length() || pendingPassword.length() > 63) {
      notifyBleStatus("FAIL:SSID");
      return;
    }
    WiFi.disconnect(false, false);
    WiFi.mode(WIFI_STA);
    WiFi.begin(pendingSsid.c_str(), pendingPassword.c_str());
    provisioningActive = true;
    provisioningStartedMs = now;
    notifyBleStatus("CONNECTING");
    Serial.printf("[BLE] Joining Wi-Fi SSID '%s'\n", pendingSsid.c_str());
  }
  if (!provisioningActive) return;
  if (WiFi.status() == WL_CONNECTED && isTimeSynced() && now - lastProvisionTlsCheckMs >= 3000) {
    lastProvisionTlsCheckMs = now;
    WiFiClientSecure tls;
    tls.setCACert(SUPABASE_ROOT_CA);
    tls.setTimeout(5);
    const bool tlsOk = tls.connect("ljpfhypcsdvodiwuxkmy.supabase.co", 443);
    tls.stop();
    if (tlsOk) {
      savedSsid = pendingSsid;
      savedPassword = pendingPassword;
      prefs.putString("ssid", savedSsid);
      prefs.putString("password", savedPassword);
      if (!timeSyncStarted) {
        configTime(0, 0, "pool.ntp.org", "time.google.com");
        timeSyncStarted = true;
      }
      notifyBleStatus("OK");
      Serial.printf("[BLE] Wi-Fi and verified TLS ready. IP: %s\n", WiFi.localIP().toString().c_str());
      provisioningActive = false;
      wasConnected = true;
      return;
    }
  }
  if (now - provisioningStartedMs >= 60000) {
    provisioningActive = false;
    notifyBleStatus("FAIL:WIFI");
    Serial.println("[BLE] Wi-Fi join/TLS check failed; keeping previously stored credentials");
    WiFi.disconnect();
    if (savedSsid.length()) WiFi.begin(savedSsid.c_str(), savedPassword.c_str());
  }
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(savedSsid.c_str(), savedPassword.c_str());
  lastWifiAttemptMs = millis();
  Serial.printf("[WIFI] Connecting to \"%s\"...\n", savedSsid.c_str());
}

void checkWiFiConnection() {
  unsigned long now = millis();
  if (now - lastWifiCheckMs < 1000) return;
  lastWifiCheckMs = now;

  bool connected = (WiFi.status() == WL_CONNECTED);

  if (connected && !wasConnected) {
    Serial.printf("[WIFI] Connected. IP: %s, RSSI: %d dBm\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
    if (!timeSyncStarted) {
      configTime(0, 0, "pool.ntp.org", "time.google.com");
      timeSyncStarted = true;
      Serial.println("[TIME] NTP sync started");
    }
  }
  if (!connected && wasConnected) {
    Serial.println("[WIFI] Connection lost");
  }
  wasConnected = connected;

  if (!connected && now - lastWifiAttemptMs >= WIFI_RETRY_MS) {
    Serial.println("[WIFI] Reconnecting...");
    WiFi.disconnect();
    if (savedSsid.length()) WiFi.begin(savedSsid.c_str(), savedPassword.c_str());
    lastWifiAttemptMs = now;
  }
}

bool isTimeSynced() {
  return time(nullptr) > 1700000000;  // any date after Nov 2023 means NTP worked
}

// ===================== SENSOR =====================

void readTurbiditySensor() {
  unsigned long now = millis();
  if (now - lastSampleMs < SAMPLE_PERIOD_MS) return;
  lastSampleMs = now;

  sampleBuf[sampleIdx++] = analogRead(SENSOR_PIN);
  if (sampleIdx >= NUM_SAMPLES) {
    sampleIdx = 0;
    filterSensorReadings();
  }
}

void filterSensorReadings() {
  int sorted[NUM_SAMPLES];
  memcpy(sorted, sampleBuf, sizeof(sorted));

  // insertion sort
  for (int i = 1; i < NUM_SAMPLES; i++) {
    int key = sorted[i];
    int j = i - 1;
    while (j >= 0 && sorted[j] > key) { sorted[j + 1] = sorted[j]; j--; }
    sorted[j + 1] = key;
  }

  // trimmed mean: drop the lowest and highest samples
  long sum = 0;
  int count = 0;
  for (int i = TRIM_COUNT; i < NUM_SAMPLES - TRIM_COUNT; i++) { sum += sorted[i]; count++; }

  latestAdc = (int)(sum / count);
  latestSpread = sorted[NUM_SAMPLES - 1 - TRIM_COUNT] - sorted[TRIM_COUNT];

  if (latestAdc <= ADC_RAIL_LOW || latestAdc >= ADC_RAIL_HIGH) {
    latestValid = false; invalidWhy = "Check sensor";
  } else if (latestSpread > MAX_SPREAD) {
    latestValid = false; invalidWhy = "Unstable";
  } else {
    latestValid = true;  invalidWhy = "OK";
  }

  Serial.printf("[SENSOR] avgADC=%d spread=%d valid=%s (%s) status=%s\n",
                latestAdc, latestSpread, latestValid ? "yes" : "no", invalidWhy,
                latestValid ? classifyWaterQuality(latestAdc) : "n/a");
}

// ===================== CLASSIFICATION =====================

// Returns "Good", "Warning", "Poor" (or "Calibrate" if not calibrated).
const char* classifyWaterQuality(int adc) {
  if (!CALIBRATED) return "Calibrate";
  if (ADC_HIGHER_IS_CLEARER) {
    if (adc >= GOOD_LIMIT) return "Good";
    if (adc >= POOR_LIMIT) return "Warning";
    return "Poor";
  } else {
    if (adc <= GOOD_LIMIT) return "Good";
    if (adc <= POOR_LIMIT) return "Warning";
    return "Poor";
  }
}

// ===================== OLED =====================

void updateOLED() {
  if (!oledOk) return;
  unsigned long now = millis();
  if (now - lastOledMs < OLED_PERIOD_MS) return;
  lastOledMs = now;

  bool wifiOk = (WiFi.status() == WL_CONNECTED);

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("AQUASENSE");
  display.setCursor(80, 0);
  display.print(wifiOk ? "WiFi OK" : "WiFi --");
  display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

  display.setCursor(0, 13);
  display.print("Turbidity (raw ADC)");

  display.setTextSize(2);
  display.setCursor(0, 23);
  if (latestAdc < 0) display.print("--");
  else display.print(latestAdc);

  display.setTextSize(1);
  display.setCursor(0, 43);
  display.print("Status: ");
  display.print(latestValid ? classifyWaterQuality(latestAdc) : invalidWhy);

  display.setCursor(0, 55);
  if (lastSendOk && lastSuccessMs > 0) {
    display.printf("Cloud: OK %lus ago", (now - lastSuccessMs) / 1000);
  } else {
    display.print("Cloud: ");
    display.print(cloudMsg);
  }
  display.display();
}

// ===================== SUPABASE =====================

void handleSendSchedule() {
  unsigned long now = millis();
  if (firstSendDue || now - lastCycleMs >= SEND_INTERVAL_MS) {
    lastCycleMs = now;
    firstSendDue = false;
    if (!CALIBRATED) {
      cloudMsg = "Calibrate first";
      lastSendOk = false;
      Serial.println("[QUEUE] Not storing/sending readings until calibration is confirmed");
    } else if (!latestValid) {
      cloudMsg = "Waiting valid";
      lastSendOk = false;
      Serial.println("[QUEUE] Invalid sensor sample skipped");
    } else if (!storageOk) {
      cloudMsg = "Storage error";
      lastSendOk = false;
    } else if (enqueueReading()) {
      cloudMsg = "Queued";
      lastSendOk = false;
      Serial.printf("[QUEUE] Captured %d ADC (%s) for later synchronization\n", latestAdc, classifyWaterQuality(latestAdc));
    } else {
      cloudMsg = "Queue full/error";
      lastSendOk = false;
    }
  }
}

String makeReadingId() {
  uint8_t bytes[16];
  esp_fill_random(bytes, sizeof(bytes));
  bytes[6] = (bytes[6] & 0x0F) | 0x40;
  bytes[8] = (bytes[8] & 0x3F) | 0x80;
  char id[37];
  snprintf(id, sizeof(id), "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
    bytes[0],bytes[1],bytes[2],bytes[3],bytes[4],bytes[5],bytes[6],bytes[7],bytes[8],bytes[9],bytes[10],bytes[11],bytes[12],bytes[13],bytes[14],bytes[15]);
  return String(id);
}

bool enqueueReading() {
  if (!storageOk) return false;
  File dir = LittleFS.open("/queue");
  if (!dir || !dir.isDirectory()) return false;
  int count = 0;
  File item = dir.openNextFile();
  while (item) { count++; item = dir.openNextFile(); }
  dir.close();
  if (count >= 500) { Serial.println("[QUEUE] Capacity reached (500 readings)"); return false; }

  String id = makeReadingId();
  String payload = "{\"reading_id\":\"" + id + "\",\"turbidity_value\":" + String(latestAdc) + ",\"water_status\":\"" + classifyWaterQuality(latestAdc) + "\"";
  if (isTimeSynced()) {
    time_t epoch = time(nullptr);
    struct tm utc;
    gmtime_r(&epoch, &utc);
    char stamp[25];
    strftime(stamp, sizeof(stamp), "%Y-%m-%dT%H:%M:%SZ", &utc);
    payload += ",\"recorded_at\":\"" + String(stamp) + "\"";
  }
  payload += "}";
  const uint32_t sequence = prefs.getUInt("sequence", 0) + 1;
  prefs.putUInt("sequence", sequence);
  char path[48];
  snprintf(path, sizeof(path), "/queue/%010lu.json", (unsigned long)sequence);
  File record = LittleFS.open(path, FILE_WRITE);
  if (!record) return false;
  size_t written = record.print(payload);
  record.close();
  return written == payload.length();
}

void syncReadingQueue() {
  if (!storageOk) return;
  const unsigned long now = millis();
  if (now < nextQueueAttemptMs || WiFi.status() != WL_CONNECTED || !isTimeSynced()) return;
  File dir = LittleFS.open("/queue");
  if (!dir || !dir.isDirectory()) return;
  String oldest;
  File entry = dir.openNextFile();
  while (entry) {
    String name = String(entry.name());
    if (!name.startsWith("/")) name = "/queue/" + name;
    if (oldest.isEmpty() || name < oldest) oldest = name;
    entry = dir.openNextFile();
  }
  dir.close();
  if (oldest.isEmpty()) return;
  File record = LittleFS.open(oldest, FILE_READ);
  if (!record) { nextQueueAttemptMs = now + RETRY_DELAY_MS; return; }
  String payload = record.readString();
  record.close();
  cloudMsg = "Syncing queue";
  updateOLED();
  if (sendSensorDataToSupabase(payload)) {
    LittleFS.remove(oldest);
    lastSendOk = true;
    lastSuccessMs = millis();
    cloudMsg = "Sent OK";
    nextQueueAttemptMs = millis() + 250;
    Serial.printf("[QUEUE] Uploaded and removed %s\n", oldest.c_str());
  } else {
    lastSendOk = false;
    nextQueueAttemptMs = millis() + RETRY_DELAY_MS;
    Serial.printf("[QUEUE] Upload failed; retained %s for retry\n", oldest.c_str());
  }
}

bool sendSensorDataToSupabase(const String& payload) {
  WiFiClientSecure client;   // local object: freed when the function returns
  client.setCACert(SUPABASE_ROOT_CA);
  client.setTimeout(HTTP_TIMEOUT_MS / 1000);

  HTTPClient http;
  http.setConnectTimeout(HTTP_TIMEOUT_MS);
  http.setTimeout(HTTP_TIMEOUT_MS);

 if (!http.begin(client, SUPABASE_FUNCTION_URL)) {
    Serial.println("[SUPABASE] http.begin failed");
    cloudMsg = "Begin failed";
    return false;
  }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_PUBLISHABLE_KEY);
  http.addHeader("x-device-id", AQUASENSE_DEVICE_ID);
  http.addHeader("x-device-secret", AQUASENSE_DEVICE_SECRET);

  Serial.printf("[SUPABASE] POST: %s\n", payload.c_str());

  int code = http.POST((uint8_t*)payload.c_str(), payload.length());
  String body = (code > 0) ? http.getString() : http.errorToString(code);
  http.end();

  return handleSupabaseResponse(code, body);
}

bool handleSupabaseResponse(int code, const String& body) {
  Serial.printf("[SUPABASE] HTTP code: %d\n", code);
  Serial.printf("[SUPABASE] Response: %s\n", body.substring(0, 200).c_str());

  if (code == 200 || code == 201) {
    Serial.println("[SUPABASE] Success");
    return true;
  }
  if (code < 0)                         cloudMsg = "Conn error";
  else if (code == 401 || code == 403)  cloudMsg = "Auth fail";
  else if (code == 400)                 cloudMsg = "Bad data";
  else                                  cloudMsg = "HTTP " + String(code);
  Serial.printf("[SUPABASE] Failed: %s\n", cloudMsg.c_str());
  return false;
}
