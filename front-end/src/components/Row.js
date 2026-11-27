import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from './Icon';
import { colors, getColors, useTheme } from '../constants/theme';

// A settings row: label (+ optional sub text) on the left, anything on the right.
export default function Row({ label, sub, right, chevron = false, onPress }) {
  const { dark } = useTheme();
  const palette = getColors(dark);
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={[styles.row, sub && styles.tall, { borderTopColor: palette.divider }]}>
      <View style={styles.left}>
        <Text style={[styles.label, { color: palette.textStrong }]}>{label}</Text>
        {sub ? <Text style={[styles.sub, { color: palette.mutedText }]}>{sub}</Text> : null}
      </View>
      {right}
      {chevron ? <Icon name="chevronRight" size={18} color="#94A3B8" /> : null}
    </Wrapper>
  );
}

export function ValueText({ children, bold = true }) {
  const { dark } = useTheme();
  const palette = getColors(dark);
  return <Text style={[bold ? styles.valueBold : styles.value, { color: bold ? palette.link : palette.mutedText }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 46,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  tall: { minHeight: 58 },
  left: { flex: 1 },
  label: { fontSize: 14, color: '#1F2937' },
  sub: { fontSize: 12, color: colors.mutedText, marginTop: 2, lineHeight: 16 },
  value: { fontSize: 13, color: colors.mutedText },
  valueBold: { fontSize: 13, fontWeight: '600', color: colors.link },
});
