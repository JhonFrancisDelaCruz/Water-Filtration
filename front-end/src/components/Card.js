import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { colors, getColors, shadow, useTheme } from '../constants/theme';

// White rounded card with an optional icon + title header.
export default function Card({ title, icon, children, style }) {
  const { dark } = useTheme();
  const palette = getColors(dark);
  return (
    <View style={[styles.card, shadow, style, { backgroundColor: palette.card }]}>
      {title ? (
        <View style={styles.header}>
          {icon ? <Icon name={icon} size={20} color={palette.accent} /> : null}
          <Text style={[styles.title, { color: palette.textStrong }]}>{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 14, paddingBottom: 10 },
  title: { fontSize: 15, fontWeight: '600', color: colors.textStrong },
});
