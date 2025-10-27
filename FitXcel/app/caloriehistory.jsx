import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function CalorieHistory() {
  const router = useRouter();
  const [grouped, setGrouped] = useState({});
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

        const res = await fetch("https://fitxcel.onrender.com/plans/history", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (res.ok && data.history) {
          const groupedData = {};
          data.history.forEach(entry => {
            const dateKey =
              entry.date ||
              new Date(entry.createdAt).toISOString().slice(0, 10);
            if (!groupedData[dateKey]) groupedData[dateKey] = [];
            groupedData[dateKey].push(entry);
          });
          setGrouped(groupedData);
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

  const dateKeys = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0b0c" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Calorie</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calorie History</Text>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 16 }}>
        {dateKeys.length === 0 ? (
          <Text style={styles.noData}>No calorie logs found.</Text>
        ) : (
          dateKeys.map((date) => {
            const total = grouped[date].reduce(
              (sum, e) => sum + (e.caloriesAtAdd || e.calories || 0),
              0
            );
            return (
              <View key={date} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{date}</Text>
                  <Text style={styles.dayTotal}>{total} kcal</Text>
                </View>
                {grouped[date].map((entry, idx) => (
                  <View key={idx} style={styles.entryRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.entryName}>
                        {entry.name || "Meal"}
                      </Text>
                      <Text style={styles.mealType}>
                        {entry.mealType ? entry.mealType.toUpperCase() : "OTHER"}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.entryCalories}>
                        {entry.caloriesAtAdd || entry.calories || 0} kcal
                      </Text>
                      <Text style={styles.entryTime}>
                        {new Date(entry.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })
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

  // Grouped day layout
  dayCard: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#1a1b20",
    borderRadius: 12,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2d2e32",
    paddingBottom: 4,
  },
  dayTitle: { color: "#22c55e", fontSize: 16, fontWeight: "700" },
  dayTotal: { color: "#9ca3af", fontSize: 15 },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  entryName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  mealType: { color: "#9ca3af", fontSize: 13, marginTop: 2 },
  entryCalories: { color: "#22c55e", fontSize: 16, fontWeight: "700" },
  entryTime: { color: "#9ca3af", fontSize: 13 },
});