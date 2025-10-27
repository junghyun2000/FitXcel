import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { apiGet } from "../utils/api";

export default function BmiHistoryScreen() {
  // respect safe areas when laying out scroll regions
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Pull the latest BMI history from the backend and keep local state in sync
  const fetchHistory = async () => {
    setRefreshing(true);
    try {
      const data = await apiGet("/bmi/history");
      const arr = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
      // Normalize various shapes coming from the server and sort newest first
      const normalized = arr
        .map((it) => {
          const created =
            it.createdAt ||
            it.clientCreatedAt ||
            it.date ||
            it.timestamp ||
            null;
          const heightCm = it.heightCm ?? it.height ?? null;
          const weightKg = it.weightKg ?? it.weight ?? null;
          const bmi = typeof it.bmi === "number" ? it.bmi : Number(it.bmi);
          return {
            _id: it._id || it.id,
            sex: it.sex,
            age: it.age,
            heightCm,
            weightKg,
            bmi,
            createdAt: created,
          };
        })
        .sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });
      setItems(normalized);
    } catch (e) {
      Alert.alert("History load failed", String(e?.message || e || "Error"));
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // refetch whenever the screen regains focus so history stays fresh
      fetchHistory();
    }, [])
  );

  const renderItem = ({ item }) => {
    const when = item.createdAt ? new Date(item.createdAt) : null;
    const whenStr = when ? `${when.toLocaleDateString()} ${when.toLocaleTimeString()}` : "";
    const bmiText = Number.isFinite(item.bmi) ? item.bmi.toFixed(1) : String(item.bmi ?? "");
    return (
      <View
        style={{
          backgroundColor: "#0f1016",
          borderWidth: 1,
          borderColor: "#1f2530",
          borderRadius: 12,
          padding: 12,
          marginBottom: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>BMI: {bmiText}</Text>
        <Text style={{ color: "#c8c8cc", marginTop: 4 }}>
          {(item.sex || "").toUpperCase()} • {item.age} yrs • {item.heightCm} cm • {item.weightKg} kg
        </Text>
        <Text style={{ color: "#9ca3af", marginTop: 4 }}>{whenStr}</Text>
      </View>
    );
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
      {/* Visible top bar with Back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BMI History</Text>
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        <FlatList
          data={items}
          keyExtractor={(it, idx) => String(it._id || idx)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchHistory} tintColor="#fff" />
          }
          ListEmptyComponent={
            <Text style={{ color: "#9ca3af", alignSelf: "center", marginTop: 24 }}>
              No entries yet.
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b0b0c",
    borderBottomWidth: 1,
    borderBottomColor: "#1f2530",
    position: "relative",
  },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "900" },
  backButton: {
    position: "absolute",
    left: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  backButtonText: { color: "#e5e7eb", fontWeight: "900" },
});
