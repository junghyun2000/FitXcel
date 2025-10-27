import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import io from "socket.io-client";
import { apiGet } from "../../utils/api";
import { getSocket } from "../../utils/socket";

const SOCKET_URL = "https://fitxcel.onrender.com"; // your backend URL

export default function GameArenaJoin() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/profile");
        setStats(res.stats || { strength: 10, stamina: 10, agility: 10 });
      } catch {
        Alert.alert("Error", "Could not load player stats.");
      }
    })();
  }, []);

  const startAIBattle = () => {
    router.push({
      pathname: "../gamearena",
      params: { mode: "ai" },
    });
  };

  const createRoom = () => {
    if (!stats) return Alert.alert("Please wait for stats to load.");

    const socket = getSocket(); // ✅ persistent socket instance

    // Wait for connection before emitting
    if (!socket.connected) {
      socket.connect();
    }
    console.log("✅ Connected to socket:", socket.id);
    socket.emit("createRoom", { stats });

    socket.on("roomCreated", ({ roomId }) => {
      setRoomCode(roomId);
      setStatus(`Room ${roomId} created. Waiting for your friend...`);
      Alert.alert("Room Created", `Share this code with your friend: ${roomId}`);
    });

    socket.off("matchReady");
    socket.on("matchReady", ({ roomId, players }) => {
      console.log("✅ Match ready, navigating to battle:", roomId);
      router.push({
        pathname: "/gamearena",
        params: { mode: "pvp", roomId, players: JSON.stringify(players)},
      });
    });

    socket.off("errorMsg");
    socket.on("errorMsg", (msg) => Alert.alert("Error", msg));
  };

  const joinRoom = () => {
    if (!roomCode.trim()) return Alert.alert("Enter a room code first!");

    const socket = getSocket();
    socket.on("connect", () => {
      console.log("✅ Connected to socket:", socket.id);
      socket.emit("joinRoom", {
        roomId: roomCode.trim().toUpperCase(),
        playerData: { stats },
      });
    });

    socket.on("matchReady", ({ roomId, players }) => {
      console.log("✅ Match ready, navigating to battle:", roomId);
      router.push({
        pathname: "/gamearena",
        params: { mode: "pvp", roomId ,players: JSON.stringify(players), },
      });
    });

    socket.on("errorMsg", (msg) => Alert.alert("Error", msg));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Game Arena</Text>
      <Text style={styles.subtitle}>Choose battle mode</Text>

      <TouchableOpacity style={[styles.btn, { backgroundColor: "#22C55E" }]} onPress={startAIBattle}>
        <Text style={styles.btnText}>Battle AI</Text>
      </TouchableOpacity>

      <View style={styles.roomSection}>
        <TextInput
          placeholder="Enter Room Code"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={roomCode}
          onChangeText={setRoomCode}
        />
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btnSmall, { backgroundColor: "#EAB308" }]} onPress={createRoom}>
            <Text style={styles.btnTextSmall}>Create</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnSmall, { backgroundColor: "#3B82F6" }]} onPress={joinRoom}>
            <Text style={styles.btnTextSmall}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.status}>{status}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220", padding: 20 },
  title: { color: "#60A5FA", fontSize: 26, fontWeight: "bold", textAlign: "center", marginTop: 20 },
  subtitle: { color: "#CBD5E1", textAlign: "center", marginBottom: 20 },
  btn: { marginVertical: 10, paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 10,
    padding: 10,
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  roomSection: { marginTop: 20 },
  row: { flexDirection: "row", justifyContent: "center" },
  btnSmall: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, marginHorizontal: 5 },
  btnTextSmall: { color: "#111", fontWeight: "700" },
  status: { color: "#94A3B8", textAlign: "center", marginTop: 20 },
});