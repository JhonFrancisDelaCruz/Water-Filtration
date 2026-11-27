import { PermissionsAndroid, Platform } from 'react-native';

export const STEPS = [
  'Connecting to ESP32 via Bluetooth',
  'Sending Wi-Fi credentials',
  'Connecting ESP32 to Wi-Fi',
  'Verifying internet connection',
  'Configuration successful',
];

export const BLE_SERVICE = '7a8e0001-4d3b-4c2a-9f61-425541515345';
export const BLE_SSID = '7a8e0002-4d3b-4c2a-9f61-425541515345';
export const BLE_PASSWORD = '7a8e0003-4d3b-4c2a-9f61-425541515345';
export const BLE_COMMAND = '7a8e0004-4d3b-4c2a-9f61-425541515345';
export const BLE_STATUS = '7a8e0005-4d3b-4c2a-9f61-425541515345';

let bleInstance = null;
let connectedId = null;
const bytes = (value) => Array.from(unescape(encodeURIComponent(value)), (character) => character.charCodeAt(0));
const text = (value) => String.fromCharCode(...new Uint8Array(value));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cancelledError = () => Object.assign(new Error('Cancelled'), { code: 'CANCELLED' });
async function getBle() {
  if (!bleInstance) {
    const { BleNitro } = await import('react-native-ble-nitro');
    bleInstance = BleNitro.instance();
  }
  return bleInstance;
}

export async function connectDevice(isCancelled = () => false) {
  if (Platform.OS === 'android') {
    const api = Number(Platform.Version);
    const permissions = api >= 31
      ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
    const granted = await PermissionsAndroid.requestMultiple(permissions);
    if (permissions.some((permission) => granted[permission] !== PermissionsAndroid.RESULTS.GRANTED)) {
      throw new Error('Bluetooth permission was denied. Allow Nearby devices and try again.');
    }
  }
  const ble = await getBle();
  if (!ble.isBluetoothEnabled()) throw new Error('Turn on Bluetooth and allow nearby-device permission.');
  const found = await new Promise((resolve, reject) => {
    let done = false;
    const poll = setInterval(() => {
      if (isCancelled() && !done) {
        done = true; clearTimeout(timeout); clearInterval(poll); ble.stopScan(); reject(cancelledError());
      }
    }, 200);
    const timeout = setTimeout(() => {
      if (!done) { done = true; clearInterval(poll); ble.stopScan(); reject(new Error('Aquasense device not found. Keep it powered on and nearby.')); }
    }, 12000);
    ble.startScan({ serviceUUIDs: [BLE_SERVICE], allowDuplicates: false }, (device) => {
      if (!done && /aqua/i.test(device.name || '')) {
        done = true; clearTimeout(timeout); clearInterval(poll); ble.stopScan(); resolve(device);
      }
    }, (error) => {
      if (!done) { done = true; clearTimeout(timeout); clearInterval(poll); reject(error); }
    });
  });
  connectedId = await ble.connect(found.id);
  await ble.discoverServices(connectedId);
  const services = ble.getServices(connectedId);
  if (!services.some((uuid) => uuid.toLowerCase() === BLE_SERVICE)) {
    await ble.disconnect(connectedId); connectedId = null;
    throw new Error('This ESP32 firmware does not expose the Aquasense Wi-Fi setup service. Update its firmware.');
  }
}

export async function disconnectDevice() {
  if (!bleInstance) return;
  const ble = bleInstance;
  ble.stopScan();
  if (connectedId && ble.isConnected(connectedId)) await ble.disconnect(connectedId);
  connectedId = null;
}

export async function provisionWifi({ ssid, password }, { onStep, isCancelled }) {
  const ssidBytes = bytes(ssid.trim());
  const passwordBytes = bytes(password);
  if (!ssidBytes.length || ssidBytes.length > 32 || passwordBytes.length > 63) throw new Error('SSID or password is too long.');
  let subscription;
  try {
    const ble = await getBle();
    if (!connectedId || !ble.isConnected(connectedId)) {
      onStep(0);
      await connectDevice(isCancelled);
    }
    if (isCancelled()) throw cancelledError();
    const id = connectedId;
    onStep(1);
    await ble.writeCharacteristic(id, BLE_SERVICE, BLE_SSID, ssidBytes, true);
    await ble.writeCharacteristic(id, BLE_SERVICE, BLE_PASSWORD, passwordBytes, true);
    subscription = await ble.subscribeToCharacteristic(id, BLE_SERVICE, BLE_STATUS, (_uuid, value) => {
      // The promise below observes this callback through a resolver attached immediately after.
      statusListener?.(text(value));
    });
    onStep(2);
    const result = await new Promise((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => finish(new Error('The ESP32 did not confirm Wi-Fi within 45 seconds.'), true), 45000);
      const finish = (value, failed = false) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (failed) reject(value);
        else resolve(value);
      };
      statusListener = (message) => {
        if (message.startsWith('OK')) finish(message);
        else if (message.startsWith('FAIL')) finish(new Error(message.slice(5) || 'Wi-Fi connection failed.'), true);
      };
      if (isCancelled()) return finish(cancelledError(), true);
      void ble.writeCharacteristic(id, BLE_SERVICE, BLE_COMMAND, bytes('CONNECT'), true)
        .catch((error) => finish(error, true));
      const cancellationTimer = setInterval(() => {
        if (isCancelled()) finish(cancelledError(), true);
        if (settled) clearInterval(cancellationTimer);
      }, 250);
    });
    onStep(3);
    await delay(300);
    onStep(4);
    return { ssid, result };
  } finally {
    statusListener = null;
    if (subscription) await subscription.remove();
    await disconnectDevice();
  }
}

let statusListener = null;
