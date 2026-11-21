import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable, StyleSheet } from 'react-native';
import Card from '../components/Card';
import Row, { ValueText } from '../components/Row';
import Button from '../components/Button';
import Icon from '../components/Icon';
import StatusPill from '../components/StatusPill';
import { TOP } from '../components/Header';
import { colors } from '../constants/theme';

// Placeholder device info for the UI. Replace with real status from your device/service.
const DEFAULT_DEVICE = {
  name: 'ESP32-S3',
  online: true,
  ssid: 'HomeNet_2.4G',
  wifiConnected: true,
};

const NOTIFICATIONS = [
  { key: 'turbidity', label: 'High turbidity alerts', sub: 'When readings pass the warning level' },
  { key: 'disconnected', label: 'Device disconnected alerts', sub: 'If the ESP32-S3 stops reporting' },
  { key: 'sensor', label: 'Sensor error alerts', sub: 'If the turbidity sensor fails' },
  { key: 'restored', label: 'Normal condition restored', sub: 'When water returns to normal' },
];

export default function SettingsScreen({ device = DEFAULT_DEVICE, onOpenWifi }) {
  const [alerts, setAlerts] = useState({ turbidity: true, disconnected: true, sensor: true, restored: false });
  const [theme, setTheme] = useState('light'); // dark mode is not implemented yet

  const toggle = (key) => setAlerts((a) => ({ ...a, [key]: !a[key] }));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: TOP + 28 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage your app and device preferences</Text>

      <Card title="Account" icon="user" style={styles.card}>
        <Row label="Profile information" chevron onPress={() => {}} />
        <Row label="Edit profile" chevron onPress={() => {}} />
        <Row label="Change password" chevron onPress={() => {}} />
      </Card>

      <Card title="Monitoring Settings" icon="sliders" style={styles.card}>
        <Row label="Turbidity warning threshold" sub="Alert when readings pass this level" right={<ValueText>10 NTU</ValueText>} onPress={() => {}} />
        <Row label="Critical threshold" sub="Urgent alert level" right={<ValueText>25 NTU</ValueText>} onPress={() => {}} />
        <Row label="Reading update interval" sub="How often the ESP32-S3 reports" right={<ValueText>5 sec</ValueText>} onPress={() => {}} />
      </Card>

      <Card title="Device & Connectivity" icon="cpu" style={[styles.card, { paddingBottom: 16 }]}>
        <Row label="Connected device" right={<ValueText>{device.name}</ValueText>} />
        <Row
          label="Device status"
          right={<StatusPill text={device.online ? 'Connected' : 'Disconnected'} tone={device.online ? 'green' : 'red'} />}
        />
        <Row label="Wi-Fi network (SSID)" right={<ValueText>{device.ssid || 'Not set'}</ValueText>} />
        <Row
          label="Wi-Fi connection"
          right={<StatusPill text={device.wifiConnected ? 'Connected' : 'Disconnected'} tone={device.wifiConnected ? 'green' : 'red'} />}
        />
        <View style={styles.buttons}>
          <Button title="Change Wi-Fi Connection" icon="wifi" onPress={onOpenWifi} />
          <Button title="Configure Device via Bluetooth" icon="bluetooth" variant="ghost" onPress={onOpenWifi} />
        </View>
        <Text style={styles.note}>
          Bluetooth is only used to send new Wi-Fi details to your ESP32-S3. Sensor data always travels over Wi-Fi.
        </Text>
      </Card>

      <Card title="Notifications" icon="bell" style={styles.card}>
        {NOTIFICATIONS.map((n) => (
          <Row
            key={n.key}
            label={n.label}
            sub={n.sub}
            right={
              <Switch
                value={alerts[n.key]}
                onValueChange={() => toggle(n.key)}
                trackColor={{ false: '#CBD5E1', true: colors.accent }}
                thumbColor="#fff"
                accessibilityLabel={n.label}
              />
            }
          />
        ))}
      </Card>

      <Card title="Appearance" icon="moon" style={[styles.card, { paddingBottom: 14 }]}>
        <View style={styles.seg}>
          {[
            { key: 'light', label: 'Light mode', icon: 'sun' },
            { key: 'dark', label: 'Dark mode', icon: 'moon' },
          ].map((o) => {
            const on = theme === o.key;
            return (
              <Pressable key={o.key} onPress={() => setTheme(o.key)} style={[styles.segBtn, on && styles.segOn]}>
                <Icon name={o.icon} size={16} color={on ? colors.link : colors.mutedText} />
                <Text style={[styles.segText, on && { color: colors.link }]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card title="About" icon="info" style={styles.card}>
        <Row label="App version" right={<ValueText bold={false}>1.0.0</ValueText>} />
        <Row label="About AquaMonitor" chevron onPress={() => {}} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 16, paddingBottom: 100, gap: 14 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textStrong, letterSpacing: -0.4, paddingHorizontal: 2 },
  subtitle: { fontSize: 13, color: colors.mutedText, marginTop: -10, paddingHorizontal: 2, paddingBottom: 6 },
  card: {},
  buttons: { gap: 10, marginTop: 14 },
  note: { fontSize: 12, lineHeight: 17, color: colors.mutedText, marginTop: 12, paddingHorizontal: 2 },
  seg: { flexDirection: 'row', gap: 6, backgroundColor: colors.surface, borderRadius: 12, padding: 4 },
  segBtn: { flex: 1, height: 38, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  segOn: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  segText: { fontSize: 13, fontWeight: '600', color: colors.mutedText },
});
