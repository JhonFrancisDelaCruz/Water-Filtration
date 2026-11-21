import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Icon from '../components/Icon';
import Header from '../components/Header';
import Badge from '../components/Badge';
import TurbidityChart from '../components/TurbidityChart';
import { colors, shadow } from '../constants/theme';

const CURRENT_NTU = 2.4;
const LIVE_READINGS = [
  { label: '12:00', value: 5.1 },
  { label: '12:01', value: 4.25 },
  { label: '12:02', value: 3.4 },
  { label: '12:03', value: 2.55 },
  { label: '12:04', value: 1.7 },
];

export default function MonitorScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Header subtitle="Real-time turbidity sensor monitoring" />

      <View style={[styles.mainCard, shadow]}>
        <Icon name="droplets" size={30} color={colors.accent} strokeWidth={1.8} />
        <Text style={styles.mainLabel}>Current Turbidity</Text>
        <Text style={styles.mainValue}>{CURRENT_NTU} NTU</Text>
        <Badge text="Normal Condition" tone="green" style={styles.mainBadge} />
      </View>

      <View style={[styles.card, shadow]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.cardTitle}>Recent Turbidity Readings</Text>
            <Text style={styles.cardSub}>Live</Text>
          </View>
          <Badge text="Live" tone="green" style={styles.liveBadge} />
        </View>
        <View style={{ marginTop: 10 }}>
          <TurbidityChart data={LIVE_READINGS} />
        </View>
      </View>

      <View style={[styles.card, shadow]}>
        <Text style={styles.cardTitle}>Sensor Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Sensor Type</Text>
          <Text style={styles.infoValue}>Turbidity Sensor</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Connection</Text>
          <Text style={[styles.infoValue, { color: colors.accent }]}>Connected</Text>
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
