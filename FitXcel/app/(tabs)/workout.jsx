import React, { useState } from "react";
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
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const exampleExercises = ["Bench Press", "Squats", "Deadlift"];

export default function WorkoutLog() {
  const insets = useSafeAreaInsets();

  const [open, setOpen] = useState(false);
  const [exercise, setExercise] = useState(exampleExercises[0]);
  const [items, setItems] = useState(
    exampleExercises.map((ex) => ({ label: ex, value: ex }))
  );

  const [workouts, setWorkouts] = useState({});

  // Start new exercise with 1 set
  const addExercise = () => {
    if (!workouts[exercise]) {
      setWorkouts({
        ...workouts,
        [exercise]: [{ id: 1, weight: "", reps: "" }],
      });
    }
  };

  // Add a new set for an exercise
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
      set.id === setId ? { ...set, [field]: value } : set
    );
    setWorkouts({ ...workouts, [exerciseName]: updatedSets });
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#0b0b0c",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
      }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
        >
          <Text style={styles.title}>Log Workout</Text>

          {/* Dropdown to add exercise */}
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
            <TouchableOpacity style={styles.addButton} onPress={addExercise}>
              <Text style={styles.addButtonText}>+ Add Exercise</Text>
            </TouchableOpacity>
          </View>

          {/* Workout Cards */}
          {Object.keys(workouts).map((exName) => {
            const sets = workouts[exName];

            return (
              <View key={exName} style={styles.exerciseCard}>
                <Text style={styles.exerciseTitle}>{exName}</Text>

                {sets.map((set) => (
                  <View key={set.id} style={styles.setCard}>
                    <Text style={styles.setLabel}>Set {set.id}</Text>
                    <Text style={styles.previous}>
                      {set.weight && set.reps ? `${set.weight}kg x ${set.reps}` : "No previous"}
                    </Text>

                    <View style={styles.inputsRow}>
                      <TextInput
                        placeholder="Weight(kg)"
                        placeholderTextColor="#9ca3af"
                        value={set.weight}
                        onChangeText={(text) => updateSet(exName, set.id, "weight", text)}
                        style={styles.input}
                        keyboardType="numeric"
                      />
                      <TextInput
                        placeholder="Reps"
                        placeholderTextColor="#9ca3af"
                        value={set.reps}
                        onChangeText={(text) => updateSet(exName, set.id, "reps", text)}
                        style={styles.input}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                ))}

                {/* Add set button inside exercise card */}
                <TouchableOpacity
                  style={styles.addSetButton}
                  onPress={() => addSet(exName)}
                >
                  <Text style={styles.addSetButtonText}>+ Add Set</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#fff", alignSelf: "center" },

  dropdownWrapper: { zIndex: 1000, marginBottom: 16 },
  dropdown: { backgroundColor: "#0f1016", borderColor: "#1f2530", borderRadius: 12, marginBottom: 8 },
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
    elevation: 3,
  },
  exerciseTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 12 },

  setCard: {
    backgroundColor: "#1a1b20",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  setLabel: { color: "#22c55e", fontWeight: "600", marginBottom: 4 },
  previous: { color: "#9ca3af", marginBottom: 8 },

  inputsRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,                // let both inputs share space
    minWidth: 60,           // don’t shrink too much
    maxWidth: "48%",        // never exceed half the row
    backgroundColor: "#0f1016",
    borderWidth: 1,
    borderColor: "#1f2530",
    borderRadius: 8,
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
  addSetButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  addSetButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  inputsRow: {
    flexDirection: "row",
    gap: 8,
    flex: 1,                // allow row to adapt
    justifyContent: "space-between",
  },
});
