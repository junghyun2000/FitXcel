import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, Image, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

function ProgressBar({ progress, color }) {
  return (
    <View style={styles.progressBackground}>
      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  
  const [experience, setExperience] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelPoints, setLevelPoints] = useState(0);
  const [stats, setStats] = useState({ strength: 10, stamina: 10, agility: 10 });
  const [tasks, setTasks] = useState([
    { id: 1, name: "Complete 10 push-ups", xp: 50, done: false },
    { id: 2, name: "Run for 15 minutes", xp: 50, done: false },
    { id: 3, name: "Stretch for 5 minutes", xp: 30, done: false },
  ]);

  const BASE_XP = 100;
  const SCALING = 20;
  const xp_threshold = BASE_XP + (level - 1) * SCALING;

  const avatars = {
    1: require("../../assets/images/level1.png"),
    2: require("../../assets/images/level2.jpg"),
    3: require("../../assets/images/level3.png"),
    4: require("../../assets/images/level4.png"),
  };
  const currentAvatar = avatars[level] || avatars[Object.keys(avatars).length];

  // Load profile from AsyncStorage
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem("profileData");
        if (stored) {
          const parsed = JSON.parse(stored);
          setExperience(parsed.experience || 0);
          setLevel(parsed.level || 1);
          setLevelPoints(parsed.levelPoints || 0);
          setStats(parsed.stats || { strength: 10, stamina: 10, agility: 10 });
          setTasks(parsed.tasks || tasks);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  // Save profile to AsyncStorage
  const saveProfile = async (updated) => {
    try {
      await AsyncStorage.setItem("profileData", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  const handleCompleteTask = (taskId) => {
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, done: true } : t
    );

    const completedTask = tasks.find((t) => t.id === taskId);
    let newExp = experience;
    let newLevel = level;
    let newLevelPoints = levelPoints;

    if (completedTask && !completedTask.done) {
      newExp += completedTask.xp;

      while (newExp >= xp_threshold) {
        newExp -= xp_threshold;
        newLevel += 1;
        newLevelPoints += 1;
      }
    }

    setExperience(newExp);
    setLevel(newLevel);
    setLevelPoints(newLevelPoints);
    setTasks(updatedTasks);

    saveProfile({
      experience: newExp,
      level: newLevel,
      levelPoints: newLevelPoints,
      stats,
      tasks: updatedTasks,
    });
  };

  const experienceProgress = (experience / xp_threshold) * 100;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={styles.avatarContainer}>
          <Image source={currentAvatar} style={styles.avatar} />
          <ThemedText style={styles.avatarLevel}>Level {level}</ThemedText>
        </View>

        <ThemedView style={styles.card}>
          <ThemedText style={styles.subtitle}>Experience</ThemedText>
          <ThemedText style={styles.info}>{experience}/{xp_threshold} XP</ThemedText>
          <ProgressBar progress={experienceProgress} color="#4FC3F7" />
          <ThemedText style={styles.info}>Level Points: {levelPoints}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText style={styles.subtitle}>Gym Tasks</ThemedText>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskBlock}>
              <ThemedText style={styles.taskLabel}>{task.name}</ThemedText>
              <ProgressBar progress={task.done ? 100 : 0} color="#FFB74D" />
              <TouchableOpacity
                style={[styles.bigButton, task.done && styles.buttonDisabled]}
                onPress={() => handleCompleteTask(task.id)}
                disabled={task.done}
              >
                <ThemedText style={styles.bigButtonText}>
                  {task.done ? "✅ Completed" : `Complete (+${task.xp} XP)`}
                </ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </ThemedView>

        <TouchableOpacity
          style={styles.bigButton}
          onPress={() => router.push("/StatsScreen")}
        >
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
});
