import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiGet, apiPost, apiDel } from './api';
import { Stack } from 'expo-router';

export default function SavedMeals() {
    const [name, setName] = useState('');
    const [calories, setCalories] = useState('');
    const [mealType, setMealType] = useState('breakfast');
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadMeals = async () => {

        try {
            setLoading(true);
            const data = await apiGet('/meals');
            setMeals(data); // items are { id, name, calories, mealType, ... }
        } catch (e) {
            console.warn(e);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => { loadMeals(); }, []);


    const saveMeal = async () => {
        try {
            const c = Math.round(Number(calories));
            if (!name.trim() || !c || c <= 0) {
            Alert.alert('Oops', 'Enter name and positive calories');
            return;
            }
            const res = await apiPost('/meals', { name: name.trim(), calories: c, mealType });
            setName(''); setCalories('');
            await loadMeals();
            Alert.alert('Saved', 'Meal saved successfully');
        } catch (e) {
            Alert.alert('Save failed', e?.message ?? String(e));
            console.warn('saveMeal error:', e);
        }
    };


    const addToToday = async (meal) => {

        try {
            const res = await apiPost('/plans/today/add', { mealId: meal.id, servings: 1 });
            // backend returns { ok: true, calories }
            Alert.alert('Added', `+${res?.calories ?? 0} kcal added to today`);
        } catch (e) {
            Alert.alert('Add failed', e?.message ?? String(e));
            console.warn('addToToday error:', e);
        }
    };


    const deleteMeal = async (meal) => {

        try {
            await apiDel(`/meals/${meal.id}`);
            await loadMeals();
            Alert.alert('Deleted', 'Meal removed');
        } catch (e) {
            Alert.alert('Delete failed', e?.message ?? String(e));
            console.warn('deleteMeal error:', e);
        }
    };


    const renderItem = ({ item }) => (
        <View style={styles.row}>
            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.mealType} • {item.calories} kcal/serving</Text>
            </View>
            <Pressable style={styles.btn} onPress={() => addToToday(item)}>
                <Text style={styles.btnText}>Add to today</Text>
            </Pressable>
            <Pressable style={styles.btnGhost} onPress={() => deleteMeal(item)}>
                <Text style={styles.btnGhostText}>Delete</Text>
            </Pressable>
        </View>
    );


    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                headerShown: true,         
                title: 'Saved Meals',      
                headerBackTitle: 'Calorie' 
                }}
            />
            <Text style={styles.title}>Saved Meals</Text>


            {/* Create new saved meal */}
            <View style={styles.card}>
                <Text style={styles.section}>New saved meal</Text>
                <View style={styles.formRow}>
                    <TextInput value={name} onChangeText={setName} placeholder="Meal name (e.g., Oats + Banana)" placeholderTextColor="#64748B" style={styles.input} />
                    <TextInput value={calories} onChangeText={setCalories} inputMode="numeric" keyboardType={Platform.OS==='ios'?'number-pad':'numeric'} placeholder="kcal per serving" placeholderTextColor="#64748B" style={styles.input} />
                </View>
                <MealTypePicker value={mealType} onChange={setMealType} />
                <Pressable style={[styles.btn, { alignSelf: 'flex-start', marginTop: 8 }]} onPress={saveMeal}>
                    <Text style={styles.btnText}>Save meal</Text>
                </Pressable>
            </View>

            {/* List saved meals */}
            <View style={[styles.card, { flex: 1 }]}>
                <Text style={styles.section}>Your saved meals</Text>
                <FlatList
                    data={meals}
                    keyExtractor={(i) => String(i.id)}
                    renderItem={renderItem}
                    ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                    contentContainerStyle={{ paddingBottom: 10 }}
                    refreshing={loading}
                    onRefresh={loadMeals}
                />
            </View>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B1220', padding: 16 },
    title: { color:'#E5E7EB', fontSize: 20, fontWeight:'700', marginBottom: 12 },
    card: { backgroundColor:'#0F172A', borderColor:'#1E293B', borderWidth:1, borderRadius:14, padding:14, marginBottom: 14 },
    section: { color:'#E2E8F0', fontSize:14, fontWeight:'600', marginBottom:8 },
    formRow: { gap: 8 },
    input: { backgroundColor:'#0B1220', borderColor:'#1F2937', borderWidth:1, color:'#E5E7EB', paddingHorizontal:12, paddingVertical:10, borderRadius:10 },
    btn: { backgroundColor:'#22C55E', paddingHorizontal:14, paddingVertical:10, borderRadius:10 },
    btnText: { color:'#051B0D', fontWeight:'700' },
    btnGhost: { paddingHorizontal:12, paddingVertical:10, borderRadius:10, borderWidth:1, borderColor:'#334155', marginLeft: 8 },
    btnGhostText: { color:'#E2E8F0' },
    pillsRow: { flexDirection: 'row', flexWrap:'wrap', gap: 6, marginTop: 6 },
    pill: { paddingHorizontal:10, paddingVertical:8, borderRadius:9999, borderWidth:1, borderColor:'#334155' },
    pillActive: { backgroundColor:'#22C55E', borderColor:'#16A34A' },
    pillText: { color:'#E5E7EB' },
    pillTextActive: { color:'#051B0D', fontWeight:'700' },
    row: { flexDirection:'row', alignItems:'center', gap:8, padding:10, borderRadius:10, backgroundColor:'#0B1220', borderWidth:1, borderColor:'#1F2937' },
    name: { color:'#E5E7EB', fontWeight:'600' },
    meta: { color:'#94A3B8', fontSize:12, marginTop:2 },
});

