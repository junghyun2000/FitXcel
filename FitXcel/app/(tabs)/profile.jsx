import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, Image, TouchableOpacity, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { apiGet, apiPost, BASE_URL } from "../../utils/api";

// Small progress bar
function ProgressBar({ progress, color }) {
  return (
    <View style={styles.progressBackground}>
      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function Profile() {
  const router = useRouter();

  const [experience, setExperience] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelPoints, setLevelPoints] = useState(0);
  const [stats, setStats] = useState({ strength: 10, stamina: 10, agility: 10 });
  const [tasks, setTasks] = useState([]);
  const [debugLog, setDebugLog] = useState("");

  const BASE_XP = 100;
  const SCALING = 20;
  const xp_threshold = BASE_XP + (level - 1) * SCALING;

  const avatars = {
    1: require("../../assets/images/level1.png"),
    2: require("../../assets/images/level2.jpg"),
    3: require("../../assets/images/level3.png"),
    4: require("../../assets/images/level4.png"),
  };
  const currentAvatar = avatars[level] || avatars[1];

  const dummyTasks = [
    { id: 1, name: "Complete 10 push-ups", xp: 50, done: false },
    { id: 2, name: "Run for 15 minutes", xp: 50, done: false },
    { id: 3, name: "Stretch for 5 minutes", xp: 30, done: false },
  ];

  const appendLog = (msg) => {
    setDebugLog((prev) => `${prev}\n${msg}`);
    console.log(msg);
  };

  // Fetch profile via apiGet
  const fetchProfile = async () => {
    try {
      appendLog(`fetchProfile() → BASE_URL=${BASE_URL}`);
      const token = await AsyncStorage.getItem("token");
      appendLog(`token present? ${!!token}`);

      const res = await apiGet("/profile");
      appendLog(`GET /profile ok: ${JSON.stringify(res).slice(0, 200)}...`);

      setExperience(res.experience ?? 0);
      setLevel(res.level ?? 1);
      setLevelPoints(res.levelPoints ?? 0);
      setStats(res.stats ?? { strength: 10, stamina: 10, agility: 10 });
      setTasks(Array.isArray(res.tasks) && res.tasks.length ? res.tasks : dummyTasks);
    } catch (err) {
      appendLog('GET /profile failed: ${String(err)}`);
      Alert.alert("Error", "Could not load profile data");
      setTasks(dummyTasks); // fallback so the page isn’t empty
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Complete task → add XP
  const handleCompleteTask = async (taskId, xp) => {
    try {
      appendLog(`handleCompleteTask(${taskId}, ${xp})`);
      const updated = await apiPost("/profile", { xp, taskId });
      appendLog(`POST /profile ok: ${JSON.stringify(updated).slice(0, 200)}...`);

      setExperience(updated.experience ?? 0);
      setLevel(updated.level ?? 1);
      setLevelPoints(updated.levelPoints ?? 0);
      setStats(updated.stats ?? { strength: 10, stamina: 10, agility: 10 });
      setTasks(Array.isArray(updated.tasks) && updated.tasks.length ? updated.tasks : dummyTasks);
    } catch (err) {
      appendLog(`POST /profile failed: ${String(err)}`);
      Alert.alert("Error", "Could not complete task");
    }
  };

  const experienceProgress = (experience / xp_threshold) * 100;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={styles.avatarContainer}>
          <Image source={currentAvatar} style={styles.avatar} />
          <ThemedText style={styles.avatarLevel}>Level {level}</ThemedText>
        </View>

        {/* Experience card */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.subtitle}>Experience</ThemedText>
          <ThemedText style={styles.info}>
            {experience}/{xp_threshold} XP
          </ThemedText>
          <ProgressBar progress={experienceProgress} color="#4FC3F7" />
          <ThemedText style={styles.info}>Level Points: {levelPoints}</ThemedText>
        </ThemedView>

        {/* Tasks */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.subtitle}>Gym Tasks</ThemedText>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskBlock}>
              <ThemedText style={styles.taskLabel}>{task.name}</ThemedText>
              <ProgressBar progress={task.done ? 100 : 0} color="#FFB74D" />
              <TouchableOpacity
                style={[styles.bigButton, task.done && styles.buttonDisabled]}
                onPress={() => handleCompleteTask(task.id, task.xp)}
                disabled={task.done}
              >
                <ThemedText style={styles.bigButtonText}>
                  {task.done ? "Completed" : `Complete (+${task.xp} XP)`}
                </ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </ThemedView>

        {/* Navigation */}
        <TouchableOpacity style={styles.bigButton} onPress={() => router.push("/StatsScreen")}>
          <ThemedText style={styles.bigButtonText}>Go to Stats Screen</ThemedText>
        </TouchableOpacity>

        
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#121212" },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  avatar: { width: "100%", height: 250, resizeMode: "contain", marginBottom: 8 },
  avatarLevel: { color: "#4FC3F7", fontSize: 18, fontWeight: "bold" },
  subtitle: { color: "#4FC3F7", fontSize: 18, fontWeight: "600", marginBottom: 12 },
  info: { color: "#E0E0E0", fontSize: 14, marginBottom: 6 },
  card: { backgroundColor: "#1E1E1E", padding: 16, borderRadius: 12, marginBottom: 20 },
  taskBlock: { marginBottom: 16 },
  taskLabel: { color: "#fff", fontSize: 15, marginBottom: 6 },
  progressBackground: { height: 10, backgroundColor: "#333", borderRadius: 6, overflow: "hidden", marginBottom: 10 },
  progressFill: { height: "100%", borderRadius: 6 },
  bigButton: { backgroundColor: "#4FC3F7", paddingVertical: 14, borderRadius: 10, marginTop: 8, alignItems: "center" },
  bigButtonText: { color: "#121212", fontWeight: "bold", fontSize: 16 },
  buttonDisabled: { backgroundColor: "#555" },
  debugRow: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  debugBtn: { flex: 1 },
});
