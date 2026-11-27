import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from './Icon';
import { getColors, useTheme } from '../constants/theme';

const ITEMS = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'monitor', label: 'Monitor', icon: 'activity' },
  { key: 'history', label: 'History', icon: 'history' },
  { key: 'alerts', label: 'Alerts', icon: 'bell' },
  { key: 'settings', label: 'Setting', icon: 'settings' },
];

/**
 * @param {{ active?: 'home' | 'monitor' | 'history' | 'alerts' | 'settings', onChange?: (key: 'home' | 'monitor' | 'history' | 'alerts' | 'settings') => void }} props
 */
export default function BottomNav({ active = 'home', onChange = () => {} }) {
  const { dark } = useTheme();
  const colors = getColors(dark);
  return (
    <View style={[styles.bar, { backgroundColor: colors.navBg, borderTopColor: colors.border }]}>
      {ITEMS.map((item) => {
        const color = item.key === active ? colors.accent : colors.inactive;
        return (
          <Pressable key={item.key} style={styles.item} onPress={() => onChange(item.key)}>
            <Icon name={item.icon} size={18} color={color} strokeWidth={1.8} />
            <Text style={[styles.label, { color }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    paddingTop: 12,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D5E6EF',
  },
  item: { flex: 1, alignItems: 'center', gap: 6 },
  label: { fontSize: 8 },
});
