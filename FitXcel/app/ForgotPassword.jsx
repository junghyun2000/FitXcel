import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking } from "react-native";
import { useRouter } from "expo-router";

// keep the same fetch style, but allow EXPO_PUBLIC_API_BASE_URL if set
// Allow the API base to be overridden by Expo config, else fall back to local dev server
const BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [devLink, setDevLink] = useState(null);
  const router = useRouter();

  // Request a reset link for the provided email; backend always responds with 200 to avoid email enumeration
  async function handleSubmit() {
    if (!email.trim()) {
      Alert.alert("Missing email", "Please enter your email.");
      return;
    }
    try {
      setSubmitting(true);
      setDevLink(null);

      const res = await fetch(`${BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      // backend always returns 200; in dev it also returns devLink
      if (data?.devLink) setDevLink(data.devLink);
      Alert.alert("Check your inbox", "If that email exists, we sent a reset link.");
    } catch (e) {
      console.log("forgot-password error:", e?.message);
      Alert.alert("Check your inbox", "If that email exists, we sent a reset link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your account email. We’ll send a reset link.</Text>

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

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send reset link</Text>}
      </TouchableOpacity>

      {/* Dev helper: tap to open the deep link directly if backend returned it */}
      {devLink ? (
        <TouchableOpacity onPress={() => Linking.openURL(devLink)} style={{ marginTop: 16 }}>
          <Text style={[styles.link, { textAlign: "center" }]}>Open dev reset link</Text>
          <Text style={{ color: "#ccc", fontSize: 12, marginTop: 6 }} numberOfLines={2}>{devLink}</Text>
        </TouchableOpacity>
      ) : null}

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
