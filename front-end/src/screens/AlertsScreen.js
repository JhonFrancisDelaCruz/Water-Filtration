import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Icon from '../components/Icon';
import { TOP } from '../components/Header';
import { colors, shadow } from '../constants/theme';

const ALERTS = [
  {
    id: 'high-turbidity',
    icon: 'alertTriangle',
    tileBg: '#FFE097',
    iconColor: '#E39A00',
    title: 'High Turbidity Detected',
    message: 'Water turbidity exceeded your warning threshold.',
    time: 'Today · 10:42 AM',
  },
  {
    id: 'normal',
    icon: 'checkCircle',
    tileBg: '#77E481',
    iconColor: '#2E9E5B',
    title: 'Water Condition Normal',
    message: 'Turbidity reading returned to normal.',
    time: 'Today · 10:35 AM',
  },
  {
    id: 'disconnected',
    icon: 'wifiOff',
    tileBg: '#FFA6A6',
    iconColor: '#E5484D',
    title: 'Device Disconnected',
    message: 'ESP32 stopped sending sensor readings.',
    time: 'Today · 9:18 AM',
  },
  {
    id: 'reconnected',
    icon: 'wifi',
    tileBg: '#A4C7FF',
    iconColor: '#2A6FDB',
    title: 'Device Reconnected',
    message: 'Your ESP32 is connected again.',
    time: 'Today · 9:22 AM',
  },
];

export default function AlertsScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: TOP + 28 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Stay informed about your system</Text>

      <Text style={styles.section}>Recent Alerts</Text>

      {ALERTS.map((a) => (
        <View key={a.id} style={[styles.card, shadow]}>
          <View style={[styles.tile, { backgroundColor: a.tileBg }]}>
            <Icon name={a.icon} size={13} color={a.iconColor} strokeWidth={2} />
          </View>
          <View style={styles.body}>
            <Text style={styles.cardTitle}>{a.title}</Text>
            <Text style={styles.message}>{a.message}</Text>
            <Text style={styles.time}>{a.time}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E9E9E9' },
  content: { paddingBottom: 96 },

  title: { marginHorizontal: 12, fontSize: 24, fontWeight: '700', color: '#000' },
  subtitle: { marginHorizontal: 12, fontSize: 11, color: colors.text, marginTop: 2 },
  section: {
    marginHorizontal: 12,
    marginTop: 14,
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 12,
    marginTop: 10,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: colors.card,
    borderRadius: 10,
  },
  tile: {
    width: 18,
    height: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  body: { flex: 1, marginLeft: 13 },
  cardTitle: { fontSize: 12, lineHeight: 14, fontWeight: '700', color: '#000' },
  message: { fontSize: 8, lineHeight: 10, color: colors.text, marginTop: 3 },
  time: { fontSize: 8, lineHeight: 10, color: colors.muted, marginTop: 2 },
});
