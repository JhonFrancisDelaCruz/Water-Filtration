import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

const TONES = {
  green: { bg: colors.successBg, fg: colors.success, dot: '#22A35A' },
  red: { bg: colors.dangerBg, fg: colors.danger, dot: colors.danger },
  blue: { bg: '#DFF1FC', fg: colors.link, dot: colors.accent },
};

export default function StatusPill({ text, tone = 'green', dot = true }) {
  const t = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: t.dot }]} /> : null}
      <Text style={[styles.text, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '600' },
});
