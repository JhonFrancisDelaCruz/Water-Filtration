import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Badge from '../components/Badge';
import TurbidityChart from '../components/TurbidityChart';
import { TOP } from '../components/Header';
import { colors, getColors, shadow, useTheme } from '../constants/theme';
import { getReadings, isBackendConfigured } from '../services/supabase';

const PERIODS = ['Day', 'Week', 'Month'];
function periodStart(period) {
  const date = new Date();
  if (period === 'Day') date.setHours(0, 0, 0, 0);
  else if (period === 'Week') date.setDate(date.getDate() - 7);
  else date.setMonth(date.getMonth() - 1);
  return date.toISOString();
}

export default function HistoryScreen() {
  const { dark } = useTheme();
  const palette = getColors(dark);
  const [period, setPeriod] = useState('Day');
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    getReadings({ from: periodStart(period) })
      .then((rows) => { if (active) { setRecords(rows); setError(''); } })
      .catch((e) => { if (active) setError(e?.message || 'Could not load reading history.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [period]);

  const ascending = [...records].reverse();
  const values = records.map((r) => Number(r.turbidity_value)).filter(Number.isFinite);
  const average = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const highest = values.length ? Math.max(...values) : null;
  const graph = ascending.filter((_, index) => index % Math.max(1, Math.ceil(ascending.length / 24)) === 0).slice(-24).map((r) => ({ label: new Date(r.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), value: Number(r.turbidity_value) }));
  const visibleRecords = records.slice(0, 500);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: palette.background }]} contentContainerStyle={[styles.content, { paddingTop: TOP + 28 }]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: palette.textStrong }]}>Reading History</Text>
      <Text style={[styles.subtitle, { color: palette.mutedText }]}>Turbidity measurements · raw ADC counts</Text>
      <View style={[styles.card, shadow, { backgroundColor: palette.card }]}>
        <Text style={[styles.cardTitle, { color: palette.textStrong }]}>Date range</Text>
        <View style={styles.periodRow}>{PERIODS.map((p) => <Pressable key={p} onPress={() => setPeriod(p)} style={[styles.periodBtn, period === p && styles.periodBtnActive, { backgroundColor: period === p ? palette.primary : palette.surface }]}><Text style={[styles.periodText, { color: period === p ? '#fff' : palette.mutedText }]}>{p}</Text></Pressable>)}</View>
      </View>
      <View style={[styles.card, shadow, { backgroundColor: palette.card }]}>
        <Text style={[styles.cardTitle, { color: palette.textStrong }]}>Turbidity trend</Text>
        <Text style={[styles.cardSub, { color: palette.mutedText }]}>{error || (!isBackendConfigured ? 'Set app environment to connect' : `${records.length} readings · ${period.toLowerCase()}`)}</Text>
        {graph.length > 1 ? <TurbidityChart data={graph} /> : <Text style={[styles.empty, { color: palette.mutedText }]}>{loading ? 'Loading readings…' : 'No readings in this period yet.'}</Text>}
      </View>
      <View style={styles.row}>
        <View style={[styles.statCard, shadow, { backgroundColor: palette.card }]}><Text style={[styles.statLabel, { color: palette.text }]}>Average</Text><Text style={[styles.statValue, { color: palette.primary }]}>{average == null ? '—' : `${average.toFixed(0)} ADC`}</Text></View>
        <View style={[styles.statCard, shadow, { backgroundColor: palette.card }]}><Text style={[styles.statLabel, { color: palette.text }]}>Highest</Text><Text style={[styles.statValue, { color: '#F5A800' }]}>{highest == null ? '—' : `${highest.toFixed(0)} ADC`}</Text></View>
      </View>
      <View style={[styles.card, shadow, { backgroundColor: palette.card }]}>
        <Text style={[styles.cardTitle, { color: palette.textStrong }]}>Recorded readings</Text>
        {visibleRecords.map((r) => <View key={r.id} style={styles.tr}><View style={{ flex: 1 }}><Text style={[styles.td, { color: palette.text }]}>{new Date(r.created_at).toLocaleString()}</Text></View><Text style={[styles.td, { color: palette.text }]}>{Number(r.turbidity_value).toFixed(0)} ADC</Text><Badge text={r.water_status} tone={r.water_status === 'Good' ? 'green' : r.water_status === 'Poor' ? 'red' : r.water_status === 'Warning' ? 'yellow' : 'blue'} /></View>)}
        {records.length > visibleRecords.length && <Text style={[styles.empty, { color: palette.mutedText }]}>Showing the latest {visibleRecords.length} readings. Statistics and trend use all {records.length} readings in this period.</Text>}
        {!records.length && !loading && <Text style={[styles.empty, { color: palette.mutedText }]}>No records to show.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { paddingBottom: 96 },
  title: { marginHorizontal: 12, fontSize: 24, fontWeight: '700', color: '#000' }, subtitle: { marginHorizontal: 12, fontSize: 11, color: colors.text, marginTop: 2 },
  card: { marginHorizontal: 12, marginTop: 12, backgroundColor: colors.card, borderRadius: 16, padding: 14 }, cardTitle: { fontSize: 13, fontWeight: '600', color: colors.text }, cardSub: { fontSize: 11, color: colors.muted, marginTop: 3 },
  periodRow: { flexDirection: 'row', gap: 12, marginTop: 10 }, periodBtn: { flex: 1, height: 34, borderRadius: 7, backgroundColor: '#E4E4E7', alignItems: 'center', justifyContent: 'center' }, periodBtnActive: { backgroundColor: colors.primary }, periodText: { fontSize: 12, color: colors.muted },
  row: { flexDirection: 'row', gap: 12, marginHorizontal: 12, marginTop: 12 }, statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14 }, statLabel: { fontSize: 11, color: colors.text }, statValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  tr: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.muted }, td: { fontSize: 11, color: colors.text }, empty: { fontSize: 12, color: colors.muted, paddingVertical: 18 },
});
