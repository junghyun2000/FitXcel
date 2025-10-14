import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { apiGet, apiPost, BASE_URL } from "../../utils/api";

const exampleExercises = ["Bench Press", "Squats", "Deadlift"];

export default function WorkoutLog() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [exercise, setExercise] = useState(exampleExercises[0]);
  const [items, setItems] = useState(
    exampleExercises.map((ex) => ({ label: ex, value: ex }))
  );
  const [newExercise, setNewExercise] = useState("");
  const [workouts, setWorkouts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExercises() {
      const saved = await AsyncStorage.getItem("customExercises");
      if (saved) {
        const custom = JSON.parse(saved);
        setItems((prev) => [
          ...prev,
          ...custom.map((e) => ({ label: e, value: e })),
        ]);
      }
    }
    loadExercises();
  }, []);

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${BASE_URL}/workout`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok) {
          const transformedWorkouts = {};
          Object.keys(data.workouts || {}).forEach((exName) => {
            const sets = Array.isArray(data.workouts[exName])
              ? data.workouts[exName]
              : [];
            transformedWorkouts[exName] = sets.map((s, index) => ({
              id: index + 1,
              weight: "",
              reps: "",
              previousWeight: s.weight || 0,
              previousReps: s.reps || 0,
            }));
          });
          setWorkouts(transformedWorkouts);
        } else {
          Alert.alert("Error", data.error || "Failed to load workouts");
        }
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Could not connect to server.");
      } finally {
        setLoading(false);
      }
    }

    fetchWorkouts();
  }, []);

  const addExercise = () => {
    if (!workouts[exercise]) {
      setWorkouts({
        ...workouts,
        [exercise]: [{ id: 1, weight: "", reps: "" }],
      });
    }
  };

  const addNewExercise = async () => {
    if (!newExercise.trim()) {
      Alert.alert("Error", "Please enter an exercise name.");
      return;
    }
    const formattedName = newExercise.trim();
    if (
      items.some(
        (item) => item.value.toLowerCase() === formattedName.toLowerCase()
      )
    ) {
      Alert.alert("Duplicate", "This exercise already exists.");
      return;
    }
    const newItem = { label: formattedName, value: formattedName };
    setItems((prev) => [...prev, newItem]);
    setExercise(formattedName);
    setNewExercise("");
    const saved = await AsyncStorage.getItem("customExercises");
    const existing = saved ? JSON.parse(saved) : [];
    await AsyncStorage.setItem(
      "customExercises",
      JSON.stringify([...existing, formattedName])
    );
    Alert.alert("Added", `${formattedName} added to exercises!`);
  };

  const addSet = (exerciseName) => {
    const currentSets = workouts[exerciseName] || [];
    const newSet = {
      id: currentSets.length + 1,
      weight: "",
      reps: "",
    };
    setWorkouts({
      ...workouts,
      [exerciseName]: [...currentSets, newSet],
    });
  };

  const updateSet = (exerciseName, setId, field, value) => {
    const updatedSets = workouts[exerciseName].map((set) =>
      set.id === setId
        ? {
            ...set,
            [field]: value,
            previousWeight:
              field === "weight" && value ? value : set.previousWeight,
            previousReps:
              field === "reps" && value ? value : set.previousReps,
          }
        : set
    );
    setWorkouts({ ...workouts, [exerciseName]: updatedSets });
  };

  const finishWorkout = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Not Logged In", "Please log in first.");
        return;
      }

      const payloadWorkouts = {};
      Object.keys(workouts).forEach((exName) => {
        const sets = workouts[exName] || [];
        const filteredSets = sets
          .filter(
            (s) => s.weight || s.reps || s.previousWeight || s.previousReps
          )
          .map((s) => ({
            weight: s.weight || s.previousWeight || 0,
            reps: s.reps || s.previousReps || 0,
          }));
        if (filteredSets.length > 0) payloadWorkouts[exName] = filteredSets;
      });

      if (Object.keys(payloadWorkouts).length === 0) {
        Alert.alert("No Data", "Please enter at least one set before finishing.");
        return;
      }

      const response = await fetch(`${BASE_URL}/workout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workouts: payloadWorkouts }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save workout");

      Alert.alert("Success", "Workout saved!");

      const clearedWorkouts = {};
      Object.keys(workouts).forEach((exName) => {
        const currentSets = workouts[exName] || [];
        clearedWorkouts[exName] = currentSets.map((s) => ({
          id: s.id,
          weight: "",
          reps: "",
          previousWeight: s.weight ? s.weight : s.previousWeight || "",
          previousReps: s.reps ? s.reps : s.previousReps || "",
        }));
      });
      setWorkouts(clearedWorkouts);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save workout");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeContainer, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading workouts...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeContainer, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Log Workout</Text>

          <View style={styles.dropdownWrapper}>
            <DropDownPicker
              open={open}
              value={exercise}
              items={items}
              setOpen={setOpen}
              setValue={setExercise}
              setItems={setItems}
              placeholder="Select Exercise"
              style={styles.dropdown}
              textStyle={{ color: "#fff" }}
              dropDownContainerStyle={styles.dropdownContainer}
              zIndex={1000}
            />

            <TextInput
              style={styles.newExerciseInput}
              placeholder="Add new exercise..."
              placeholderTextColor="#9ca3af"
              value={newExercise}
              onChangeText={setNewExercise}
            />

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: "#3b82f6" }]}
              onPress={addNewExercise}
            >
              <Text style={styles.addButtonText}>+ Add Custom Exercise</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addButton} onPress={addExercise}>
              <Text style={styles.addButtonText}>+ Add Exercise to Log</Text>
            </TouchableOpacity>
          </View>

          {Object.keys(workouts)
            .filter((exName) => workouts[exName]?.length > 0)
            .map((exName) => {
              const sets = workouts[exName];
              return (
                <View key={exName} style={styles.exerciseCard}>
                  <Text style={styles.exerciseTitle}>{exName}</Text>

                  {sets.map((set) => (
                    <View key={set.id} style={styles.setCard}>
                      <Text style={styles.setLabel}>Set {set.id}</Text>
                      <Text style={styles.previous}>
                        {set.previousWeight && set.previousReps
                          ? `${set.previousWeight}kg x ${set.previousReps}`
                          : "No previous"}
                      </Text>

                      <View style={styles.inputsRow}>
                        <TextInput
                          placeholder={
                            set.previousWeight
                              ? `${set.previousWeight}kg`
                              : "Weight(kg)"
                          }
                          placeholderTextColor="#9ca3af"
                          value={set.weight}
                          onChangeText={(text) =>
                            updateSet(exName, set.id, "weight", text)
                          }
                          style={styles.input}
                          keyboardType="numeric"
                        />
                        <TextInput
                          placeholder={
                            set.previousReps
                              ? `${set.previousReps} reps`
                              : "Reps"
                          }
                          placeholderTextColor="#9ca3af"
                          value={set.reps}
                          onChangeText={(text) =>
                            updateSet(exName, set.id, "reps", text)
                          }
                          style={styles.input}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addSetButton}
                    onPress={() => addSet(exName)}
                  >
                    <Text style={styles.addSetButtonText}>+ Add Set</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

          <TouchableOpacity style={styles.finishButton} onPress={finishWorkout}>
            <Text style={styles.finishButtonText}>Finish Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.finishButton, { backgroundColor: "#3b82f6" }]}
            onPress={() => router.push("/workouthistory")}
          >
            <Text style={styles.finishButtonText}>See Workout History</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#0b0b0c",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  scrollContent: { padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#fff", alignSelf: "center" },
  dropdownWrapper: { zIndex: 1000, marginBottom: 16 },
  dropdown: {
    backgroundColor: "#0f1016",
    borderColor: "#1f2530",
    borderRadius: 12,
    marginBottom: 8,
  },
  dropdownContainer: { backgroundColor: "#0f1016", borderColor: "#1f2530" },
  addButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  exerciseCard: {
    backgroundColor: "#121318",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  setCard: {
    backgroundColor: "#1a1b20",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  setLabel: { color: "#22c55e", fontWeight: "600", marginBottom: 4 },
  previous: { color: "#9ca3af", marginBottom: 8 },
  input: {
    flex: 1,
    minWidth: 60,
    maxWidth: "48%",
    backgroundColor: "#0f1016",
    borderWidth: 1,
    borderColor: "#1f2530",
    borderRadius: 8,
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  inputsRow: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
    justifyContent: "space-between",
  },
  addSetButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  addSetButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  finishButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  finishButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  newExerciseInput: {
    backgroundColor: "#0f1016",
    borderColor: "#1f2530",
    borderWidth: 1,
    borderRadius: 10,
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
    fontSize: 16,
  },
});