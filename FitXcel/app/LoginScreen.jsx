import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useFonts } from "expo-font";
import { BASE_URL } from "../utils/api";

export default function LoginScreen() {
  // Track the form fields so inputs stay in sync with state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // Lazy load the display font; rendering early causes layout jumps
  const [fontsLoaded] = useFonts({
    MontserratBold: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  if (!fontsLoaded) return null;

  // Submit credentials to the API and persist the session token on success
  async function handleLogin() {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        await AsyncStorage.setItem("token", data.token);
        router.replace("/");
      } else {
        Alert.alert("Login Failed", data.error || "Unknown error");
      }
    } catch (_err) {
      Alert.alert("Error", "Could not connect to server.");
    }
  }

  return (
    <ImageBackground
      source={require("../assets/images/ed67011f18655c66be813bab8599d3c0.png")}
      style={styles.background}
      imageStyle={styles.image}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={styles.inner}
        >
          {/* UI headline */}
          <Text style={[styles.title, { fontFamily: "MontserratBold" }]}>FitXcel</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* Email field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              placeholderTextColor="rgba(255,255,255,0.75)"
            />
          </View>

          {/* Password field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor="rgba(255,255,255,0.75)"
            />
          </View>

          {/* Primary submit button */}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          {/* Secondary navigation links */}
          <TouchableOpacity onPress={() => router.replace("/RegisterScreen")}>
            <Text style={styles.link}>Do not have an account? Register</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/ForgotPassword")}>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#000" },
  image: {
    resizeMode: "cover",
    transform: [{ translateX: 10 }, { translateY: 10 }, { scale: 1.05 }],
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    alignSelf: "center",
    width: "100%",
    maxWidth: 420,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
    marginBottom: 32,
  },
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 15,
    color: "rgba(255,255,255,0.88)",
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.6)",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "rgba(15,23,42,0.28)",
    color: "#f8fafc",
    fontSize: 16,
  },
  button: {
    backgroundColor: "rgba(34,197,94,0.92)",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(20,83,45,0.9)",
  },
  buttonText: {
    color: "#052e16",
    fontWeight: "800",
    fontSize: 18,
  },
  link: {
    color: "rgba(255,255,255,0.88)",
    marginTop: 10,
    textAlign: "center",
    fontSize: 15,
  },
});
