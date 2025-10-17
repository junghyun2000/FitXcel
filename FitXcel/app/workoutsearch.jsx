import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

export default function ExerciseSearch() {
  const [query, setQuery] = useState("");
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const API_KEY = "7kSjZqGNltiGA8AryiZ6qA==KOkbR3jbLrdv96cB";

  const fetchExercises = async () => {
    if (!query.trim()) {
      setError("Please enter a muscle or exercise type.");
      return;
    }
    setLoading(true);
    setError("");
    setExercises([]);
    Keyboard.dismiss();

    try {
      const response = await axios.get(
        `https://api.api-ninjas.com/v1/exercises?muscle=${query.toLowerCase()}`,
        {
          headers: { "X-Api-Key": API_KEY },
        }
      );

      if (response.data.length === 0) {
        setError("No exercises found for that muscle.");
      } else {
        setExercises(response.data);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch exercises. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0b0b0c" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exercise Finder</Text>
      </View>

      {/* Search Input */}
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter a muscle (e.g., chest, legs, biceps)"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={fetchExercises}
          />
          <TouchableOpacity style={styles.searchButton} onPress={fetchExercises}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={{ color: "#fff", marginTop: 8 }}>Fetching exercises...</Text>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Results */}
        <FlatList
          data={exercises}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.exerciseCard}>
              <Text style={styles.exerciseTitle}>{item.name}</Text>
              <Text style={styles.detailText}>Type: {item.type}</Text>
              <Text style={styles.detailText}>Muscle: {item.muscle}</Text>
              <Text style={styles.detailText}>Difficulty: {item.difficulty}</Text>
              <Text style={styles.detailText}>
                Equipment: {item.equipment || "None"}
              </Text>
              <Text style={styles.instructions}>{item.instructions}</Text>


              <TouchableOpacity
                style={{
                  backgroundColor: "#22c55e",
                  paddingVertical: 10,
                  borderRadius: 8,
                  marginTop: 10,
                  alignItems: "center",
                }}
                onPress={() =>
                  router.push({
                    pathname: "/workout",
                    params: { selectedExercise: item.name },
                  })
                }
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  + Add to Workout Log
                </Text>
              </TouchableOpacity>

            </View>
          )}
          ListEmptyComponent={
            !loading && !error ? <Text style={styles.noData}>No exercises yet.</Text> : null
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </View>
  );
}

// 💪 Consistent styling with WorkoutHistory
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
    zIndex: 1000,
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
  searchContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "#121318",
    borderWidth: 1,
    borderColor: "#1a1b20",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
  },
  searchButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 10,
    marginLeft: 8,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  noData: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  exerciseCard: {
    backgroundColor: "#1a1b20",
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
  },
  exerciseTitle: {
    color: "#22c55e",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  detailText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  instructions: {
    color: "#9ca3af",
    marginTop: 6,
    fontStyle: "italic",
  },
  error: {
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 10,
  },
});
