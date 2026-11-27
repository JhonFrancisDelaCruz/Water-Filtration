import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Icon from '../components/Icon';
import Header from '../components/Header';
import Badge from '../components/Badge';
import TurbidityChart from '../components/TurbidityChart';
import { colors, getColors, shadow, useTheme } from '../constants/theme';
import { useAquasense } from '../services/useAquasense';
import { formatReading, isBackendConfigured } from '../services/supabase';

export default function MonitorScreen() {
  const { dark } = useTheme();
  const palette = getColors(dark);
  const { device, readings, loading, error } = useAquasense(10000);
  const latest = readings[0];
  const chartData = readings.slice(0, 12).reverse().map((r) => ({ label: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: Number(r.turbidity_value) }));
  const status = latest?.water_status || 'No data';
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Header subtitle="Real-time turbidity sensor monitoring" />

      <View style={[styles.mainCard, shadow, { backgroundColor: palette.mintCard }]}>
        <Icon name="droplets" size={30} color={palette.accent} strokeWidth={1.8} />
        <Text style={[styles.mainLabel, { color: palette.text }]}>Current turbidity · raw ADC</Text>
        <Text style={styles.mainValue}>{latest ? formatReading(latest.turbidity_value) : loading ? 'Loading…' : '--'}</Text>
        <Badge text={status} tone={status === 'Good' ? 'green' : status === 'Poor' ? 'red' : status === 'Warning' ? 'yellow' : 'blue'} style={styles.mainBadge} />
      </View>

      <View style={[styles.card, shadow, { backgroundColor: palette.card }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.cardTitle, { color: palette.textStrong }]}>Recent Turbidity Readings</Text>
            <Text style={[styles.cardSub, { color: palette.mutedText }]}>{error || (!isBackendConfigured ? 'App backend configuration required' : 'Updates every 10 seconds')}</Text>
          </View>
          <Badge text={device?.is_online ? 'Online' : 'Offline'} tone={device?.is_online ? 'green' : 'red'} style={styles.liveBadge} />
        </View>
        <View style={{ marginTop: 10 }}>
          {chartData.length > 1 ? <TurbidityChart data={chartData} /> : <Text style={[styles.cardSub, { color: palette.mutedText }]}>Waiting for at least two readings.</Text>}
        </View>
      </View>

      <View style={[styles.card, shadow, { backgroundColor: palette.card }]}>
        <Text style={[styles.cardTitle, { color: palette.textStrong }]}>Sensor Information</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: palette.text }]}>Sensor Type</Text>
          <Text style={[styles.infoValue, { color: palette.text }]}>Turbidity Sensor</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: palette.text }]}>Connection</Text>
          <Text style={[styles.infoValue, { color: device?.is_online ? colors.accent : '#DC2626' }]}>{device?.is_online ? 'Online' : 'Offline'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: palette.text }]}>Last server contact</Text>
          <Text style={[styles.infoValue, { color: palette.text }]}>{device?.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 96 },

  mainCard: {
    marginHorizontal: 12,
    backgroundColor: colors.mintCard,
    borderRadius: 20,
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 18,
  },
  mainLabel: { marginTop: 8, fontSize: 13, color: colors.text },
  mainValue: { fontSize: 38, fontWeight: '700', color: colors.value, marginTop: 2 },
  mainBadge: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 3 },

  card: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 12, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: 8, color: colors.muted, marginTop: 2 },
  liveBadge: { paddingVertical: 1 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  infoLabel: { fontSize: 10, color: colors.text },
  infoValue: { fontSize: 10, color: colors.text },
});
