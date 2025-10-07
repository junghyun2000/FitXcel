import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";  // ✅ added

import { apiGet } from "../utils/api";

export default function CalorieHistory() {
  const router = useRouter();
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // ✅ explicitly re-fetch the token here before calling apiGet
        const token = await AsyncStorage.getItem("token");
        console.log("🔑 Token inside history page:", token ? token.slice(0, 10) + "..." : "none");

        if (!token) {
          Alert.alert("Error", "Missing authentication token. Please log in again.");
          return;
        }

        // ✅ now safely call apiGet (your working helper will use it)
        const res = await apiGet("/plans/history");
        if (res && Array.isArray(res.history)) {
          setDays(res.history);
        } else {
          Alert.alert("Error", res?.error || "Failed to load calorie history");
        }
      } catch (err) {
        console.warn("Calorie history load error:", err);
        Alert.alert("Error", "Failed to fetch calorie history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading calorie history...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0b0c" }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Calorie</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calorie History</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 16 }}>
        {days.length === 0 ? (
          <Text style={styles.noData}>No calorie logs found.</Text>
        ) : (
          days.map((day, idx) => (
            <View key={idx} style={styles.sessionCard}>
              <Text style={styles.sessionDate}>{day.date}</Text>

              {Array.isArray(day.entries) &&
                day.entries.map((entry, i) => (
                  <View key={`${idx}-${i}`} style={styles.exerciseCard}>
                    <Text style={styles.exerciseTitle}>{entry.name}</Text>
                    <Text style={styles.setText}>
                      {entry.mealType} – {entry.caloriesAtAdd || entry.calories} kcal
                    </Text>
                  </View>
                ))}

              {day.totalCalories && (
                <Text style={[styles.totalCalories, { marginTop: 8 }]}>
                  Total: {day.totalCalories} kcal
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b0b0c",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1b20",
    zIndex: 1000,
  },
  backButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 16,
  },
  noData: { color: "#fff", fontSize: 16, textAlign: "center" },
  sessionCard: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#1a1b20",
    borderRadius: 12,
  },
  sessionDate: { color: "#9ca3af", fontSize: 14, marginBottom: 8, textAlign: "center" },
  exerciseCard: {
    marginBottom: 12,
    backgroundColor: "#121318",
    padding: 10,
    borderRadius: 10,
  },
  exerciseTitle: { color: "#22c55e", fontSize: 18, fontWeight: "700" },
  setText: { color: "#fff", fontSize: 16, marginLeft: 8 },
  totalCalories: { color: "#fef08a", fontSize: 16, fontWeight: "600", textAlign: "center" },
});