import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, Stack } from "expo-router";
import { apiGet, apiPost } from "../../utils/api";
import Avatar from "../avatar";

// XP system constants
const BASE_XP = 100;
const SCALING = 20;

// Daily core tasks
const DAILY_TASKS = [
  { name: "Sleep 8 hours", xp: 20 },
  { name: "Finish workout", xp: 30 },
  { name: "Achieve calorie goal", xp: 25 },
];

// Progress bar component
function ProgressBar({ progress, color }) {
  return (
    <View style={styles.progressBackground}>
      <View
        style={[
          styles.progressFill,
          { width: `${progress}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState(DAILY_TASKS);
  const [completed, setCompleted] = useState({});
  const [locked, setLocked] = useState(false);

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return router.replace("/LoginScreen");

      const res = await apiGet("/profile");
      setProfile(res);
    } catch (err) {
      console.warn("Profile load error:", err);
      Alert.alert("Error", "Failed to load profile data");
    }
  };

  // Load or reset user-specific daily tasks
  const loadUserTasks = async (userId) => {
    const today = new Date().toDateString();
    const lastDateKey = `user_${userId}_lastTaskDate`;
    const completedKey = `user_${userId}_completedTasks`;

    const lastDate = await AsyncStorage.getItem(lastDateKey);
    if (lastDate !== today) {
      // Reset for a new day
      await AsyncStorage.setItem(lastDateKey, today);
      await AsyncStorage.removeItem(completedKey);
      setCompleted({});
      setLocked(false);
    } else {
      const saved = await AsyncStorage.getItem(completedKey);
      if (saved) setCompleted(JSON.parse(saved));
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile?._id) loadUserTasks(profile._id);
  }, [profile]);

  // Handle task completion
  const handleCompleteTask = async (task) => {
    if (!profile?._id) return;
    if (locked) return Alert.alert("You're done for today!", "All tasks completed 🎉");

    const userId = profile._id;
    const completedKey = `user_${userId}_completedTasks`;

    const newCompleted = { ...completed, [task.name]: true };
    setCompleted(newCompleted);
    await AsyncStorage.setItem(completedKey, JSON.stringify(newCompleted));

    // Award XP
    try {
      const updated = await apiPost("/profile", { xp: task.xp });
      setProfile(updated);
    } catch (err) {
      console.warn("XP update failed:", err);
    }

    if (Object.keys(newCompleted).length === tasks.length) {
      setLocked(true);
      Alert.alert("Great job!", "You finished all daily tasks!");
    }
  };

  // Logout
  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/LoginScreen");
  };

  // XP / Level calculations
  const level = profile?.level ?? 1;
  const experience = profile?.experience ?? 0;
  const xpThreshold = BASE_XP + (level - 1) * SCALING;
  const experienceProgress = (experience / xpThreshold) * 100;
  const stats = profile?.stats || { strength: 10, stamina: 10, agility: 10 };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 8 },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Avatar level={level} />
          <Text style={styles.avatarLevel}>Level {level}</Text>
        </View>

        {/* XP Progress */}
        <View style={styles.card}>
          <Text style={styles.subtitle}>Experience</Text>
          <Text style={styles.info}>
            {experience}/{xpThreshold} XP
          </Text>
          <ProgressBar progress={experienceProgress} color="#4FC3F7" />
          <Text style={styles.info}>
            Level Points: {profile?.levelPoints ?? 0}
          </Text>
        </View>

        {/* Daily Tasks */}
        <View style={styles.card}>
          <Text style={styles.subtitle}>Daily Tasks</Text>
          {tasks.map((task, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.taskButton,
                completed[task.name] && styles.taskButtonDone,
              ]}
              onPress={() => handleCompleteTask(task)}
              disabled={completed[task.name]}
            >
              <Text
                style={[
                  styles.taskText,
                  completed[task.name] && styles.taskTextDone,
                ]}
              >
                {task.name} {completed[task.name] ? "✅" : `(+${task.xp} XP)`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats navigation */}
        <TouchableOpacity
          style={[styles.bigButton, { backgroundColor: "#22C55E" }]}
          onPress={() => router.push("/StatsScreen")}
        >
          <Text style={styles.bigButtonText}>Go to Stats Screen</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { color: "#E5E7EB", fontSize: 22, fontWeight: "700" },
  logoutBtn: {
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutText: { color: "#E5E7EB", fontWeight: "600" },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  avatarLevel: {
    color: "#4FC3F7",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#1E1E1E",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  subtitle: {
    color: "#4FC3F7",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  info: { color: "#E0E0E0", fontSize: 14, marginBottom: 6 },
  progressBackground: {
    height: 10,
    backgroundColor: "#333",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: { height: "100%", borderRadius: 6 },
  taskButton: {
    backgroundColor: "#4FC3F7",
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: "center",
  },
  taskButtonDone: { backgroundColor: "#4B5563" },
  taskText: { color: "#121212", fontWeight: "600" },
  taskTextDone: { color: "#9CA3AF", textDecorationLine: "line-through" },
  bigButton: {
    backgroundColor: "#4FC3F7",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
  },
  bigButtonText: { color: "#121212", fontWeight: "bold", fontSize: 16 },
});
