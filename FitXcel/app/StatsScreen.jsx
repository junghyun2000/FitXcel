import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { apiGet, apiPost } from "../utils/api";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

function ProgressBar({ progress, color }) {
  return (
    <View style={styles.progressBackground}>
      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function StatsScreen() {
  const router = useRouter();

  const [stats, setStats] = useState({ strength: 10, stamina: 10, agility: 10 });
  const [levelPoints, setLevelPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load profile data from backend
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiGet("/profile");
      if (res) {
        setStats(res.stats || { strength: 10, stamina: 10, agility: 10 });
        setLevelPoints(res.levelPoints || 0);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      Alert.alert("Error", "Could not load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle upgrading a specific stat
  const handleUpgrade = async (stat) => {
    if (levelPoints <= 0) return;

    try {
      const updated = await apiPost("/profile", { upgrade: stat });
      setStats(updated.stats || stats);
      setLevelPoints(updated.levelPoints || 0);
    } catch (err) {
      console.error("Upgrade failed:", err);
      Alert.alert("Error", "Failed to upgrade stat");
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#4FC3F7" />
        <ThemedText style={{ marginTop: 10 }}>Loading stats...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <ThemedView style={styles.card}>
          <ThemedText style={styles.subtitle}>Character Stats</ThemedText>
          {Object.keys(stats).map((stat) => (
            <View key={stat} style={styles.statBlock}>
              <ThemedText style={styles.statLabel}>
                {stat.charAt(0).toUpperCase() + stat.slice(1)}: {stats[stat]}
              </ThemedText>
              <ProgressBar progress={stats[stat] % 100} color="#81C784" />
              <TouchableOpacity
                style={[styles.bigButton, levelPoints <= 0 && styles.buttonDisabled]}
                onPress={() => handleUpgrade(stat)}
                disabled={levelPoints <= 0}
              >
                <ThemedText style={styles.bigButtonText}>Upgrade +1</ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </ThemedView>

        <TouchableOpacity style={styles.bigButton} onPress={() => router.push("/(tabs)/profile")}>
          <ThemedText style={styles.bigButtonText}>Back to Profile</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#121212" },
  card: { backgroundColor: "#1E1E1E", padding: 16, borderRadius: 12, marginBottom: 20 },
  subtitle: { color: "#4FC3F7", fontSize: 18, fontWeight: "600", marginBottom: 12 },
  statBlock: { marginBottom: 20 },
  statLabel: { color: "#FFFFFF", marginBottom: 6, fontSize: 15 },
  progressBackground: { height: 10, backgroundColor: "#333", borderRadius: 6, overflow: "hidden", marginBottom: 10 },
  progressFill: { height: "100%", borderRadius: 6 },
  bigButton: { backgroundColor: "#4FC3F7", paddingVertical: 14, borderRadius: 10, marginTop: 8, alignItems: "center" },
  bigButtonText: { color: "#121212", fontWeight: "bold", fontSize: 16 },
  buttonDisabled: { backgroundColor: "#555" },
});
