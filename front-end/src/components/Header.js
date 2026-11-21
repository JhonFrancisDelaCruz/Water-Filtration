import React from 'react';
import { View, Text, StatusBar, Platform, StyleSheet } from 'react-native';
import Icon from './Icon';
import { colors } from '../constants/theme';

export const TOP = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 54;

// Blue rounded header. Place it as the first child of a ScrollView;
// the blue background is absolutely positioned so it extends behind the first card.
export default function Header({ subtitle }) {
  return (
    <>
      <View style={styles.bg} />
      <View style={[styles.text, { paddingTop: TOP }]}>
        <View style={styles.bell}>
          <Icon name="bell" size={22} color="#fff" strokeWidth={2.2} />
        </View>
        <Text style={styles.title}>AquaMonitor</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 205,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
  },
  text: { paddingHorizontal: 12, height: 143 },
  bell: { position: 'absolute', right: 20, top: TOP - 4 },
  title: { marginTop: 36, color: '#fff', fontSize: 30, fontWeight: '700' },
  subtitle: { color: '#fff', fontSize: 14, marginTop: 2 },
});
