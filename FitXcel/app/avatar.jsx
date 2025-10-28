import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

import skinny from "../assets/images/starting.png";
import medium from "../assets/images/medium.png";
import built from "../assets/images/advanced.png";

export default function Avatar({ level = 1 }) {
  const numericLevel = Number(level); // ✅ ensure numeric
  console.log("Avatar level:", numericLevel);

  // Pick correct image
  let avatarSource = skinny;
  if (numericLevel >= 10) {
    avatarSource = built;
  } else if (numericLevel >= 5) {
    avatarSource = medium;
  }

  // Animated scaling
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const targetScale = 1 + numericLevel * 0.05;
    Animated.spring(scale, {
      toValue: targetScale,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [numericLevel]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={avatarSource}
        style={[styles.avatar, { transform: [{ scale }] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    height: 600,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
