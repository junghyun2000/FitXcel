import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
const BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function ResetPassword() {
  // token can be pasted OR your email link can deep-link here and your app can prefill later
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  function validate() {
    if (!token.trim()) {
      Alert.alert("Missing token", "Paste the token from your email link.");
      return false;
    }
    if (!password || password.length < 8) {
      Alert.alert("Weak password", "Please enter at least 8 characters.");
      return false;
    }
    if (password !== confirm) {
      Alert.alert("Passwords do not match", "Please re-enter the same password.");
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const res = await fetch(`${BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Password updated", "You can now log in with your new password.", [
          { text: "OK", onPress: () => router.replace("/LoginScreen") },
        ]);
      } else {
        Alert.alert("Error", data?.error || "Unable to reset password. Your link may have expired.");
      }
    } catch (e) {
      console.log("reset-password error:", e?.message);
      Alert.alert("Error", "Unable to reset password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter a new password for your account.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Token</Text>
        <TextInput
          placeholder="Paste token from email"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          style={styles.input}
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>New Password</Text>
        <TextInput
          placeholder="New password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          placeholder="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#888"
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update password</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/LoginScreen")} style={{ marginTop: 24 }}>
        <Text style={[styles.link, { textAlign: "center" }]}>Back to Login</Text>
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
  link: { color: "#2563eb", marginTop: 12, fontSize: 16 },
});
