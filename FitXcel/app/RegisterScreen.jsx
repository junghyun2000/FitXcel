import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  function isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
  }

  async function handleRegister() {
    console.log("Register pressed");
    if (!isValidEmail(email.trim())) {
    console.log("Invalid email detected");
    Alert.alert("Invalid Email", "Please enter a valid email address.");
    return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }
    try {
      const res = await fetch("http://localhost:4000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "Account created! Please log in.");
        router.replace("/LoginScreen");
      } else {
        Alert.alert("Registration Failed", data.error || "Unknown error");
      }
    } catch (e) {
      Alert.alert("Error", "Could not connect to server.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Register to get started</Text>
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
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace("/LoginScreen")}>
        <Text style={styles.link}>Already have an account? Login</Text>
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
    borderColor: "#22c55e",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#222",
    color: "#fff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#22c55e",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  link: { color: "#2563eb", marginTop: 12, textAlign: "center", fontSize: 16 },
});
