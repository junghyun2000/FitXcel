import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { apiGet } from "../../utils/api";

export default function GameArena() {
  const insets = useSafeAreaInsets();

  const [player, setPlayer] = useState(null);
  const [enemy, setEnemy] = useState(null);
  const [log, setLog] = useState([]);
  const [winner, setWinner] = useState(null);
  const [energy, setEnergy] = useState(0);
  const [floatTexts, setFloatTexts] = useState([]);

  // Animations
  const hitAnim = useRef(new Animated.Value(1)).current;
  const enemyHitAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const enemyFlinchAnim = useRef(new Animated.Value(0)).current;
  const playerBounceAnim = useRef(new Animated.Value(0)).current;

  // Sounds
  const [sounds, setSounds] = useState({});

  useEffect(() => {
    loadStats();
    preloadSounds();
    return () => unloadSounds();
  }, []);

  const loadStats = async () => {
    try {
      const res = await apiGet("/profile");
      const stats = res.stats || { strength: 10, stamina: 10, agility: 10 };
      const playerHP = stats.stamina * 100;
      const enemyStats = {
        strength: Math.round(stats.strength * 0.9 + Math.random() * 5),
        stamina: Math.round(stats.stamina * 0.9 + Math.random() * 5),
        agility: Math.round(stats.agility * 0.9 + Math.random() * 5),
      };
      const enemyHP = enemyStats.stamina * 100;
      setPlayer({ ...stats, hp: playerHP, maxHp: playerHP });
      setEnemy({ ...enemyStats, hp: enemyHP, maxHp: enemyHP });
      setWinner(null);
      setEnergy(0);
      setLog(["Battle started!"]);
      setFloatTexts([]);
      playerBounceAnim.setValue(0);
    } catch {
      Alert.alert("Error", "Could not load stats for game");
    }
  };

  const preloadSounds = async () => {
    try {
      const hit = new Audio.Sound();
      const special = new Audio.Sound();
      const win = new Audio.Sound();
      const lose = new Audio.Sound();
      await hit.loadAsync(require("../../assets/sounds/hit.wav"));
      await special.loadAsync(require("../../assets/sounds/special.wav"));
      await win.loadAsync(require("../../assets/sounds/win.wav"));
      await lose.loadAsync(require("../../assets/sounds/lose.wav"));
      setSounds({ hit, special, win, lose });
    } catch (err) {
      console.warn("Sound preload error:", err);
    }
  };

  const unloadSounds = async () => {
    for (const s of Object.values(sounds)) if (s) await s.unloadAsync();
  };

  const playSound = async (key) => {
    try {
      const sound = sounds[key];
      if (sound) await sound.replayAsync();
    } catch {}
  };

  const animateHit = (anim) =>
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.7, duration: 80, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

  const animateSpecial = () =>
    Animated.parallel([
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]),
    ]).start();

  const enemyFlinch = () =>
    Animated.sequence([
      Animated.timing(enemyFlinchAnim, {
        toValue: -15,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(enemyFlinchAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

  // 🏆 Victory pose
  const playerVictoryPose = () => {
    Animated.sequence([
      Animated.timing(playerBounceAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(playerBounceAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(playerBounceAnim, {
            toValue: -10,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(playerBounceAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  // Floating text
  const spawnFloatText = (text, color, target, offset = 0) => {
    const id = Math.random().toString();
    const y = new Animated.Value(0);
    const opacity = new Animated.Value(1);
    const scale = new Animated.Value(0.6);
    setFloatTexts((p) => [...p, { id, text, color, y, opacity, scale, target, offset }]);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]),
      Animated.timing(y, { toValue: -40, duration: 800, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start(() => setFloatTexts((p) => p.filter((f) => f.id !== id)));
  };

  const doAttack = (isSpecial = false) => {
    if (winner || !player || !enemy) return;

    const multiplier = isSpecial ? 3 : 1;
    const damage = Math.round(player.strength * (0.8 + Math.random() * 0.4) * multiplier);
    const dodgeChance = enemy.agility * 0.5;
    const dodged = Math.random() * 100 < dodgeChance;

    if (dodged) {
      // MISS text on left of enemy
      spawnFloatText("MISS", "#F87171", "enemy", -30);
      playSound("hit");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setLog((p) => ["Enemy dodged your attack!", ...p]);
      enemyAttack();
      return;
    }

    if (isSpecial) {
      playSound("special");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      animateSpecial();
    } else {
      playSound("hit");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const newHP = Math.max(0, enemy.hp - damage);
    setEnemy({ ...enemy, hp: newHP });
    animateHit(enemyHitAnim);
    enemyFlinch();
    // damage number right of enemy
    spawnFloatText(`-${damage}`, isSpecial ? "#EAB308" : "#F87171", "enemy", 30);

    setLog((p) => [
      isSpecial ? `💥 SPECIAL HIT! ${damage}` : `You dealt ${damage} damage!`,
      ...p,
    ]);
    if (isSpecial) setEnergy(0);
    else setEnergy((e) => Math.min(100, e + (10 + player.agility / 5)));

    if (newHP <= 0) {
      playSound("win");
      playerVictoryPose();
      setWinner("You win!");
      setLog((p) => ["🎉 You defeated the enemy!", ...p]);
    } else setTimeout(enemyAttack, 800);
  };

  const enemyAttack = () => {
    if (winner || !player) return;
    const damage = Math.round(enemy.strength * (0.8 + Math.random() * 0.4));
    const dodgeChance = player.agility * 0.5;
    const dodged = Math.random() * 100 < dodgeChance;

    if (dodged) {
      // MISS text on right of player
      spawnFloatText("MISS", "#F87171", "player", 30);
      setLog((p) => ["You dodged the attack!", ...p]);
      return;
    }

    playSound("hit");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const newHP = Math.max(0, player.hp - damage);
    setPlayer({ ...player, hp: newHP });
    animateHit(hitAnim);
    // damage number left of player
    spawnFloatText(`-${damage}`, "#9CA3AF", "player", -30);
    setLog((p) => [`Enemy hit you for ${damage} damage!`, ...p]);
    if (newHP <= 0) {
      playSound("lose");
      setWinner("Enemy wins!");
      setLog((p) => ["💀 You were defeated!", ...p]);
    }
  };

  const healthPercent = (hp, max) => Math.max(0, (hp / max) * 100);
  const shake = { transform: [{ translateX: shakeAnim }] };

  const renderFloatTexts = (target) =>
    floatTexts
      .filter((f) => f.target === target)
      .map((f) => (
        <Animated.Text
          key={f.id}
          style={[
            styles.floatText,
            {
              color: f.color,
              transform: [
                { translateY: f.y },
                { scale: f.scale },
                { translateX: f.offset },
              ],
              opacity: f.opacity,
            },
          ]}
        >
          {f.text}
        </Animated.Text>
      ));

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
      <Text style={styles.title}>⚔️ Battle Arena</Text>
      {player && enemy ? (
        <>
          <Animated.View style={[styles.battleArea, shake]}>
            {/* Player */}
            <View style={styles.avatarWrapper}>
              <Animated.View
                style={[
                  styles.side,
                  { transform: [{ scale: hitAnim }, { translateY: playerBounceAnim }] },
                ]}
              >
                <Image
                  source={require("../../assets/images/level1.png")}
                  style={[styles.avatar, { transform: [{ scaleX: 1 }] }]}
                />
                <View style={styles.healthContainer}>
                  <View
                    style={[
                      styles.healthFill,
                      { width: `${healthPercent(player.hp, player.maxHp)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.hpText}>
                  You: {player.hp}/{player.maxHp}
                </Text>
              </Animated.View>
              <View style={styles.floatLeft}>{renderFloatTexts("player")}</View>
            </View>

            {/* Enemy */}
            <View style={styles.avatarWrapper}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.side}
                onPress={() => doAttack(false)}
                disabled={!!winner}
              >
                <Animated.Image
                  source={require("../../assets/images/level4.png")}
                  style={[
                    styles.avatar,
                    {
                      transform: [
                        { scaleX: -1 },
                        { translateX: enemyFlinchAnim },
                        { scale: enemyHitAnim },
                      ],
                    },
                  ]}
                />
                <View style={styles.healthContainer}>
                  <View
                    style={[
                      styles.healthFillEnemy,
                      { width: `${healthPercent(enemy.hp, enemy.maxHp)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.hpText}>
                  Enemy: {enemy.hp}/{enemy.maxHp}
                </Text>
              </TouchableOpacity>
              <View style={styles.floatRight}>{renderFloatTexts("enemy")}</View>
            </View>
          </Animated.View>

          <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flashAnim }]} />

          <View style={styles.energyContainer}>
            <View style={[styles.energyFill, { width: `${energy}%` }]} />
          </View>
          <Text style={styles.energyText}>Energy: {Math.floor(energy)}%</Text>

          {energy >= 100 && !winner && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#EAB308" }]}
              onPress={() => doAttack(true)}
            >
              <Text style={styles.btnText}>⚡ SPECIAL ATTACK ⚡</Text>
            </TouchableOpacity>
          )}

          {winner && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#22C55E" }]}
              onPress={() => loadStats()}
            >
              <Text style={styles.btnText}>Play Again</Text>
            </TouchableOpacity>
          )}

          <View style={styles.logBox}>
            {log.map((line, i) => (
              <Text key={i} style={styles.logText}>
                {line}
              </Text>
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.loading}>Loading battle...</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220", padding: 16 },
  title: { color: "#4FC3F7", fontSize: 22, fontWeight: "700", marginBottom: 10 },
  battleArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },
  avatarWrapper: { flex: 1, alignItems: "center", position: "relative" },
  floatLeft: {
    position: "absolute",
    top: 10,
    left: "22%", // closer to avatar
    alignItems: "flex-start",
  },
  floatRight: {
    position: "absolute",
    top: 10,
    right: "22%", // closer to avatar
    alignItems: "flex-end",
  },
  floatText: {
    fontSize: 22,
    fontWeight: "900",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  side: { alignItems: "center" },
  avatar: { width: 140, height: 140, resizeMode: "contain" },
  healthContainer: {
    width: "70%",
    height: 10,
    backgroundColor: "#1E293B",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 6,
  },
  healthFill: { height: "100%", backgroundColor: "#22C55E" },
  healthFillEnemy: { height: "100%", backgroundColor: "#EF4444" },
  hpText: { color: "#E5E7EB", marginTop: 4, fontSize: 14 },
  energyContainer: {
    width: "100%",
    height: 10,
    backgroundColor: "#1E293B",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 6,
  },
  energyFill: { height: "100%", backgroundColor: "#EAB308" },
  energyText: { color: "#FACC15", textAlign: "center", marginBottom: 8 },
  btn: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { color: "#121212", fontWeight: "bold", fontSize: 16 },
  flash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FDE68A",
    opacity: 0,
  },
  logBox: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    maxHeight: 150,
  },
  logText: { color: "#94A3B8", fontSize: 14, marginBottom: 4 },
  loading: { color: "#94A3B8", textAlign: "center", marginTop: 40 },
});