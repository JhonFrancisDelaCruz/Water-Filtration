import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Badge from '../components/Badge';
import TurbidityChart from '../components/TurbidityChart';
import { TOP } from '../components/Header';
import { colors, shadow } from '../constants/theme';

const PERIODS = ['Day', 'Week', 'Month'];
const TREND = [
  { label: '12:00', value: 5.1 },
  { label: '12:01', value: 4.25 },
  { label: '12:02', value: 3.4 },
  { label: '12:03', value: 2.55 },
  { label: '12:04', value: 1.7 },
];
const RECORDS = [
  { time: '4:00 PM', ntu: 2.55 },
  { time: '5:00 PM', ntu: 2.55 },
  { time: '6:00 PM', ntu: 2.55 },
  { time: '7:00 PM', ntu: 2.55 },
  { time: '8:00 PM', ntu: 2.55 },
];

export default function HistoryScreen() {
  const [period, setPeriod] = useState('Day');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: TOP + 28 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Reading History</Text>
      <Text style={styles.subtitle}>Review previous water turbidity readings</Text>

      <View style={[styles.card, shadow, { marginTop: 10 }]}>
        <Text style={styles.cardTitle}>Select Period</Text>
        <View style={styles.periodRow}>
          {PERIODS.map((p) => {
            const active = p === period;
            return (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                style={[styles.periodBtn, active && styles.periodBtnActive]}
              >
                <Text style={[styles.periodText, active && { color: '#fff' }]}>{p}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, shadow]}>
        <Text style={styles.cardTitle}>Turbidity Trend</Text>
        <Text style={styles.cardSub}>Today&apos;s readings (sample)</Text>
        <View style={{ marginTop: 10 }}>
          <TurbidityChart data={TREND} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.statCard, shadow]}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>3.46 NTU</Text>
        </View>
        <View style={[styles.statCard, shadow]}>
          <Text style={styles.statLabel}>Highest</Text>
          <Text style={[styles.statValue, { color: '#F5A800' }]}>4.8 NTU</Text>
        </View>
      </View>

      <View style={[styles.card, shadow]}>
        <Text style={styles.cardTitle}>Recorded Readings</Text>
        <View style={styles.tableHead}>
          <Text style={[styles.th, { flex: 1 }]}>Time</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>NTU</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Status</Text>
        </View>
        {RECORDS.map((r) => (
          <View key={r.time} style={styles.tr}>
            <Text style={[styles.td, { flex: 1 }]}>{r.time}</Text>
            <Text style={[styles.td, { flex: 1, textAlign: 'center' }]}>{r.ntu} NTU</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Badge text="Normal" tone="green" style={styles.rowBadge} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 96 },

  title: { marginHorizontal: 12, fontSize: 24, fontWeight: '700', color: '#000' },
  subtitle: { marginHorizontal: 12, fontSize: 11, color: colors.text, marginTop: 2 },

  card: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
  },
  cardTitle: { fontSize: 12, fontWeight: '600', color: colors.text },
  cardSub: { fontSize: 8, color: colors.muted, marginTop: 2 },

  periodRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  periodBtn: {
    flex: 1,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBtnActive: { backgroundColor: colors.primary },
  periodText: { fontSize: 12, color: colors.muted },

  row: { flexDirection: 'row', gap: 12, marginHorizontal: 12, marginTop: 12 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14 },
  statLabel: { fontSize: 10, color: colors.text },
  statValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },

  tableHead: {
    flexDirection: 'row',
    marginTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.muted,
  },
  th: { fontSize: 9, color: colors.text },
  tr: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  td: { fontSize: 9, color: colors.text },
  rowBadge: { paddingVertical: 1 },
});
