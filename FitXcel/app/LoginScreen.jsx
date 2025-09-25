import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useFonts } from 'expo-font';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    MontserratBold: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  if (!fontsLoaded) return null;

  async function handleLogin() {
    try {
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        await AsyncStorage.setItem("token", data.token);
        router.replace("/"); // Redirect to tabs/home
      } else {
        Alert.alert("Login Failed", data.error || "Unknown error");
      }
    } catch (e) {
      Alert.alert("Error", "Could not connect to server.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontFamily: 'MontserratBold' }]}>FitXcel</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          placeholderTextColor="#888"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#888"
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace("/RegisterScreen")}>
        <Text style={styles.link}>Do not have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#111" },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8, color: "#fff", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#ccc", marginBottom: 32, textAlign: "center" },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, color: "#fff", marginBottom: 6, marginLeft: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#222",
    color: "#fff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  link: { color: "#2563eb", marginTop: 12, textAlign: "center", fontSize: 16 },
});