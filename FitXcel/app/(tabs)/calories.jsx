import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Keyboard, Platform, FlatList, AppState } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const isoDateOnly = (d = new Date()) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0,10);
const today = () => isoDateOnly();
const entriesKey = () => `calories:entries:${today()}`; 
const goalKey = 'calorie_goal';
const minutesSinceMidnight = () => { const d = new Date(); return d.getHours()*60 + d.getMinutes(); };
const DAY_END_MINUTES = 23*60 + 49;

// Circular gauge for calories (goal vs current)
function CalorieGauge({ current, goal }) {
  const pct = Math.max(0, Math.min(1, goal > 0 ? current / goal : 0));
  const size = 240;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct);
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`Calories: ${current} of ${goal}. ${Math.max(0, goal-current)} remaining. ${Math.round(pct*100)}% of goal.`}
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

  // Goal + entries (today)
  const [goal, setGoal] = useState(2200);
  const [entries, setEntries] = useState([]);
  const entriesArr = Array.isArray(entries) ? entries : [];
  const current = useMemo(
    () => entriesArr.reduce((s, e) => s + (Number(e.calories) || 0), 0),
    [entriesArr]
  );

  // Quick add input (adds a generic entry)
  const [delta, setDelta] = useState('250');


  // Food form
  const [name, setName] = useState('');
  const [cals, setCals] = useState('');
  const [mealType, setMealType] = useState('breakfast');


  // Track date changes for midnight reset
  const lastDateRef = useRef(new Date().toDateString());

  // Load today's calories + goal on mount
  useEffect(() => {
    (async () => {
      try {
        const [savedEntriesJson, savedGoal] = await Promise.all([
          AsyncStorage.getItem(goalKey),
          AsyncStorage.getItem(entriesKey()),
        ]);
        if (savedGoal) setGoal(Number(savedGoal) || 2200);
        if (savedEntriesJson) {
          try {
            const parsed = JSON.parse(savedEntriesJson);
            setEntries(Array.isArray(parsed) ? parsed : []);
          } catch {
            setEntries([]);
          }
        } else {
          setEntries([]);
        }
      } catch (e) {
        console.warn('Load error', e);
        setEntries([]);
      }
    })();
  }, []);

// goal + entries 
  useEffect(() => { AsyncStorage.setItem(goalKey, String(goal)).catch(()=>{}); }, [goal]);
  useEffect(() => { AsyncStorage.setItem(entriesKey(), JSON.stringify(entries)).catch(()=>{}); }, [entries]);

