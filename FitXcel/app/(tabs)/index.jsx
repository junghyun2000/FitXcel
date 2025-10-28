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

const BASE_XP = 100;
const SCALING = 20;

// Daily core tasks
const DAILY_TASKS = [
  { name: "Sleep 8 hours", xp: 20 },
  { name: "Finish workout", xp: 30 },
  { name: "Achieve calorie goal", xp: 25 },
];
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, Stack } from "expo-router";
import { apiGet, apiPost } from "../../utils/api";

// Small progress bar component
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
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [completed, setCompleted] = useState({});
  const [locked, setLocked] = useState(false);

  // Load profile (user data) from backend
  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return router.replace("/LoginScreen");

      const res = await apiGet("/profile");
      setProfile(res);
      setTasks(DAILY_TASKS); // use daily fixed set
    } catch (err) {
      console.warn("Profile load error:", err);
      Alert.alert("Error", "Failed to load profile data");
    }
  };

  // Load user-specific daily task progress
  const loadUserTasks = async (userId) => {
    const lastDateKey = `user_${userId}_lastWorkoutDate`;
    const completedKey = `user_${userId}_completedTasks`;
    const today = new Date().toDateString();

    const lastDate = await AsyncStorage.getItem(lastDateKey);
    if (lastDate !== today) {
      // new day = reset tasks
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

  // when profile loads, load user-specific tasks
  useEffect(() => {
    if (profile?._id) loadUserTasks(profile._id);
  }, [profile]);

  // Handle task completion
  const handleCompleteTask = async (task) => {
    if (!profile?._id) return;
    if (locked) return Alert.alert("You're done for today!", "All tasks completed 🎉");

    const userId = profile._id;
    const completedKey = `user_${userId}_completedTasks`;

    // update completed tasks
    const newCompleted = { ...completed, [task.name]: true };
    setCompleted(newCompleted);
    await AsyncStorage.setItem(completedKey, JSON.stringify(newCompleted));

    // award XP
    try {
      const updated = await apiPost("/profile", { xp: task.xp });
      setProfile(updated);
    } catch (err) {
      console.warn("XP update failed:", err);
    }

    // check if all done
    if (Object.keys(newCompleted).length === tasks.length) {
      setLocked(true);
      Alert.alert("Good job!", "You completed all daily goals!");
    }
  };

  // Logout
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);

  const BASE_XP = 100;
  const SCALING = 20;

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return router.replace("/LoginScreen");

      const res = await apiGet("/profile");
      setProfile(res);
      setTasks(res.tasks || []);
    } catch (err) {
      console.warn("Profile load error:", err);
      Alert.alert("Error", "Failed to load profile data");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/LoginScreen");
  };

  // Level calculations
  const level = profile?.level ?? 1;
  const experience = profile?.experience ?? 0;
  const xpThreshold = BASE_XP + (level - 1) * SCALING;
  const experienceProgress = (experience / xpThreshold) * 100;
  const stats = profile?.stats || { strength: 10, stamina: 10, agility: 10 };
    await AsyncStorage.removeItem("token");
    router.replace("/LoginScreen");
  };

  // Handle completing a task
  const handleCompleteTask = async (taskId, xp) => {
    try {
      const updated = await apiPost("/profile", { xp, taskId });
      setProfile(updated);
      setTasks(updated.tasks || []);
    } catch (err) {
      Alert.alert("Error", "Could not complete task");
    }
  };

  const level = profile?.level ?? 1;
  const experience = profile?.experience ?? 0;
  const xpThreshold = BASE_XP + (level - 1) * SCALING;
  const experienceProgress = (experience / xpThreshold) * 100;

  const avatars = {
    1: require("../../assets/images/level1.png"),
    2: require("../../assets/images/level2.jpg"),
    3: require("../../assets/images/level3.png"),
    4: require("../../assets/images/level4.png"),
  };
  const avatar = avatars[level] || avatars[1];

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

      {/* Scrollable content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Avatar stats={stats} level={level} />
          <Text style={styles.avatarLevel}>Level {level}</Text>
        </View>

        {/* XP & Stats */}
        <View style={styles.card}>
          <Text style={styles.subtitle}>Experience</Text>
          <Text style={styles.info}>
            {experience}/{xpThreshold} XP
          </Text>
          <ProgressBar progress={experienceProgress} color="#4FC3F7" />
          <Text style={styles.info}>Level Points: {profile?.levelPoints ?? 0}</Text>
    <SafeAreaView
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 8,
        },
      ]}
    >
      {/* Hide default header (so no double nav bar) */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom top header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
      >
        <View style={styles.avatarContainer}>
          <Image source={avatar} style={styles.avatar} />
          <Text style={styles.avatarLevel}>Level {level}</Text>
        </View>

        {/* Tasks */}
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

        {/* Navigation to Stats */}
        <TouchableOpacity
          style={[styles.bigButton, { backgroundColor: "#22C55E" }]}
          onPress={() => router.push("/StatsScreen")}
        >
          <Text style={styles.bigButtonText}>Go to Stats Screen</Text>
        </TouchableOpacity>

        <View style={{ height: insets.bottom }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Progress bar
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
        {/* XP and stats */}
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

        {/* Tasks */}
        <View style={styles.card}>
          <Text style={styles.subtitle}>Gym Tasks</Text>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskBlock}>
              <Text style={styles.taskLabel}>{task.name}</Text>
              <ProgressBar progress={task.done ? 100 : 0} color="#FFB74D" />
              <TouchableOpacity
                style={[styles.bigButton, task.done && styles.buttonDisabled]}
                onPress={() => handleCompleteTask(task.id, task.xp)}
                disabled={task.done}
              >
                <Text style={styles.bigButtonText}>
                  {task.done ? "Completed" : `Complete (+${task.xp} XP)`}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Example navigation */}
        <TouchableOpacity
          style={[styles.bigButton, { backgroundColor: "#22C55E" }]}
          onPress={() => router.push("/StatsScreen")}
        >
          <Text style={styles.bigButtonText}>Go to Stats Screen</Text>
        </TouchableOpacity>

        {/* Spacer to keep button above tab bar */}
        <View style={{ height: insets.bottom }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
  title: { color: "#E5E7EB", fontSize: 22, fontWeight: "700" },
  logoutBtn: {
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
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
  },
  logoutText: { color: "#E5E7EB", fontWeight: "600" },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  avatar: { width: "100%", height: 240, resizeMode: "contain", marginBottom: 8 },
  avatarLevel: { color: "#4FC3F7", fontSize: 18, fontWeight: "bold" },
  card: {
    backgroundColor: "#1E1E1E",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  subtitle: { color: "#4FC3F7", fontSize: 18, fontWeight: "600", marginBottom: 12 },
  info: { color: "#E0E0E0", fontSize: 14, marginBottom: 6 },
  taskBlock: { marginBottom: 16 },
  taskLabel: { color: "#fff", fontSize: 15, marginBottom: 6 },
  progressBackground: {
    height: 10,
    backgroundColor: "#333",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: { height: "100%", borderRadius: 6 },
  bigButton: {
    backgroundColor: "#4FC3F7",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
  },
  bigButtonText: { color: "#121212", fontWeight: "bold", fontSize: 16 },
  buttonDisabled: { backgroundColor: "#555" },
});