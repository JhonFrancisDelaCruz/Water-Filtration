import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function Badge({ text, tone = 'green', style }) {
  const palette = {
    green: [colors.badgeGreenBg, colors.badgeGreenText],
    blue: [colors.badgeBlueBg, colors.badgeBlueText],
    yellow: ['#FEF3C7', '#A16207'],
    red: [colors.dangerBg, colors.danger],
  }[tone] || [colors.badgeBlueBg, colors.badgeBlueText];
  return (
    <View style={[styles.badge, { backgroundColor: palette[0] }, style]}>
      <Text style={[styles.text, { color: palette[1] }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontSize: 11, fontWeight: '500' },
});
