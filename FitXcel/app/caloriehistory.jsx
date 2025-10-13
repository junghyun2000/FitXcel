import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function CalorieHistory() {
  const router = useRouter();
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Not Logged In", "Please log in first.");
          setLoading(false);
          return;
        }

        // ✅ Use your Render API instead of localhost
        const res = await fetch("https://fitxcel.onrender.com/plans/history", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (res.ok) {
          setDays(data.history || []);
        } else {
          Alert.alert("Error", data.error || "Failed to load calorie history");
        }
      } catch (err) {
        console.error("Calorie history fetch error:", err);
        Alert.alert("Error", "Could not connect to server.");
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
          days.map((entry, index) => (
            <View key={index} style={styles.sessionCard}>
              <Text style={styles.sessionDate}>{entry.date}</Text>
              <Text style={styles.exerciseTitle}>
                {entry.name || "Meal"} - {entry.caloriesAtAdd || entry.calories || 0} kcal
              </Text>
              <Text style={styles.setText}>{entry.mealType || "Other"}</Text>
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
  },
  backButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginLeft: 16 },
  noData: { color: "#fff", fontSize: 16, textAlign: "center" },
  sessionCard: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#1a1b20",
    borderRadius: 12,
  },
  sessionDate: { color: "#9ca3af", fontSize: 14, marginBottom: 8, textAlign: "center" },
  exerciseTitle: { color: "#22c55e", fontSize: 18, fontWeight: "700" },
  setText: { color: "#fff", fontSize: 16, marginLeft: 8 },
});