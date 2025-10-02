import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter, Stack } from "expo-router";
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
  const [loading, setLoading] = useState(false);

  // Load stats from /profile
  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await apiGet("/profile"); 
      // backend returns the whole profile → we only care about stats + levelPoints
      setStats(data.stats || { strength: 10, stamina: 10, agility: 10 });
      setLevelPoints(data.levelPoints || 0);
    } catch (e) {
      console.warn("Failed to load stats:", e);
      Alert.alert("Error", "Could not load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Upgrade a stat → POST /profile with { upgrade: stat }
  const handleUpgrade = async (stat) => {
    if (levelPoints <= 0) {
      Alert.alert("Not enough points", "You need more level points to upgrade stats.");
      return;
    }
    try {
      const res = await apiPost("/profile", { upgrade: stat });
      // backend should return updated profile
      setStats(res.stats || stats);
      setLevelPoints(res.levelPoints || levelPoints - 1);
    } catch (e) {
      console.warn("Upgrade failed:", e);
      Alert.alert("Error", "Could not upgrade stat");
    }
  };

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

        <TouchableOpacity
          style={styles.bigButton}
          onPress={() => router.push("/(tabs)/profile")}
        >
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
