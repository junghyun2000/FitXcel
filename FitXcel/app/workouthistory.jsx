import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function WorkoutHistory() {
  const [workouts, setWorkouts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Not Logged In", "Please log in first.");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:4000/workout", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (res.ok) {
          // transform backend data to match display format
          const transformedWorkouts = {};
          Object.keys(data.workouts || {}).forEach((exName) => {
            const sets = Array.isArray(data.workouts[exName]) ? data.workouts[exName] : [];
            transformedWorkouts[exName] = sets.map((s, index) => ({
              id: index + 1,
              weight: s.weight || "",
              reps: s.reps || "",
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
    };

    fetchWorkouts();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Loading workouts...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Workout History</Text>
      {Object.keys(workouts).length === 0 ? (
        <Text style={styles.noData}>No workouts logged yet.</Text>
      ) : (
        Object.keys(workouts).map((exName) => (
          <View key={exName} style={styles.exerciseCard}>
            <Text style={styles.exerciseTitle}>{exName}</Text>
            {workouts[exName].map((set) => (
              <Text key={set.id} style={styles.setText}>
                Set {set.id}: {set.weight || 0}kg x {set.reps || 0}
              </Text>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0c", padding: 16 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  noData: { color: "#fff", fontSize: 16, textAlign: "center" },
  exerciseCard: { marginBottom: 16, backgroundColor: "#121318", padding: 12, borderRadius: 10 },
  exerciseTitle: { color: "#22c55e", fontSize: 18, fontWeight: "700", marginBottom: 6 },
  setText: { color: "#fff", fontSize: 16, marginLeft: 8 },
});
