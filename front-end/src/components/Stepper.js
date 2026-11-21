import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from './Icon';
import { colors } from '../constants/theme';

// steps: string[]
// current: index of the step being worked on (steps.length = all finished)
// status: 'running' | 'failed'  (applies to the current step)
export default function Stepper({ steps, current, status = 'running', failText = 'Failed' }) {
  return (
    <View>
      {steps.map((label, i) => {
        const state =
          i < current ? 'done' : i === current ? (status === 'failed' ? 'bad' : 'now') : 'wait';
        const last = i === steps.length - 1;
        return (
          <View key={label} style={[styles.step, !last && { paddingBottom: 22 }]}>
            {!last && (
              <View style={[styles.line, state === 'done' && { backgroundColor: colors.accent }]} />
            )}
            <View style={[styles.dot, dotStyle[state]]}>
              {state === 'done' && <Icon name="check" size={16} color="#fff" strokeWidth={3} />}
              {state === 'bad' && <Icon name="x" size={16} color="#fff" strokeWidth={3} />}
              {state === 'now' && <ActivityIndicator size="small" color={colors.accent} />}
              {state === 'wait' && <Text style={styles.num}>{i + 1}</Text>}
            </View>
            <View style={styles.texts}>
              <Text style={[styles.title, state === 'wait' && styles.titleWait, state === 'bad' && { color: colors.danger }]}>
                {label}
              </Text>
              {state === 'now' && <Text style={styles.now}>In progress…</Text>}
              {state === 'bad' && <Text style={styles.bad}>{failText}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const dotStyle = StyleSheet.create({
  done: { backgroundColor: colors.accent },
  now: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#CFE8F7' },
  bad: { backgroundColor: colors.danger },
  wait: { backgroundColor: '#fff', borderWidth: 2, borderColor: colors.border },
});

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: 14 },
  line: { position: 'absolute', left: 15, top: 34, bottom: 2, width: 2, backgroundColor: '#E1E9F0' },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 13, fontWeight: '600', color: colors.mutedText },
  texts: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '600', color: colors.textStrong },
  titleWait: { fontWeight: '500', color: colors.mutedText },
  now: { fontSize: 12, fontWeight: '600', color: colors.link, marginTop: 2 },
  bad: { fontSize: 12, fontWeight: '600', color: colors.danger, marginTop: 2 },
});
