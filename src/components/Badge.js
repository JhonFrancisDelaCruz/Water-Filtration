import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function Badge({ text, tone = 'green', style }) {
  const isGreen = tone === 'green';
  return (
    <View style={[styles.badge, { backgroundColor: isGreen ? colors.badgeGreenBg : colors.badgeBlueBg }, style]}>
      <Text style={[styles.text, { color: isGreen ? colors.badgeGreenText : colors.badgeBlueText }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontSize: 11, fontWeight: '500' },
});
