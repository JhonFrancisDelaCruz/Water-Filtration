import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { BackHandler, StyleSheet, View } from 'react-native';

import BottomNav from '../components/BottomNav';
import HistoryScreen from '../screens/HistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import AlertsScreen from '../screens/AlertsScreen';
import MonitorScreen from '../screens/MonitorScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WifiConfigScreen from '../screens/WifiConfigScreen';
import { getColors, ThemeContext } from '../constants/theme';

export default function Index() {
  type Tab = 'home' | 'monitor' | 'history' | 'alerts' | 'settings';
  const [tab, setTab] = useState<Tab>('home');
  const [wifiOpen, setWifiOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const colors = getColors(dark);

  // Android hardware back button closes the Wi-Fi page first.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (wifiOpen) {
        setWifiOpen(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [wifiOpen]);

  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={dark ? 'light' : 'dark'} />

      {tab === 'home' && <HomeScreen />}
      {tab === 'monitor' && <MonitorScreen />}
      {tab === 'history' && <HistoryScreen />}
      {tab === 'settings' && <SettingsScreen onOpenWifi={() => setWifiOpen(true)} />}
      {tab === 'alerts' && <AlertsScreen />}

      {wifiOpen ? (
        <View style={StyleSheet.absoluteFill}>
          <StatusBar style={dark ? 'light' : 'dark'} />
          <WifiConfigScreen onBack={() => setWifiOpen(false)} />
        </View>
      ) : (
        <BottomNav active={tab} onChange={setTab} />
      )}
    </View>
    </ThemeContext.Provider>
  );
}
