import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { BackHandler, StyleSheet, Text, View } from 'react-native';

import BottomNav from '../components/BottomNav';
import HistoryScreen from '../screens/HistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import MonitorScreen from '../screens/MonitorScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WifiConfigScreen from '../screens/WifiConfigScreen';

export default function Index() {
  type Tab = 'home' | 'monitor' | 'history' | 'alerts' | 'settings';
  const [tab, setTab] = useState<Tab>('home');
  const [wifiOpen, setWifiOpen] = useState(false);

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

  const darkContent = tab === 'history' || tab === 'settings';

  return (
    <View style={{ flex: 1, backgroundColor: '#EEF4FA' }}>
      <StatusBar
        style={darkContent ? 'dark' : 'light'}
      />

      {tab === 'home' && <HomeScreen />}
      {tab === 'monitor' && <MonitorScreen />}
      {tab === 'history' && <HistoryScreen />}
      {tab === 'settings' && <SettingsScreen onOpenWifi={() => setWifiOpen(true)} />}
      {tab === 'alerts' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#6B7280' }}>Coming soon</Text>
        </View>
      )}

      {wifiOpen ? (
        <View style={StyleSheet.absoluteFill}>
          <StatusBar style="dark" />
          <WifiConfigScreen onBack={() => setWifiOpen(false)} />
        </View>
      ) : (
        <BottomNav active={tab} onChange={setTab} />
      )}
    </View>
  );
}
