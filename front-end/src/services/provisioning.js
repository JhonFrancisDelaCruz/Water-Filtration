// Wi-Fi provisioning service for the ESP32-S3 (Bluetooth is used ONLY for this).
//
// ⚠️  This file is a SIMULATION so the UI can be built and tested in Expo Go.
// Every exported function keeps the shape a real Bluetooth (BLE) version needs,
// so later you only replace the bodies using `react-native-ble-plx` and the UI
// does not change. Nothing here produces sensor data.
//
// Simulated rule for testing the failure screen: a password that is
// 1–7 characters long is rejected ("wrong password"). Leave it empty or use
// 8+ characters to see the success flow.

export const STEPS = [
  'Connecting to ESP32 via Bluetooth',
  'Sending Wi-Fi credentials',
  'Connecting ESP32 to Wi-Fi',
  'Verifying internet connection',
  'Configuration successful',
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function fail(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// Sample list for design/testing. A real version asks the ESP32-S3 over BLE
// to scan for networks and returns what it finds.
const SAMPLE_NETWORKS = [
  { ssid: 'HomeNet_2.4G', level: 4, secure: true },
  { ssid: 'Office_WiFi', level: 3, secure: true },
  { ssid: 'CafeGuest', level: 2, secure: false },
  { ssid: 'Neighbor_Net', level: 1, secure: true },
];

export async function connectDevice() {
  // REAL: scan for the device (e.g. name starts with "AquaMonitor"), connect, discover services.
  await wait(1200);
}

export async function scanNetworks() {
  // REAL: write a "scan" command to the ESP32 characteristic, then read the result list.
  await wait(1500);
  return SAMPLE_NETWORKS;
}

// onStep(i): called when step i (index into STEPS) starts.
// isCancelled(): return true to stop between steps.
export async function provisionWifi({ ssid, password }, { onStep, isCancelled }) {
  const run = async (index, ms) => {
    if (isCancelled()) throw fail('CANCELLED', 'Cancelled');
    onStep(index);
    await wait(ms);
  };

  await run(0, 1200); // connect via Bluetooth
  await run(1, 1200); // REAL: write SSID + password characteristics
  await run(2, 2000); // REAL: ESP32 joins Wi-Fi, report status back via notify characteristic

  if (password.length > 0 && password.length < 8) {
    throw fail(
      'JOIN_FAILED',
      `Your ESP32-S3 could not join ${ssid}. Nothing was changed on the device.`
    );
  }

  await run(3, 1200); // REAL: ESP32 confirms it can reach the internet
  if (isCancelled()) throw fail('CANCELLED', 'Cancelled');
  return { ssid };
}
