import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Icon from './Icon';
import { colors, getColors, useTheme } from '../constants/theme';

// variant: 'primary' (filled blue) | 'ghost' (outlined)
export default function Button({ title, icon, variant = 'primary', onPress, disabled, style, height = 48 }) {
  const { dark } = useTheme();
  const palette = getColors(dark);
  const primary = variant === 'primary';
  const fg = primary ? '#fff' : palette.link;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        { height },
        primary ? [styles.primary, { backgroundColor: palette.buttonBg }] : [styles.ghost, { backgroundColor: palette.card, borderColor: palette.border }],
        disabled && styles.disabled,
        pressed && !disabled && { opacity: 0.85 },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.text, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
  },
  primary: {
    backgroundColor: colors.buttonBg,
    shadowColor: colors.buttonBg,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  ghost: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#9FD3EE' },
  disabled: { opacity: 0.5 },
  text: { fontSize: 14, fontWeight: '600' },
});
