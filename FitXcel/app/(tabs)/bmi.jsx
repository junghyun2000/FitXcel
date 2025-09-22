import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
 // Main BMI Screen Component
export default function BMIScreen2() {
  // Safe area insets for notch/Island safe area
  const insets = useSafeAreaInsets();
  // State variables for user inputs
  const [sex, setSex] = useState("male");
  const [age, setAge] = useState("23");
  const [height, setHeight] = useState("180");
  const [weight, setWeight] = useState("70.1");
  // Convert inputs to numbers for calculations
  const hm = Number(height) / 100;
  const wKg = Number(weight);
  const ageNum = Number(age);
  // Calculate BMI using useMemo for performance optimization
  const bmi = useMemo(() => {
    const val = !hm || !wKg ? NaN : wKg / (hm * hm);
    return val;
  }, [height, weight]);
  // Format BMI to one decimal place or show "--" if invalid
  const bmiText = Number.isFinite(bmi) ? (Math.round(bmi * 10) / 10).toFixed(1) : "--";

  return (
    <SafeAreaView
      // Apply safe area insets to top and bottom
      edges={["top", "bottom"]} 
      style={[
        styles.screen,
        {
          // Adjust padding for Android status bar height/Dynamic island for IOS.
          paddingTop: 
            Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <ScrollView
      // ScrollView to handle content that might overflow
        contentInsetAdjustmentBehavior="automatic" // Adjust content inset automatically
        contentContainerStyle={styles.container} // Container styles
        keyboardShouldPersistTaps="handled" // Dismiss keyboard on tap outside
      >
        // Title
        <Text style={styles.title}>BMI Analysis</Text>

        <View style={styles.row}>
          {["male", "female"].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.pill, sex === s && styles.pillActive]}
              onPress={() => setSex(s)}
            >
              <Text style={[styles.pillText, sex === s && styles.pillTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputs}>
          <Field label="Height" value={height} onChangeText={setHeight} unit="cm" />
          <Field label="Weight" value={weight} onChangeText={setWeight} unit="kg" />
          <Field label="Age" value={age} onChangeText={setAge} unit="yrs" />
        </View>

        <View style={styles.card}>
          <Text style={styles.big}>BMI: {bmiText}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, unit }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
        style={styles.input}
      />
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b0b0c" },
  container: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  row: { flexDirection: "row", gap: 8, alignSelf: "center" },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#121318",
    borderWidth: 1,
    borderColor: "#1f2530",
  },
  pillActive: { backgroundColor: "#1f2530" },
  pillText: { color: "#a1a1aa", fontWeight: "700" },
  pillTextActive: { color: "#fff" },
  inputs: { gap: 8 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#121318",
    borderColor: "#1f2530",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: { color: "#9ca3af", width: 70, fontSize: 12 },
  input: { flex: 1, color: "#fff", fontSize: 16, paddingVertical: 4 },
  unit: { color: "#9ca3af" },
  card: {
    backgroundColor: "#0f1016",
    borderWidth: 1,
    borderColor: "#1f2530",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },
  big: { color: "#fff", fontSize: 22, fontWeight: "800" },
});


