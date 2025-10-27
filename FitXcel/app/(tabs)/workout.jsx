import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BASE_URL } from "../../utils/api";

const exampleExercises = ["Bench Press", "Squats", "Deadlift"];

export default function WorkoutLog() {
  const insets = useSafeAreaInsets(); // Handles safe area (top/bottom padding)
  const router = useRouter(); // Navigation helper
  const { selectedExercise } = useLocalSearchParams(); // Read param if user came from search screen

  // Dropdown state
  const [open, setOpen] = useState(false); // Controls dropdown open/close
  const [exercise, setExercise] = useState(exampleExercises[0]); // Currently selected exercise
  const [items, setItems] = useState([]); // Dropdown items list

  // Custom exercise input and workout state
  const [newExercise, setNewExercise] = useState(""); // New exercise text field
  const [workouts, setWorkouts] = useState({}); // Stores sets per exercise
  const [loading, setLoading] = useState(true); // Controls loading indicator

  // Load previously saved custom exercises from AsyncStorage
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

  // Load dropdown items from AsyncStorage (persistent dropdown list)
  useEffect(() => {
    const loadDropdownItems = async () => {
      try {
        const stored = await AsyncStorage.getItem("exerciseDropdownItems");
        if (stored) {
          setItems(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Error loading saved dropdown:", error);
      }
    };
    loadDropdownItems();
  }, []);

  // Fetch previously logged workouts from backend
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
          // Transform server response into a format suitable for UI rendering
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

  // Handle exercise passed from search screen (auto-add + save locally)
  useEffect(() => {
    const saveExerciseToStorage = async (exerciseName) => {
      try {
        const stored = await AsyncStorage.getItem("exerciseDropdownItems");
        let existing = stored ? JSON.parse(stored) : [];

        const alreadyExists = existing.some(
          (item) => item.value.toLowerCase() === exerciseName.toLowerCase()
        );

        if (!alreadyExists) {
          const newItem = { label: exerciseName, value: exerciseName };
          const updated = [...existing, newItem];
          await AsyncStorage.setItem(
            "exerciseDropdownItems",
            JSON.stringify(updated)
          );
          setItems(updated);
          Alert.alert(
            "Exercise Added",
            `${exerciseName} has been added to your exercise list.`
          );
        } else {
          setItems(existing);
        }
      } catch (error) {
        console.error("Error saving exercise dropdown:", error);
      }
    };

    if (selectedExercise) {
      // Save the passed-in exercise and add to workout list
      saveExerciseToStorage(selectedExercise);
      setExercise(selectedExercise);
      setWorkouts((prev) => ({
        ...prev,
        [selectedExercise]:
          prev[selectedExercise] || [{ id: 1, weight: "", reps: "" }],
      }));
    }
  }, [selectedExercise]);

  // Adds a selected exercise to the workout log
  const addExercise = () => {
    if (!workouts[exercise]) {
      setWorkouts({
        ...workouts,
        [exercise]: [{ id: 1, weight: "", reps: "" }],
      });
    }
  };

  // Adds a completely new custom exercise (stored persistently)
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

    // Save custom exercise locally
    const saved = await AsyncStorage.getItem("customExercises");
    const existing = saved ? JSON.parse(saved) : [];
    await AsyncStorage.setItem(
      "customExercises",
      JSON.stringify([...existing, formattedName])
    );

    Alert.alert("Added", `${formattedName} added to exercises!`);
  };

  // Adds another set to a given exercise
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

  // Updates weight/reps input for a specific set
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

  // Submits all workout data to the backend
  const finishWorkout = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Not Logged In", "Please log in first.");
        return;
      }

      // Build payload with all non-empty sets
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

      // Send POST request
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

      // Clear weight/reps but keep previous set data visible
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

  // Show spinner while loading workouts
  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeContainer,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading workouts...</Text>
      </SafeAreaView>
    );
  }

  // UI
  return (
    <SafeAreaView style={[styles.safeContainer, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Log Workout</Text>

          {/* Exercise selection dropdown */}
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
              listMode="MODAL"
            />

            {/* Button: Add selected exercise to workout list */}
            <TouchableOpacity style={styles.addButton} onPress={addExercise}>
              <Text style={styles.addButtonText}>+ Log Exercise</Text>
            </TouchableOpacity>
          </View>

          {/* Custom exercise input */}
          <TextInput
            style={styles.newExerciseInput}
            placeholder="Add Custom Exercise"
            placeholderTextColor="#9ca3af"
            value={newExercise}
            onChangeText={setNewExercise}
          />

          {/* Button: Save custom exercise */}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: "#3b82f6" }]}
            onPress={addNewExercise}
          >
            <Text style={styles.addButtonText}>+ Add Custom Exercise</Text>
          </TouchableOpacity>

          {/* Display exercise cards with sets */}
          {Object.keys(workouts)
            .filter((exName) => workouts[exName]?.length > 0)
            .map((exName) => {
              const sets = workouts[exName];
              return (
                <View key={exName} style={styles.exerciseCard}>
                  <Text style={styles.exerciseTitle}>{exName}</Text>

                  {/* Render all sets for each exercise */}
                  {sets.map((set) => (
                    <View key={set.id} style={styles.setCard}>
                      <Text style={styles.setLabel}>Set {set.id}</Text>
                      <Text style={styles.previous}>
                        {set.previousWeight && set.previousReps
                          ? `${set.previousWeight}kg x ${set.previousReps}`
                          : "No previous"}
                      </Text>

                      {/* Input row for weight and reps */}
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

                  {/* Button: Add new set for this exercise */}
                  <TouchableOpacity
                    style={styles.addSetButton}
                    onPress={() => addSet(exName)}
                  >
                    <Text style={styles.addSetButtonText}>+ Add Set</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

          {/* Navigation buttons */}
          <TouchableOpacity
            style={[styles.finishButton, { backgroundColor: "#3b82f6" }]}
            onPress={() => router.push("/workoutsearch")}
          >
            <Text style={styles.finishButtonText}>Search Exercises</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.finishButton, { backgroundColor: "#3b82f6" }]}
            onPress={() => router.push("/workouthistory")}
          >
            <Text style={styles.finishButtonText}>See Workout History</Text>
          </TouchableOpacity>

          {/* Submit button */}
          <TouchableOpacity style={styles.finishButton} onPress={finishWorkout}>
            <Text style={styles.finishButtonText}>Finish Workout</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#0b0b0c",
    paddingHorizontal: 16,
  },
  scrollContent: {
    padding: 16,
    width: "100%"
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    alignSelf: "center"
  },
  dropdownWrapper: {
    zIndex: 1000,
    marginBottom: 16
  },
  dropdown: {
    backgroundColor: "#0f1016",
    borderColor: "#1f2530",
    borderRadius: 12,
    marginBottom: 8,
  },
  dropdownContainer: {
    backgroundColor: "#0f1016",
    borderColor: "#1f2530"
  },
  addButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700"
  },
  exerciseCard: {
    backgroundColor: "#121318",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    width: "100%",
    alignSelf: "stretch",
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
  setLabel: {
    color: "#22c55e",
    fontWeight: "600",
    marginBottom: 4
  },
  previous: {
    color: "#9ca3af",
    marginBottom: 8
  },
  input: {
    flex: 1,
    minWidth: 60,
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
  addSetButtonText: { 
    color: "#fff", 
    fontSize: 15, 
    fontWeight: "600" 
  },
  finishButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  finishButtonText: { 
    color: "#fff", 
    fontSize: 17, 
    fontWeight: "700" 
  },
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
