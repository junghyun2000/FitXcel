import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function WorkoutHistory() {
  const router = useRouter(); // router for navigation
  const [workouts, setWorkouts] = useState([]); // state to store workout sessions
  const [loading, setLoading] = useState(true); // loading indicator

  // Fetch workouts from backend when component mounts
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const token = await AsyncStorage.getItem("token"); // get saved JWT token
        if (!token) {
          Alert.alert("Not Logged In", "Please log in first."); // notify if no token
          setLoading(false);
          return;
        }

        // request workouts from API
        const res = await fetch("http://localhost:4000/workout", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (res.ok) {
          // normalise workout data into a consistent format
          const formattedWorkouts = (data.workouts || []).map((w, idx) => ({
            id: w.id ? w.id : `fallback-${idx}`, // ensure unique id
            date: w.date ? new Date(w.date) : new Date(), // parse or fallback to now
            exercises: w.exercises || {}, // exercises with sets
          }));
          setWorkouts(formattedWorkouts);
        } else {
          Alert.alert("Error", data.error || "Failed to load workouts");
        }
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Could not connect to server.");
      } finally {
        setLoading(false); // stop loading spinner
      }
    };

    fetchWorkouts();
  }, []); // run once on mount

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading workouts...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0b0b0c" }}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout History</Text>
      </View>

      {/* Main scrollable content */}
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 16 }}>
        {workouts.length === 0 ? (
          // Show message if no workouts are found
          <Text style={styles.noData}>No workouts logged yet.</Text>
        ) : (
          // Render each workout session
          workouts.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              {/* Session date */}
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

              {/* Exercises inside this session */}
              {Object.keys(session.exercises).map((exerciseName) => (
                <View key={`${session.id}-${exerciseName}`} style={styles.exerciseCard}>
                  <Text style={styles.exerciseTitle}>{exerciseName}</Text>

                  {/* Sets inside each exercise */}
                  {session.exercises[exerciseName].map((set, index) => (
                    <Text
                      key={`${session.id}-${exerciseName}-${set.weight}-${set.reps}-${index}`}
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
    </View>
  );
}

// Styles for the UI
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16 
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
    fontWeight: "600" 
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 16,
  },
  title: { 
    color: "#fff", 
    fontSize: 22, 
    fontWeight: "700", 
    marginBottom: 16, 
    textAlign: "center" 
  },
  noData: { 
    color: "#fff", 
    fontSize: 16, 
    textAlign: "center" 
  },
  sessionCard: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#1a1b20",
    borderRadius: 12,
  },
  sessionDate: { 
    color: "#9ca3af", 
    fontSize: 14, 
    marginBottom: 8, 
    textAlign: "center" 
  },
  exerciseCard: { 
    marginBottom: 16, 
    backgroundColor: "#121318", 
    padding: 12, 
    borderRadius: 10 
  },
  exerciseTitle: { 
    color: "#22c55e", 
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 6 
  },
  setText: { 
    color: "#fff", 
    fontSize: 16, 
    marginLeft: 8 
  },
});
