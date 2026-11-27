import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable, StyleSheet } from 'react-native';
import Card from '../components/Card';
import Row, { ValueText } from '../components/Row';
import Button from '../components/Button';
import Icon from '../components/Icon';
import StatusPill from '../components/StatusPill';
import { TOP } from '../components/Header';
import { colors, getColors, useTheme } from '../constants/theme';
import { useAquasense } from '../services/useAquasense';
import { isBackendConfigured } from '../services/supabase';

const NOTIFICATIONS = [
  { key: 'turbidity', label: 'High turbidity alerts', sub: 'When readings pass the warning level' },
  { key: 'disconnected', label: 'Device disconnected alerts', sub: 'If the ESP32-S3 stops reporting' },
  { key: 'sensor', label: 'Sensor error alerts', sub: 'If the turbidity sensor fails' },
  { key: 'restored', label: 'Normal condition restored', sub: 'When water returns to normal' },
];

export default function SettingsScreen({ onOpenWifi }) {
  const { device, error } = useAquasense();
  const [alerts, setAlerts] = useState({ turbidity: true, disconnected: true, sensor: true, restored: false });
  const { dark, setDark } = useTheme();
  const palette = getColors(dark);

  const toggle = (key) => setAlerts((a) => ({ ...a, [key]: !a[key] }));

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.surface }]}
      contentContainerStyle={[styles.content, { paddingTop: TOP + 28 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: palette.textStrong }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: palette.mutedText }]}>Manage your app and device preferences</Text>

      <Card title="Monitoring Settings" icon="sliders" style={styles.card}>
        <Row label="Measurement unit" sub="Raw ADC counts (not NTU)" right={<ValueText>0–4095</ValueText>} />
        <Row label="Water status limits" sub="Set in firmware after calibration" right={<ValueText>Not calibrated</ValueText>} />
      </Card>

      <Card title="Device & Connectivity" icon="cpu" style={[styles.card, { paddingBottom: 16 }]}>
        <Row label="Connected device" right={<ValueText>{device?.device_name || 'Aquasense ESP32-S3'}</ValueText>} />
        <Row
          label="Device status"
          right={<StatusPill text={device?.is_online ? 'Online' : 'Offline'} tone={device?.is_online ? 'green' : 'red'} />}
        />
        <Row label="Last server contact" right={<ValueText>{device?.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}</ValueText>} />
        <Row label="Device record" right={<ValueText>{device?.id ? `${device.id.slice(0, 8)}…` : 'Not found'}</ValueText>} />
        <Row
          label="Cloud access"
          right={<StatusPill text={device?.is_online ? 'Receiving data' : 'No recent data'} tone={device?.is_online ? 'green' : 'red'} />}
        />
        {(error || !isBackendConfigured) ? <Text style={[styles.note, { color: palette.mutedText }]}>{error || 'Set the Supabase URL, anon key, and device row UUID in front-end/.env.'}</Text> : null}
        <View style={styles.buttons}>
          <Button title="Change Wi-Fi Connection" icon="wifi" onPress={onOpenWifi} />
          <Button title="Configure Device via Bluetooth" icon="bluetooth" variant="ghost" onPress={onOpenWifi} />
        </View>
        <Text style={[styles.note, { color: palette.mutedText }]}>
          Bluetooth is only used to send new Wi-Fi details to your ESP32-S3. Sensor data always travels over Wi-Fi.
        </Text>
      </Card>

      <Card title="Troubleshooting" icon="info" style={styles.card}>
        <Text style={[styles.note, { color: palette.mutedText }]}>• Offline: check USB power, router range, and the 2.4 GHz Wi-Fi credentials in BLE setup.</Text>
        <Text style={[styles.note, { color: palette.mutedText }]}>• No readings: check sensor wiring, calibration, and Serial Monitor logs at 115200 baud.</Text>
        <Text style={[styles.note, { color: palette.mutedText }]}>• BLE setup fails: enable Bluetooth permissions, keep the ESP32 powered, and use the Aquasense development build.</Text>
        <Text style={[styles.note, { color: palette.mutedText }]}>• OLED blank: confirm its I²C address and GPIO assignments against your wiring.</Text>
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
            const on = dark === (o.key === 'dark');
            return (
              <Pressable key={o.key} onPress={() => setDark(o.key === 'dark')} style={[styles.segBtn, on && styles.segOn, on && { backgroundColor: palette.card }]}>
                <Icon name={o.icon} size={16} color={on ? palette.link : palette.mutedText} />
                <Text style={[styles.segText, { color: on ? palette.link : palette.mutedText }]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card title="About" icon="info" style={styles.card}>
        <Row label="App version" right={<ValueText bold={false}>1.0.0</ValueText>} />
        <Row label="Water sensor" right={<ValueText>Turbidity only</ValueText>} />
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
