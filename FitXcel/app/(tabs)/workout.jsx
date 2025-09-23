import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
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

  const addExercise = () => {
    if (!workouts[exercise]) {
      setWorkouts({
        ...workouts,
        [exercise]: [
          { id: 1, weight: "", reps: "" },
          { id: 2, weight: "", reps: "" },
          { id: 3, weight: "", reps: "" },
          { id: 4, weight: "", reps: "" },
        ],
      });
    }
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
          <Button title="Add Exercise" color="#22c55e" onPress={addExercise} />
        </View>

        {/* Workout Table */}
        {Object.keys(workouts).map((exName) => {
          const sets = workouts[exName];

          return (
            <View key={exName} style={styles.exerciseCard}>
              <Text style={styles.exerciseTitle}>{exName}</Text>

              <View style={styles.tableHeader}>
                <Text style={[styles.cell, { flex: 1 }]}>Sets</Text>
                <Text style={[styles.cell, { flex: 2 }]}>Previous</Text>
                <Text style={[styles.cell, { flex: 2 }]}>Weight</Text>
                <Text style={[styles.cell, { flex: 2 }]}>Reps</Text>
              </View>

              {sets.map((set) => (
                <View key={set.id} style={styles.tableRow}>
                  <Text style={[styles.cell, { flex: 1 }]}>{set.id}</Text>
                  <Text style={[styles.cell, { flex: 2 }]}>
                    {set.weight && set.reps ? `${set.weight}kg x ${set.reps}` : "-"}
                  </Text>
                  <TextInput
                    placeholder="Enter here..."
                    placeholderTextColor="#9ca3af"
                    value={set.weight}
                    onChangeText={(text) => updateSet(exName, set.id, "weight", text)}
                    style={[styles.cell, styles.input, { flex: 2 }]}
                    keyboardType="numeric"
                  />
                  <TextInput
                    placeholder="Enter here..."
                    placeholderTextColor="#9ca3af"
                    value={set.reps}
                    onChangeText={(text) => updateSet(exName, set.id, "reps", text)}
                    style={[styles.cell, styles.input, { flex: 2 }]}
                    keyboardType="numeric"
                  />
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: "800", color: "#fff", alignSelf: "center" },
  dropdownWrapper: { zIndex: 1000, marginBottom: 16 },
  dropdown: { backgroundColor: "#0f1016", borderColor: "#1f2530", borderRadius: 12, marginBottom: 8 },
  dropdownContainer: { backgroundColor: "#0f1016", borderColor: "#1f2530" },
  exerciseCard: { backgroundColor: "#121318", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#1f2530" },
  exerciseTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 8 },
  tableHeader: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderColor: "#1f2530" },
  tableRow: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderColor: "#1f2530" },
  cell: { color: "#fff", textAlign: "center" },
  input: {
    backgroundColor: "#0f1016",
    borderWidth: 1,
    borderColor: "#1f2530",
    borderRadius: 8,
    color: "#fff",
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === "ios" ? 4 : 2,
  },
});
