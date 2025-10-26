import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WorkoutHistory() {
  const router = useRouter();

  // State variables
  const [workouts, setWorkouts] = useState([]); // Stores list of user workouts
  const [loading, setLoading] = useState(true); // Tracks loading state while fetching data

  // Fetch workouts from backend API on component mount
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        // Retrieve authentication token from AsyncStorage
        const token = await AsyncStorage.getItem("token");

        // If no token, prompt user to log in and stop loading
        if (!token) {
          Alert.alert("Not Logged In", "Please log in first.");
          setLoading(false);
          return;
        }

        // Make an authorised API request to get workout history
        const res = await fetch("http://localhost:4000/workout", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        // Handle successful response
        if (res.ok) {
          // Format workouts safely, providing fallbacks for missing data
          const formattedWorkouts = (data.workouts || []).map((w, idx) => ({
            id: w.id ? w.id : `fallback-${idx}`,
            date: w.date ? new Date(w.date) : new Date(),
            exercises: w.exercises || {},
          }));
          setWorkouts(formattedWorkouts);
        } else {
          // Handle errors returned from server
          Alert.alert("Error", data.error || "Failed to load workouts");
        }
      } catch (err) {
        // Handle connection or parsing errors
        console.error(err);
        Alert.alert("Error", "Could not connect to server.");
      } finally {
        // Stop loading indicator after API call completes
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []); // Empty dependency array ensures this runs once on mount

  // Display loading spinner while data is being fetched
  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { justifyContent: "center", alignItems: "center" }]}
      >
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading workouts...</Text>
      </SafeAreaView>
    );
  }

  //UI
  return (
    <SafeAreaView style={styles.container}>
      {/* Header section with back navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout History</Text>
      </View>

      {/* Scrollable content area displaying workout sessions */}
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        {workouts.length === 0 ? (
          // Message shown when no workout data is available
          <Text style={styles.noData}>No workouts logged yet.</Text>
        ) : (
          // Map through each workout session and render details
          workouts.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              {/* Display formatted session date */}
              <Text style={styles.sessionDate}>
                {session.date.toLocaleString(undefined, {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Text>

              {/* Display exercises and sets for this workout */}
              {Object.keys(session.exercises).map((exerciseName) => (
                <View
                  key={`${session.id}-${exerciseName}`}
                  style={styles.exerciseCard}
                >
                  <Text style={styles.exerciseTitle}>{exerciseName}</Text>

                  {/* List each set with weight and reps */}
                  {session.exercises[exerciseName].map((set, index) => (
                    <Text
                      key={`${session.id}-${exerciseName}-${index}`}
                      style={styles.setText}
                    >
                      Set {index + 1}: {set.weight || 0}kg × {set.reps || 0} reps
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#0B1220", 
    padding: 16 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B1220",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  backButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "600" 
  },
  headerTitle: {
    color: "#E5E7EB",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 16,
  },
  noData: { 
    color: "#E5E7EB", 
    fontSize: 16, 
    textAlign: "center", 
    marginTop: 20 
  },
  sessionCard: {
    marginBottom: 24,
    padding: 14,
    backgroundColor: "#0F172A",
    borderColor: "#1E293B",
    borderWidth: 1,
    borderRadius: 14,
  },
  sessionDate: { 
    color: "#94A3B8", 
    fontSize: 14, 
    marginBottom: 8, 
    textAlign: "center" 
  },
  exerciseCard: {
    marginBottom: 14,
    backgroundColor: "#0B1220",
    borderWidth: 1,
    borderColor: "#1F2937",
    borderRadius: 10,
    padding: 10,
  },
  exerciseTitle: {
    color: "#22C55E",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  setText: { 
    color: "#E5E7EB", 
    fontSize: 16, 
    marginLeft: 8 
  },
});
