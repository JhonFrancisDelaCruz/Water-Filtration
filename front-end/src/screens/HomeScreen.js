import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Icon from '../components/Icon';
import Header from '../components/Header';
import Badge from '../components/Badge';
import TurbidityChart from '../components/TurbidityChart';
import { colors, getColors, shadow, useTheme } from '../constants/theme';
import { useAquasense } from '../services/useAquasense';
import { formatReading, isBackendConfigured } from '../services/supabase';

const statusTone = (status) => status === 'Good' ? 'green' : status === 'Warning' ? 'yellow' : status === 'Poor' ? 'red' : 'blue';

function SummaryCard({ icon, label, value, badge, tone }) {
  const { dark } = useTheme();
  const palette = getColors(dark);
  return (
    <View style={[styles.summaryCard, shadow, { backgroundColor: palette.card }]}>
      <Icon name={icon} size={18} color={palette.accent} />
      <Text style={[styles.summaryLabel, { color: palette.text }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: palette.value }]}>{value}</Text>
      <Badge text={badge} tone={tone} style={styles.smallBadge} />
    </View>
  );
}

export default function HomeScreen() {
  const { dark } = useTheme();
  const palette = getColors(dark);
  const { device, readings, loading, error } = useAquasense();
  const latest = readings[0];
  const chartData = readings.slice(0, 8).reverse().map((r) => ({ label: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), value: Number(r.turbidity_value) }));
  const status = latest?.water_status || 'No data';
  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: palette.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Header subtitle="Water Filtration Monitoring" />

      <View style={[styles.mainCard, shadow, { backgroundColor: palette.mintCard }]}>
        <Icon name="droplets" size={30} color={palette.accent} strokeWidth={1.8} />
        <Text style={[styles.mainLabel, { color: palette.text }]}>Latest turbidity reading (raw ADC)</Text>
        <Text style={[styles.mainValue, { color: palette.value }]}>{latest ? formatReading(latest.turbidity_value) : '--'}</Text>
        <Badge text={status} tone={statusTone(status)} style={styles.mainBadge} />
      </View>

      <View style={styles.row}>
        <SummaryCard icon="trend" label="Device" value={device?.device_name || 'Aquasense'} badge={device?.is_online ? 'Online' : 'Offline'} tone={device?.is_online ? 'green' : 'red'} />
        <SummaryCard icon="clock" label="Last Reading" value={latest ? new Date(latest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : loading ? 'Loading' : 'None'} badge={latest ? new Date(latest.created_at).toLocaleDateString() : 'Awaiting data'} tone="blue" />
      </View>

      <View style={[styles.chartCard, shadow, { backgroundColor: palette.card }]}>
        <Text style={[styles.chartTitle, { color: palette.textStrong }]}>Recent Turbidity Readings</Text>
        <Text style={[styles.chartSub, { color: palette.mutedText }]}>{error || (!isBackendConfigured ? 'Set app environment to connect' : `${readings.length} latest readings · raw ADC counts`)}</Text>
        <View style={{ marginTop: 10 }}>
          {chartData.length > 1 ? <TurbidityChart data={chartData} /> : <Text style={[styles.chartSub, { color: palette.mutedText }]}>Waiting for at least two readings.</Text>}
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
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
  },
  mainLabel: { marginTop: 14, fontSize: 13, color: colors.text },
  mainValue: { fontSize: 38, fontWeight: '700', color: colors.value, marginTop: 4 },
  mainBadge: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 12, paddingVertical: 3 },

  row: { flexDirection: 'row', gap: 20, marginHorizontal: 12, marginTop: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryLabel: { marginTop: 8, fontSize: 10, color: colors.text },
  summaryValue: { fontSize: 18, fontWeight: '700', color: colors.value, marginTop: 1 },
  smallBadge: { alignSelf: 'flex-start', marginTop: 4 },

  chartCard: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
  },
  chartTitle: { fontSize: 12, fontWeight: '600', color: colors.text },
  chartSub: { fontSize: 8, color: colors.muted, marginTop: 2 },
});
