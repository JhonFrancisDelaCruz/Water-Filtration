import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Icon from '../components/Icon';
import Header from '../components/Header';
import Badge from '../components/Badge';
import TurbidityChart from '../components/TurbidityChart';
import { colors, shadow } from '../constants/theme';

// Sample data: the project has a single turbidity sensor.
const CURRENT_NTU = 2.4;
const READINGS = [
  { label: '8 AM', value: 5.1 },
  { label: '9 AM', value: 4.25 },
  { label: '10 AM', value: 3.4 },
  { label: '11 AM', value: 2.55 },
  { label: '12 AM', value: 1.7 },
];

function SummaryCard({ icon, label, value, badge, tone }) {
  return (
    <View style={[styles.summaryCard, shadow]}>
      <Icon name={icon} size={18} color={colors.accent} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Badge text={badge} tone={tone} style={styles.smallBadge} />
    </View>
  );
}

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Header subtitle="Water Filtration Monitoring" />

      <View style={[styles.mainCard, shadow]}>
        <Icon name="droplets" size={30} color={colors.accent} strokeWidth={1.8} />
        <Text style={styles.mainLabel}>Turbidity Reading</Text>
        <Text style={styles.mainValue}>{CURRENT_NTU} NTU</Text>
        <Badge text="Normal" tone="green" style={styles.mainBadge} />
      </View>

      <View style={styles.row}>
        <SummaryCard icon="trend" label="Water Quality" value="Clear" badge="Within threshold" tone="green" />
        <SummaryCard icon="clock" label="Last Reading" value="Now" badge="Within threshold" tone="blue" />
      </View>

      <View style={[styles.chartCard, shadow]}>
        <Text style={styles.chartTitle}>Recent Turbidity Readings</Text>
        <Text style={styles.chartSub}>Sample data</Text>
        <View style={{ marginTop: 10 }}>
          <TurbidityChart data={READINGS} />
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
