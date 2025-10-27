import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function BmiInputScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // keep form fields controlled so we can pass them to the result screen
  const [sex, setSex] = useState("male");
  const [age, setAge] = useState("23");
  const [height, setHeight] = useState("180");
  const [weight, setWeight] = useState("70.1");

  // navigate to the result view and carry the raw inputs as query params
  const onCompute = () => {
    router.push({
      pathname: "/bmi-result",
      params: { sex, age, height, weight },
    });
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#0b0b0c",
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
      }}
      edges={["top", "bottom"]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BMI Analysis</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        <Text style={styles.subtitle}>Enter your details to get an instant analysis.</Text>

        {/* Gender pills */}
        <View style={styles.pillGroup}>
          <TouchableOpacity
            style={[styles.pill, sex === "male" && styles.pillActive]}
            onPress={() => setSex("male")}
          >
            <Text style={[styles.pillText, sex === "male" && styles.pillTextActive]}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, sex === "female" && styles.pillActive]}
            onPress={() => setSex("female")}
          >
            <Text style={[styles.pillText, sex === "female" && styles.pillTextActive]}>Female</Text>
          </TouchableOpacity>
        </View>

        {/* Inputs */}
        <View style={styles.pillGroupInputs}>
          <View style={styles.smallField}>
            <Text style={styles.smallLabel}>Height</Text>
            <TextInput
              value={height}
              onChangeText={setHeight}
              keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
              placeholder="cm"
              style={styles.smallInput}
            />
            <Text style={styles.unit}>cm</Text>
          </View>

          <View style={styles.smallField}>
            <Text style={styles.smallLabel}>Weight</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
              placeholder="kg"
              style={styles.smallInput}
            />
            <Text style={styles.unit}>kg</Text>
          </View>

          <View style={styles.smallField}>
            <Text style={styles.smallLabel}>Age</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholder="yrs"
              style={styles.smallInput}
            />
            <Text style={styles.unit}>yrs</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={onCompute} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Compute</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/bmi-history")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>History</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 12 },
  header: {
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2530",
    backgroundColor: "#0b0b0c",
  },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "900" },
  subtitle: {
    color: "#9ca3af",
    textAlign: "center",
    fontSize: 14,
    marginBottom: 4,
  },
  pillGroup: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "center",
    backgroundColor: "#121318",
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
    borderColor: "#1f2530",
  },
  pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  pillActive: { backgroundColor: "#1f2530" },
  pillText: { color: "#a1a1aa", fontWeight: "700" },
  pillTextActive: { color: "#fff" },
  pillGroupInputs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignSelf: "center",
    backgroundColor: "#121318",
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
    borderColor: "#1f2530",
    maxWidth: "100%",
  },
  smallField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121318",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#1f2530",
    flexGrow: 1,
    flexBasis: "45%",
    minWidth: 140,
    marginBottom: 8,
  },
  smallLabel: { color: "#9ca3af", marginRight: 8, fontSize: 12 },
  smallInput: {
    flex: 1,
    minWidth: 0,
    color: "#fff",
    fontSize: 16,
    paddingVertical: Platform.select({ ios: 6, android: 2 }),
  },
  unit: { color: "#9ca3af", marginLeft: 6, flexShrink: 0 },
  actions: { marginTop: 18, gap: 10 },
  primaryButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#14532d",
  },
  primaryButtonText: { color: "#06210f", fontWeight: "800" },
  secondaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1f2530",
  },
  secondaryButtonText: { color: "#22c55e", fontWeight: "800" },
});
