import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Keyboard, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

const todayKey = () => {
  const d = new Date();
  const iso = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0,10);
  return `calories:${iso}`;
};
const goalKey = 'calorie_goal';

// Circular gauge for calories (goal vs current)
function CalorieGauge({ current, goal }) {
  const pct = Math.max(0, Math.min(1, goal > 0 ? current / goal : 0));
  const size = 240; // px
  const stroke = 18; // px
  const r = (size - stroke) / 2; // radius
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct);
  const remaining = Math.max(0, goal - current);
  const pctLabel = Math.round(pct * 100);

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`Calories: ${current} of ${goal}. ${remaining} remaining. ${pctLabel}% of goal.`}
    >
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke="#E5E7EB" strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={current <= goal ? '#22C55E' : '#EF4444'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          fill="none"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>

      <View style={styles.centerLabels} pointerEvents="none">
        <Text style={styles.title}>Calories</Text>
        <Text style={styles.current}>{current}</Text>
        <Text style={styles.goal}>of {goal} kcal</Text>
        <Text style={[styles.remaining, { color: current <= goal ? '#22C55E' : '#F87171' }]}>
          {current <= goal ? `${goal - current} left` : `${current - goal} over`}
        </Text>
      </View>
    </View>
  );
}

export default function CaloriePage() {

  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const [goal, setGoal] = useState(2200);
  const [delta, setDelta] = useState('250');

  // Load today's calories + goal on mount
  useEffect(() => {
    (async () => {
      try {
        const [savedToday, savedGoal] = await Promise.all([
          AsyncStorage.getItem(todayKey()),
          AsyncStorage.getItem(goalKey),
        ]);
        if (savedToday) setCurrent(Number(savedToday) || 0);
        if (savedGoal) setGoal(Number(savedGoal) || 2200);
      } catch (e) {
        console.warn('Load error', e);
      }
    })();
  }, []);

// Persist when values change 
  useEffect(() => { AsyncStorage.setItem(todayKey(), String(current)).catch(() => {}); }, [current]);
  useEffect(() => { AsyncStorage.setItem(goalKey, String(goal)).catch(() => {}); }, [goal]);

// Actions
  const add = (n) => {
    const v = Number(n);
    if (Number.isNaN(v)) return;
    setCurrent(prev => Math.max(0, Math.round(prev + v)));
    Keyboard.dismiss();
  };
  const resetToday = () => {
    Alert.alert('Reset today?', 'This clears today\'s calorie count.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          setCurrent(0);
          try {
            await AsyncStorage.removeItem(todayKey()); // also clear storage
          } catch (e) {
            console.warn('Reset error', e);
          }
        },
      },
    ]);
  };
  const changeGoal = (n) => {
    const v = Math.max(0, Math.round(Number(n) || 0));
    setGoal(v);
  };
  const suggestions = useMemo(() => [100, 250, 500], []);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <CalorieGauge current={current} goal={goal} />


      {/* Quick add row */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Quick add</Text>
        <View style={styles.row}>
          <TextInput
            value={delta}
            onChangeText={setDelta}
            inputMode="numeric"
            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
            placeholder="e.g. 250"
            placeholderTextColor="#64748B"
            style={styles.input}
          />
          <Pressable style={styles.btn} onPress={() => add(delta)}>
            <Text style={styles.btnText}>+ Add</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnSub]} onPress={() => add(-Number(delta || 0))}>
            <Text style={styles.btnText}>− Sub</Text>
          </Pressable>
        </View>
      </View>


        {/* Goal editor */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Daily goal</Text>
          <View style={styles.row}>
            <TextInput
              value={String(goal)}
              onChangeText={changeGoal}
              inputMode="numeric"
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
              style={[styles.input, { flex: 0.6 }]}
            />
          <Pressable style={styles.btnGhost} onPress={resetToday}>
            <Text style={styles.btnGhostText}>Reset today</Text>
          </Pressable>
        </View>
      </View>


      <Text style={styles.helperSmall}>US1 complete: gauge + live counter with per-day persistence.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  centerLabels: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: '#93C5FD', fontSize: 16, marginBottom: 2 },
  current: { color: 'white', fontSize: 40, fontWeight: '700', lineHeight: 46 },
  goal: { color: '#9CA3AF', fontSize: 14, marginTop: 2 },
  remaining: { fontSize: 14, marginTop: 6, fontWeight: '600' },


  card: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderColor: '#1E293B', borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  sectionTitle: { color: '#E2E8F0', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#0B1220',
    borderColor: '#1F2937', borderWidth: 1,
    color: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10,
  },
  btn: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10,
  },
  btnSub: { backgroundColor: '#3B82F6' },
  btnText: { color: '#051B0D', fontWeight: '700' },

  btnGhost: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  btnGhostText: { color: '#E2E8F0' },

  helperSmall: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
});