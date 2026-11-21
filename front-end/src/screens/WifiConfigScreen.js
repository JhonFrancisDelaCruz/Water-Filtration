import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';
import StatusPill from '../components/StatusPill';
import SignalBars from '../components/SignalBars';
import Stepper from '../components/Stepper';
import { TOP } from '../components/Header';
import { colors, shadow } from '../constants/theme';
import { STEPS, connectDevice, scanNetworks, provisionWifi } from '../services/provisioning';

const LEVEL_TEXT = { 4: 'Excellent signal', 3: 'Good signal', 2: 'Fair signal', 1: 'Weak signal' };

function Field({ label, icon, right, focused, ...inputProps }) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocus]}>
        <Icon name={icon} size={18} color={colors.mutedText} />
        <TextInput style={styles.input} placeholderTextColor="#94A3B8" autoCapitalize="none" autoCorrect={false} {...inputProps} />
        {right}
      </View>
    </View>
  );
}

export default function WifiConfigScreen({ onBack }) {
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [deviceBusy, setDeviceBusy] = useState(false);
  const [deviceError, setDeviceError] = useState('');

  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [focus, setFocus] = useState(null);

  const [networks, setNetworks] = useState([]);
  const [scanning, setScanning] = useState(false);

  const [phase, setPhase] = useState('form'); // 'form' | 'running' | 'success' | 'failed'
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  const mounted = useRef(true);
  const cancelled = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelled.current = true;
    };
  }, []);

  const handleConnect = async () => {
    setDeviceBusy(true);
    setDeviceError('');
    try {
      await connectDevice();
      if (mounted.current) setDeviceConnected(true);
    } catch (_e) {
      if (mounted.current) setDeviceError('Could not find your ESP32-S3. Make sure it is powered on and nearby.');
    } finally {
      if (mounted.current) setDeviceBusy(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const list = await scanNetworks();
      if (mounted.current) setNetworks(list);
    } finally {
      if (mounted.current) setScanning(false);
    }
  };

  const handleSave = async () => {
    cancelled.current = false;
    setError('');
    setStep(0);
    setPhase('running');
    try {
      await provisionWifi(
        { ssid: ssid.trim(), password },
        {
          onStep: (i) => mounted.current && setStep(i),
          isCancelled: () => cancelled.current,
        }
      );
      if (!mounted.current) return;
      setStep(STEPS.length);
      setDeviceConnected(true);
      setPhase('success');
    } catch (e) {
      if (!mounted.current) return;
      if (e.code === 'CANCELLED') {
        setPhase('form');
        return;
      }
      setError(e.message);
      setPhase('failed');
    }
  };

  const handleCancel = () => {
    cancelled.current = true;
  };

  const selectNetwork = (n) => {
    setSsid(n.ssid);
    if (!n.secure) setPassword('');
  };

  const canSave = ssid.trim().length > 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: TOP + 8 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={onBack}
        disabled={phase === 'running'}
        accessibilityRole="button"
        accessibilityLabel="Back to Settings"
        style={[styles.back, shadow, phase === 'running' && { opacity: 0.4 }]}
      >
        <Icon name="arrowLeft" size={20} color={colors.textStrong} />
      </Pressable>
      <View>
        <Text style={styles.title}>Wi-Fi Configuration</Text>
        <Text style={styles.subtitle}>Connect your ESP32-S3 to a new Wi-Fi network</Text>
      </View>

      {phase === 'form' && (
        <>
          {/* Device connection */}
          <Card style={styles.pad}>
            <View style={styles.deviceRow}>
              <View style={styles.btChip}>
                <Icon name="bluetooth" size={24} color="#0E7490" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>AquaMonitor ESP32-S3</Text>
                <Text style={styles.deviceSub}>Bluetooth status</Text>
              </View>
              {deviceConnected ? (
                <StatusPill text="Connected" tone="green" />
              ) : (
                <StatusPill text="Not Connected" tone="red" />
              )}
            </View>
            {deviceError ? <Text style={styles.errorText}>{deviceError}</Text> : null}
            <Button
              title={deviceBusy ? 'Connecting…' : deviceConnected ? 'Reconnect to ESP32' : 'Connect to ESP32'}
              icon="bluetooth"
              variant={deviceConnected ? 'ghost' : 'primary'}
              disabled={deviceBusy}
              onPress={handleConnect}
              style={{ marginTop: 14 }}
            />
          </Card>

          {/* Wi-Fi configuration */}
          <Card style={styles.pad}>
            <View style={styles.sectionHead}>
              <Icon name="wifi" size={20} color={colors.accent} />
              <Text style={styles.sectionTitle}>New Wi-Fi network</Text>
            </View>

            <Field
              label="Wi-Fi Network Name (SSID)"
              icon="wifi"
              value={ssid}
              onChangeText={setSsid}
              placeholder="Network name"
              focused={focus === 'ssid'}
              onFocus={() => setFocus('ssid')}
              onBlur={() => setFocus(null)}
            />
            <View style={{ height: 14 }} />
            <Field
              label="Password"
              icon="lock"
              value={password}
              onChangeText={setPassword}
              placeholder="Wi-Fi password"
              secureTextEntry={!showPw}
              focused={focus === 'pw'}
              onFocus={() => setFocus('pw')}
              onBlur={() => setFocus(null)}
              right={
                <Pressable
                  onPress={() => setShowPw((v) => !v)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={showPw ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPw ? 'eyeOff' : 'eye'} size={20} color={colors.mutedText} />
                </Pressable>
              }
            />

            <Button
              title={scanning ? 'Scanning…' : 'Scan Wi-Fi Networks'}
              icon="refresh"
              variant="ghost"
              disabled={scanning || !deviceConnected}
              onPress={handleScan}
              style={{ marginTop: 16 }}
            />
            {!deviceConnected && (
              <Text style={styles.hint}>Connect to your ESP32-S3 first to scan for networks.</Text>
            )}

            {networks.length > 0 && (
              <>
                <View style={styles.listHead}>
                  <Text style={styles.listTitle}>Available networks</Text>
                  <Text style={styles.listCount}>{networks.length} found</Text>
                </View>
                {networks.map((n) => {
                  const sel = n.ssid === ssid;
                  return (
                    <Pressable
                      key={n.ssid}
                      onPress={() => selectNetwork(n)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sel }}
                      style={[styles.net, sel && styles.netSel]}
                    >
                      <SignalBars level={n.level} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.netName, sel && { fontWeight: '600' }]}>{n.ssid}</Text>
                        <Text style={styles.netSub}>
                          {LEVEL_TEXT[n.level]}
                          {n.secure ? '' : ' · Open network'}
                        </Text>
                      </View>
                      {n.secure ? <Icon name="lock" size={16} color={colors.mutedText} /> : null}
                      {sel ? <Icon name="check" size={18} color={colors.link} strokeWidth={2.4} /> : null}
                    </Pressable>
                  );
                })}
              </>
            )}

            <Text style={styles.hint}>
              {networks.length > 0 ? 'Tap a network to fill in its name. ' : ''}ESP32-S3 supports 2.4 GHz networks only.
            </Text>

            <Button title="Save & Connect" onPress={handleSave} disabled={!canSave} height={52} style={{ marginTop: 18 }} />
            <Text style={styles.footNote}>Your new Wi-Fi details are sent over Bluetooth. This takes about 20 seconds.</Text>
          </Card>
        </>
      )}

      {phase === 'running' && (
        <>
          <Card style={styles.pad}>
            <View style={styles.setupHead}>
              <View>
                <Text style={styles.deviceSub}>Setting up</Text>
                <Text style={styles.setupName}>{ssid}</Text>
              </View>
              <StatusPill
                tone="blue"
                dot={false}
                text={['Connecting', 'Sending credentials', 'Reconnecting', 'Verifying'][Math.min(step, 3)]}
              />
            </View>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${(step / STEPS.length) * 100 + 10}%` }]} />
            </View>
            <Stepper steps={STEPS} current={step} status="running" />
          </Card>
          <View style={styles.infoBox}>
            <Icon name="info" size={20} color="#0B4F73" />
            <Text style={styles.infoText}>Keep Bluetooth on and stay close to your ESP32-S3 until setup finishes.</Text>
          </View>
          <Button title="Cancel setup" variant="ghost" onPress={handleCancel} />
        </>
      )}

      {phase === 'success' && (
        <>
          <Card style={[styles.pad, { paddingBottom: 10 }]}>
            <View style={styles.center}>
              <View style={styles.okCircle}>
                <Icon name="check" size={44} color={colors.success} strokeWidth={2.4} />
              </View>
              <Text style={styles.okTitle}>Wi-Fi Connected</Text>
              <Text style={styles.okText}>Your ESP32-S3 is now using the new network and sending readings over Wi-Fi.</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Connected network</Text>
              <Text style={styles.sumValue}>{ssid}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>ESP32 status</Text>
              <StatusPill text="Online" tone="green" />
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Internet check</Text>
              <StatusPill text="Verified" tone="green" />
            </View>
          </Card>
          <View style={styles.infoBox}>
            <Icon name="bluetooth" size={20} color="#0B4F73" />
            <Text style={styles.infoText}>Bluetooth is no longer needed. You can change the network again anytime from Settings.</Text>
          </View>
          <Button title="Done" onPress={onBack} height={52} />
        </>
      )}

      {phase === 'failed' && (
        <>
          <Card style={styles.pad}>
            <View style={styles.errBox}>
              <View style={styles.errIcon}>
                <Icon name="x" size={20} color="#fff" strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.errTitle}>Couldn’t connect to Wi-Fi</Text>
                <Text style={styles.errText}>{error}</Text>
              </View>
            </View>
            <View style={{ marginTop: 20 }}>
              <Stepper steps={STEPS} current={Math.min(step, 2)} status="failed" failText="Failed after 20 seconds" />
            </View>
          </Card>
          <Card title="Things to check" style={{ paddingBottom: 14 }}>
            {[
              'The password is typed exactly right, including capital letters.',
              'The network is 2.4 GHz. ESP32-S3 can’t join 5 GHz networks.',
              'The ESP32-S3 is within range of your router.',
            ].map((t) => (
              <View key={t} style={styles.tip}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{t}</Text>
              </View>
            ))}
          </Card>
          <Button title="Retry" icon="refresh" onPress={handleSave} height={50} />
          <Button title="Edit Wi-Fi details" variant="ghost" onPress={() => setPhase('form')} height={50} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  title: { fontSize: 26, fontWeight: '700', color: colors.textStrong, letterSpacing: -0.4 },
  subtitle: { fontSize: 13, color: colors.mutedText, marginTop: 4 },
  pad: { paddingTop: 16, paddingBottom: 16 },

  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btChip: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#DDF4F8', alignItems: 'center', justifyContent: 'center' },
  deviceName: { fontSize: 15, fontWeight: '600', color: colors.textStrong },
  deviceSub: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  errorText: { fontSize: 12, color: colors.danger, marginTop: 10, lineHeight: 17 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.textStrong },
  label: { fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#fff' },
  fieldFocus: { borderColor: colors.accent },
  input: { flex: 1, fontSize: 14, color: colors.textStrong, paddingVertical: 0 },

  hint: { fontSize: 12, lineHeight: 17, color: colors.mutedText, marginTop: 10, paddingHorizontal: 2 },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 18, marginBottom: 6 },
  listTitle: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  listCount: { fontSize: 12, color: colors.mutedText },
  net: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 54, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent' },
  netSel: { backgroundColor: '#E8F5FD', borderColor: colors.accent },
  netName: { fontSize: 14, color: '#1F2937' },
  netSub: { fontSize: 11, color: colors.mutedText, marginTop: 1 },
  footNote: { fontSize: 12, lineHeight: 17, color: colors.mutedText, marginTop: 12, textAlign: 'center' },

  setupHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  setupName: { fontSize: 17, fontWeight: '700', color: colors.textStrong, marginTop: 2 },
  bar: { height: 8, borderRadius: 4, backgroundColor: '#E1E9F0', marginTop: 16, marginBottom: 22, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: colors.accent },
  infoBox: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 14, backgroundColor: colors.softBlue },
  infoText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: '#0B4F73' },

  center: { alignItems: 'center', paddingTop: 8, paddingBottom: 20 },
  okCircle: { width: 108, height: 108, borderRadius: 54, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center', borderWidth: 10, borderColor: '#EAF8F0' },
  okTitle: { fontSize: 22, fontWeight: '700', color: colors.textStrong, marginTop: 26 },
  okText: { fontSize: 13, lineHeight: 19, color: colors.mutedText, textAlign: 'center', marginTop: 6, maxWidth: 260 },
  sumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  sumLabel: { fontSize: 14, color: '#1F2937' },
  sumValue: { fontSize: 13, fontWeight: '600', color: colors.link },

  errBox: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: 14, backgroundColor: colors.dangerBg },
  errIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  errTitle: { fontSize: 15, fontWeight: '700', color: '#8A1C12' },
  errText: { fontSize: 12.5, lineHeight: 18, color: '#7A2A22', marginTop: 3 },
  tip: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger, marginTop: 7 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19, color: '#1F2937' },
});
