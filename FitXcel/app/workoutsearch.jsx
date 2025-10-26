import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, } from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";

export default function WorkoutSearch() {
  // Local state hooks
  const [selectedMuscle, setSelectedMuscle] = useState(null); // Currently selected muscle group
  const [exercises, setExercises] = useState([]); // List of exercises fetched from the API
  const [loading, setLoading] = useState(false); // Loading indicator state
  const [error, setError] = useState(""); // Error message state
  const router = useRouter(); // Router instance for navigation between screens

  // API key for api-ninjas
  const API_KEY = "7kSjZqGNltiGA8AryiZ6qA==KOkbR3jbLrdv96cB";

  // List of selectable muscle groups for the dropdown
  const muscleGroups = [
    "abdominals",
    "abductors",
    "adductors",
    "biceps",
    "calves",
    "chest",
    "forearms",
    "glutes",
    "hamstrings",
    "lats",
    "lower_back",
    "middle_back",
    "neck",
    "quadriceps",
    "traps",
    "triceps",
  ].map((m) => ({
    label: m.replace("_", " ").toUpperCase(), // Display label
    value: m, // API value
  }));

  // Fetch exercises from the API based on the selected muscle group.
  const fetchExercises = async (muscle) => {
    if (!muscle) return; // Skip if no muscle selected

    // Reset states before fetching
    setLoading(true);
    setError("");
    setExercises([]);

    try {
      // Fetch exercise data from API
      const response = await axios.get(
        `https://api.api-ninjas.com/v1/exercises?muscle=${muscle}`,
        { headers: { "X-Api-Key": API_KEY } }
      );

      // If no exercises found for the selected muscle
      if (response.data.length === 0) {
        setError("No exercises found for that muscle.");
      } else {
        // Otherwise, update exercises state
        setExercises(response.data);
      }
    } catch (err) {
      // Catch any network or server errors
      console.error(err);
      setError("Failed to fetch exercises. Try again later.");
    } finally {
      // Hide loading indicator when done
      setLoading(false);
    }
  };

  //UI
  return (
    <View style={{ flex: 1, backgroundColor: "#0b0b0c" }}>
      {/* Header Section with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Exercise</Text>
      </View>

      {/* Main content area */}
      <View style={styles.container}>
        <Text style={styles.title}>Select a Muscle Group</Text>

        {/* Dropdown Menu for Muscle Group Selection */}
        <View style={styles.dropdownWrapper}>
          <Dropdown
            style={styles.dropdown}
            containerStyle={styles.dropdownContainer}
            data={muscleGroups}
            labelField="label"
            valueField="value"
            placeholder="Select Muscle Group"
            placeholderStyle={{ color: "#9ca3af" }}
            selectedTextStyle={{ color: "#fff" }}
            itemTextStyle={{ color: "#fff" }}
            value={selectedMuscle}
            onChange={(item) => {
              setSelectedMuscle(item.value); // Update selected muscle
              fetchExercises(item.value); // Trigger exercise fetch
            }}
          />
        </View>

        {/* Loading Indicator while fetching exercises */}
        {loading && (
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={{ color: "#fff", marginTop: 8 }}>Fetching exercises...</Text>
          </View>
        )}

        {/* Error message if something goes wrong */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* List of Exercises (if available) */}
        <FlatList
          data={exercises}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.exerciseCard}>
              {/* Exercise Name and Details */}
              <Text style={styles.exerciseTitle}>{item.name}</Text>
              <Text style={styles.detailText}>Type: {item.type}</Text>
              <Text style={styles.detailText}>Muscle: {item.muscle}</Text>
              <Text style={styles.detailText}>Difficulty: {item.difficulty}</Text>
              <Text style={styles.detailText}>
                Equipment: {item.equipment || "None"}
              </Text>
              <Text style={styles.instructions}>{item.instructions}</Text>

              {/* Button to Add Selected Exercise to Workout Log */}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  router.push({
                    pathname: "/workout",
                    params: { selectedExercise: item.name },
                  })
                }
              >
                <Text style={styles.addButtonText}>+ Add to Workout Log</Text>
              </TouchableOpacity>
            </View>
          )}
          // When no results found (and not loading)
          ListEmptyComponent={
            !loading && !error ? <Text style={styles.noData}></Text> : null
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b0b0c",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1b20",
  },
  backButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    alignSelf: "center",
    marginBottom: 16,
  },
  dropdownWrapper: {
    zIndex: 1000,
    marginBottom: 16,
  },
  dropdown: {
    backgroundColor: "#0f1016",
    borderColor: "#1f2530",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 50,
  },
  dropdownContainer: {
    backgroundColor: "#1a1b20",
    borderColor: "#1f2530",
    borderWidth: 1,
    borderRadius: 12,
  },
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
  detailText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 4,
  },
  instructions: {
    color: "#9ca3af",
    marginTop: 6,
    fontStyle: "italic",
  },
  addButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  noData: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  error: {
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 10,
  },
});
