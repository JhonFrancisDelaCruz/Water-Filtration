import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Icon from '../components/Icon';
import { TOP } from '../components/Header';
import { colors, getColors, shadow, useTheme } from '../constants/theme';
import { getAlerts, isBackendConfigured, markAlertRead } from '../services/supabase';

export default function AlertsScreen() {
  const { dark } = useTheme();
  const palette = getColors(dark);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const load = useCallback(() => getAlerts().then((rows) => { setAlerts(rows); setError(''); }).catch((e) => setError(e?.message || 'Could not load alerts.')), []);
  useEffect(() => { load(); const timer = setInterval(load, 15000); return () => clearInterval(timer); }, [load]);
  const read = async (id) => {
    try { await markAlertRead(id); setAlerts((list) => list.map((a) => a.id === id ? { ...a, is_read: true } : a)); }
    catch (e) { setError(e?.message || 'Could not update alert.'); }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: palette.background }]} contentContainerStyle={[styles.content, { paddingTop: TOP + 28 }]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: palette.textStrong }]}>Alerts</Text>
      <Text style={[styles.subtitle, { color: palette.mutedText }]}>Water quality warnings from your device</Text>
      {error ? <Text style={[styles.message, { color: palette.mutedText }]}>{error}</Text> : null}
      {!isBackendConfigured ? <Text style={[styles.message, { color: palette.mutedText }]}>Configure the Supabase app environment to load alerts.</Text> : null}
      {alerts.map((a) => {
        const poor = a.severity?.toLowerCase() === 'poor' || a.severity?.toLowerCase() === 'critical';
        return <View key={a.id} style={[styles.card, shadow, { backgroundColor: palette.card }, !a.is_read && styles.unread]}>
          <View style={[styles.tile, { backgroundColor: poor ? '#FEE2E2' : '#FEF3C7' }]}><Icon name="alertTriangle" size={18} color={poor ? '#DC2626' : '#D97706'} /></View>
          <View style={styles.body}><Text style={[styles.cardTitle, { color: palette.textStrong }]}>{a.message}</Text><Text style={[styles.severity, { color: palette.link }]}>{a.severity}</Text><Text style={[styles.time, { color: palette.mutedText }]}>{new Date(a.created_at).toLocaleString()}</Text></View>
          {!a.is_read && <Pressable accessibilityRole="button" accessibilityLabel="Mark alert as read" onPress={() => read(a.id)} style={styles.readButton}><Text style={styles.readText}>Mark read</Text></Pressable>}
        </View>;
      })}
      {isBackendConfigured && alerts.length === 0 ? <Text style={[styles.message, { color: palette.mutedText }]}>No alerts to show.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EEF4FA' }, content: { paddingBottom: 96 },
  title: { marginHorizontal: 12, fontSize: 24, fontWeight: '700', color: '#000' }, subtitle: { marginHorizontal: 12, fontSize: 12, color: colors.text, marginTop: 3, marginBottom: 12 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginHorizontal: 12, marginTop: 10, padding: 14, backgroundColor: colors.card, borderRadius: 14 }, unread: { borderLeftWidth: 3, borderLeftColor: colors.primary }, tile: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, body: { flex: 1 }, cardTitle: { fontSize: 13, fontWeight: '600', color: '#111827' }, severity: { fontSize: 11, color: colors.primary, marginTop: 3 }, time: { fontSize: 10, color: colors.muted, marginTop: 5 }, readButton: { padding: 4 }, readText: { color: colors.primary, fontSize: 11, fontWeight: '600' }, message: { marginHorizontal: 14, marginVertical: 12, fontSize: 12, color: colors.mutedText },
});