// Auto reset at midnight
  useEffect(() => {
    const maybeFlipDay = async () => {
      const nowStr = new Date().toDateString();
      if (nowStr !== lastDateRef.current) {
        lastDateRef.current = nowStr;
        setEntries([]);
        try { await AsyncStorage.removeItem(entriesKey()); } catch {}
        }
    };
    const id = setInterval(maybeFlipDay, 30*1000);
    const sub = AppState.addEventListener('change', (s)=>{ if (s==='active') maybeFlipDay(); });
    return ()=>{ clearInterval(id); sub.remove(); };
  }, []);

  // Actions
  const addQuick = (n) => {
    const v = Math.round(Number(n));
    if (Number.isNaN(v) || v <= 0) return;
    if (minutesSinceMidnight() > DAY_END_MINUTES) {
      if (Platform.OS === 'web') { if (!window.confirm('Tracking stops after 23:49. Add to tomorrow?')) return; }
      else Alert.alert('Day closed', 'Calorie tracking for today stops after 23:49. Try again after midnight.');
      return;
    }
    setEntries((prev)=>[{ id: Date.now().toString(), name: 'Quick add', calories: v, mealType: 'snack', time: new Date().toISOString() }, ...prev]);
    if (Platform.OS !== 'web') Keyboard.dismiss();
  };

  const addEntry = () => {
    const v = Math.round(Number(cals));
    if (!name.trim() || Number.isNaN(v) || v <= 0) {
      if (Platform.OS === 'web') window.alert('Enter a food name and positive calories.');
      else Alert.alert('Missing info', 'Please enter a food name and positive calories.');
      return;
    }
    if (minutesSinceMidnight() > DAY_END_MINUTES) {
      if (Platform.OS === 'web') { if (!window.confirm('Tracking stops after 23:49. Add to tomorrow?')) return; }
      else { Alert.alert('Day closed', 'Calorie tracking for today stops after 23:49. Try again after midnight.'); return; }
    }
    const entry = { id: Date.now().toString(), name: name.trim(), calories: v, mealType, time: new Date().toISOString() };
    setEntries((prev)=>[entry, ...prev]);
    setName(''); setCals('');
    if (Platform.OS !== 'web') Keyboard.dismiss();
  };

  const deleteEntry = (id) => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Delete this entry?')) return;
      setEntries((prev)=> prev.filter(e=>e.id!==id));
      return;
    }
    Alert.alert('Delete entry?', 'This will remove the food from today.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setEntries((prev)=> prev.filter(e=>e.id!==id)) },
    ]);
  };

  const resetToday = async () => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && window.confirm("Reset today's entries?");
      if (!ok) return;
      setEntries([]);
      try { await AsyncStorage.removeItem(entriesKey()); } catch {}
      return;
    }
    Alert.alert('Reset today?', "This clears all of today's food entries.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => { setEntries([]); try { await AsyncStorage.removeItem(entriesKey()); } catch {} } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={entries}                 
        keyExtractor={(item) => item.id}
        horizontal={false}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, width: '100%' }} 
        contentContainerStyle={{
          paddingBottom: 40,
          paddingHorizontal: 16,
          maxWidth: '100%',
        }}
        // Header: gauge + quick add + add food form
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <CalorieGauge current={current} goal={goal} /> 
            </View>

            {/* Go to savedmeals page */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Saved meals</Text>
              <Pressable
                style={[styles.btnGhost, { alignSelf: 'flex-start' }]}
                onPress={() => router.push('/saved-meals')}
              >
                <Text style={styles.btnGhostText}>Open saved meals</Text>
              </Pressable>
            </View>

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
                <Pressable style={styles.btn} onPress={() => addQuick(delta)}>
                  <Text style={styles.btnText}>+ Add</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.btnSub]}
                  onPress={() => addQuick(-Math.abs(Number(delta || 0)))}
                  disabled
                >
                  <Text style={styles.btnText}>− Sub</Text>
                </Pressable>
              </View>
            </View>

            {/* Food logger */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Add food</Text>
              <View style={styles.rowWrap}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Food name (e.g., Chicken Breast)"
                  placeholderTextColor="#64748B"
                  style={[styles.input, { flexBasis: '100%' }]}
                />
                <TextInput
                  value={cals}
                  onChangeText={setCals}
                  inputMode="numeric"
                  keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                  placeholder="Calories (kcal)"
                  placeholderTextColor="#64748B"
                  style={[styles.input, { flexBasis: '100%' }]}
                />
                {/* picker under calories */}
                <MealTypePicker value={mealType} onChange={setMealType} />
                <Pressable style={styles.btn} onPress={addEntry}>
                  <Text style={styles.btnText}>Add</Text>
                </Pressable>
              </View>
            </View>

            {/* Today header */}
            <View style={[styles.card, { paddingBottom: 8 }]}>
              <Text style={styles.sectionTitle}>Today</Text>
              {entries.length === 0 && (
                <Text style={{ color: '#94A3B8' }}>No foods yet. Add your first meal above.</Text>
              )}
            </View>
          </View>
        }

        renderItem={({ item }) => (
          <View style={[styles.card, { paddingTop: 10, paddingBottom: 10 }]}>
            <View style={styles.entryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryName}>{item.name}</Text>
                <Text style={styles.entryMeta}>
                  {item.mealType} • {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={styles.entryCals}>{item.calories}</Text>
              <Pressable style={styles.entryDel} onPress={() => deleteEntry(item.id)}>
                <Text style={styles.entryDelText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}

        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}

        // Footer: totals + reset + goal editor + helper
        ListFooterComponent={
          <View style={{ gap: 12, width: '100%' }}>

            {/* Goal + total container */}
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={{ color: '#94A3B8' }}>Total consumed</Text>
                <Text style={{ color: '#E5E7EB', fontWeight: '700' }}>{current} kcal</Text>
              </View>

              <View style={{ height: 8 }} />

              <GoalEditor goal={goal} setGoal={setGoal} />
            </View>

            {/* Reset button at bottom */}
            <Pressable style={[styles.btnGhost, { alignSelf: 'center', marginTop: 8 }]} onPress={resetToday}>
              <Text style={styles.btnGhostText}>Reset today</Text>
            </Pressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function MealTypePicker({ value, onChange }) {
  const opts = ['breakfast','lunch','dinner','snack'];
  return (
    <View style={styles.pillsRow}>
      {opts.map((opt) => (
        <Pressable key={opt} onPress={() => onChange(opt)} style={[styles.pill, value===opt && styles.pillActive]}>
          <Text style={[styles.pillText, value===opt && styles.pillTextActive]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}


function GoalEditor({ goal, setGoal }) {
  const [draft, setDraft] = useState(String(goal));
  useEffect(()=>{ setDraft(String(goal)); }, [goal]);
  const commit = () => { const v = Math.max(0, Math.round(Number(draft)||0)); setGoal(v); };
  return (
    <View style={styles.row}>
      <TextInput value={draft} onChangeText={setDraft} inputMode="numeric" keyboardType={Platform.OS==='ios'?'number-pad':'numeric'} style={[styles.input, {width:110}]} />
      <Pressable style={styles.btn} onPress={commit}><Text style={styles.btnText}>Set goal</Text></Pressable>
    </View>
  );
}

// styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220', alignItems: 'center', paddingHorizontal: 16, gap: 16 },
  centerLabels: { position:'absolute', left:0, right:0, top:0, bottom:0, alignItems:'center', justifyContent:'center' },
  title: { color:'#93C5FD', fontSize:16, marginBottom:2 },
  current: { color:'white', fontSize:40, fontWeight:'700', lineHeight:46 },
  goal: { color:'#9CA3AF', fontSize:14, marginTop:2 },
  remaining: { fontSize:14, marginTop:6, fontWeight:'600' },


  card: { alignSelf: 'stretch', backgroundColor:'#0F172A', borderColor:'#1E293B', borderWidth:1, borderRadius:14, padding:14, maxWidth: '100%' },
  sectionTitle: { color:'#E2E8F0', fontSize:14, marginBottom:8, fontWeight:'600' },
  row: { flexDirection:'row', alignItems:'center', gap:8 },
  rowWrap: { flexDirection:'row', alignItems:'center', gap:8, flexWrap:'wrap' },
  rowBetween: { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  input: { flex:1, backgroundColor:'#0B1220', borderColor:'#1F2937', borderWidth:1, color:'#E5E7EB', paddingHorizontal:12, paddingVertical:10, borderRadius:10 },
  btn: { backgroundColor:'#22C55E', paddingHorizontal:14, paddingVertical:10, borderRadius:10 },
  btnSub: { backgroundColor:'#3B82F6' },
  btnText: { color:'#051B0D', fontWeight:'700' },
  btnGhost: { paddingHorizontal:12, paddingVertical:10, borderRadius:10, borderWidth:1, borderColor:'#334155' },
  btnGhostText: { color:'#E2E8F0' },


  pillsRow: { flexDirection:'row', gap:6 },
  pill: { paddingHorizontal:10, paddingVertical:8, borderRadius:9999, borderWidth:1, borderColor:'#334155' },
  pillActive: { backgroundColor:'#22C55E', borderColor:'#16A34A' },
  pillText: { color:'#E5E7EB' },
  pillTextActive: { color:'#051B0D', fontWeight:'700' },


  entryRow: { flexDirection:'row', alignItems:'center', gap:8, padding:10, borderRadius:10, backgroundColor:'#0B1220', borderWidth:1, borderColor:'#1F2937' },
  entryName: { color:'#E5E7EB', fontWeight:'600' },
  entryMeta: { color:'#94A3B8', fontSize:12, marginTop:2 },
  entryCals: { color:'#F9FAFB', fontWeight:'700', width:70, textAlign:'right' },
  entryDel: { marginLeft:8, paddingHorizontal:10, paddingVertical:6, borderRadius:8, borderWidth:1, borderColor:'#7F1D1D' },
  entryDelText: { color:'#F87171', fontWeight:'700' },


  helperSmall: { color:'#94A3B8', fontSize:12, marginTop:4 },
});