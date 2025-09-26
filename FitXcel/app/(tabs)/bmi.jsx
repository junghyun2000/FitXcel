// BMI Calculator Screen
// This screen calculates BMI (and a rough body-fat estimate) and visualizes it on a linear gauge.
// It is fully client-side: no networking, only React state + SVG drawing.

import React, { useMemo, useState } from "react";
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
import Svg, { Line, Circle, Text as SvgText } from "react-native-svg";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

/** WHO categories */
// WHO BMI category thresholds used to color the gauge and label the user’s category.
// Each category has a display label, inclusive lower bound `min`, exclusive upper bound `max`,
// and a color used on the gauge and legend.
const WHO_CATEGORIES = [
  { label: "Severely Underweight", min: 0, max: 16.0, color: "#3b82f6" },
  { label: "Underweight", min: 16.0, max: 18.5, color: "#60a5fa" },
  { label: "Normal", min: 18.5, max: 25.0, color: "#22c55e" },
  { label: "Overweight", min: 25.0, max: 30.0, color: "#f59e0b" },
  { label: "Obese Class I", min: 30.0, max: 35.0, color: "#ef4444" },
  { label: "Obese Class II", min: 35.0, max: 40.0, color: "#dc2626" },
  { label: "Obese Class III", min: 40.0, max: Infinity, color: "#991b1b" },
];

// Hook to select category set by sex (kept generic for future expansion).
// Currently returns WHO_CATEGORIES regardless of sex.
const getCategoriesFor = (_sex) => WHO_CATEGORIES; 

// Rough body-fat % estimation using Deurenberg et al. approximation:
// BF% ≈ 1.2*BMI + 0.23*Age − 10.8*(male?1:0) − 5.4
// Returns NaN when inputs are not finite.
function estimateBodyFat(bmi, age, sex) {
  if (!isFinite(bmi) || !isFinite(age)) return NaN;
  const maleAdjust = sex === "male" ? 10.8 : 0;
  return 1.2 * bmi + 0.23 * age - maleAdjust - 5.4;
}

// Determine which category the BMI falls into.
// Falls back to the last category if BMI is above the final bound.
function classifyBMI(bmi, categories) {
  if (!isFinite(bmi)) return null;
  return (
    categories.find((c) => bmi >= c.min && bmi < c.max) ||
    categories[categories.length - 1]
  );
}

/** Scale helpers */
// Gauge bounds for the linear scale visualization.
// These define the clamping range: values <16 map to the start; values >40 map to the end.
const GAUGE_MIN = 16;
const GAUGE_MAX = 40;

export default function BmiScreen() {
  // Insets for bottom padding on devices with safe areas (e.g., iPhone with home indicator).
  const insets = useSafeAreaInsets();

  // --- Form state ---
  const [sex, setSex] = useState("male"); // Gender selection affects body-fat estimate.
  const [age, setAge] = useState("23"); // Age (years) as a string for TextInput.
  const [height, setHeight] = useState("180"); // Height (cm) as a string.
  const [weight, setWeight] = useState("70.1"); // Weight (kg) as a string.

  // Numeric conversions for calculation; empty/invalid strings result in NaN.
  const hM = Number(height) / 100;
  const wKg = Number(weight);
  const ageNum = Number(age);

  // Compute BMI, category, and body-fat estimate only when inputs change.
  // useMemo avoids unnecessary recalculation on unrelated renders.
  const { bmi, category, bf } = useMemo(() => {
    const cats = getCategoriesFor(sex);
    const val = !hM || !wKg ? NaN : wKg / (hM * hM); // BMI = kg / m^2
    const cat = classifyBMI(val, cats);
    const bodyFat = estimateBodyFat(val, ageNum, sex);
    return { bmi: val, category: cat, bf: bodyFat };
  }, [sex, ageNum, hM, wKg]);

  // UI-friendly formatted strings for BMI and body fat.
  const bmiText = isFinite(bmi)
    ? (Math.round(bmi * 10) / 10).toFixed(1)
    : "--";
  const bfText = isFinite(bf) ? `${Math.max(0, Math.round(bf))}%` : "--";
  const cats = getCategoriesFor(sex);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#0b0b0c",
        // Adds extra top padding on Android to account for the status bar height.
        paddingTop:
          Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
      }}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 16 }, // Keep content above bottom safe area.
        ]}
      >
        <Text style={styles.title}>BMI Analysis</Text>

        {/* Gender pills */}
        {/* Two-state segmented control to set `sex` for the body-fat formula. */}
        <View style={styles.pillGroup}>
          <TouchableOpacity
            style={[styles.pill, sex === "male" && styles.pillActive]}
            onPress={() => setSex("male")}
          >
            <Text
              style={[styles.pillText, sex === "male" && styles.pillTextActive]}
            >
              ♂ Male
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, sex === "female" && styles.pillActive]}
            onPress={() => setSex("female")}
          >
            <Text
              style={[
                styles.pillText,
                sex === "female" && styles.pillTextActive,
              ]}
            >
              ♀ Female
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inputs */}
        {/* Three compact fields for height (cm), weight (kg), and age (yrs). */}
        <View style={styles.pillGroupInputs}>
          <View style={styles.smallField}>
            <Text style={styles.smallLabel}>Height</Text>
            <TextInput
              value={height}
              onChangeText={setHeight}
              keyboardType={
                Platform.OS === "ios" ? "decimal-pad" : "numeric"
              }
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
              keyboardType={
                Platform.OS === "ios" ? "decimal-pad" : "numeric"
              }
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

        {/* Linear Scale */}
        {/* SVG-based linear gauge showing BMI position across colored WHO ranges. */}
        <View style={styles.gaugeCard}>
          <Svg width={320} height={92}>
            {(() => {
              // Track geometry (padding on left/right; vertical center).
              const trackX1 = 10;
              const trackX2 = 310;
              const trackY = 53;
              const barW = trackX2 - trackX1;

              // Convert a BMI value into an x-position along the track.
              // Values are clamped to [GAUGE_MIN, GAUGE_MAX].
              const valToX = (v) => {
                const t = (v - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN);
                const clamped = Math.max(0, Math.min(1, t));
                return trackX1 + clamped * barW;
              };

              return (
                <>
                  {/* Background track (full width, dark) */}
                  <Line
                    x1={trackX1}
                    y1={trackY}
                    x2={trackX2}
                    y2={trackY}
                    stroke="#1f2937"
                    strokeWidth={18}
                    strokeLinecap="round"
                  />

                  {/* Colored segments for WHO zones within the overall track */}
                  {[
                    { from: GAUGE_MIN, to: 18.5, color: "#60a5fa" },
                    { from: 18.5, to: 25.0, color: "#22c55e" },
                    { from: 25.0, to: 30.0, color: "#f59e0b" },
                    { from: 30.0, to: 35.0, color: "#ef4444" },
                    { from: 35.0, to: GAUGE_MAX, color: "#e61a1aff" },
                  ].map((seg, i) => {
                    const x1 = valToX(Math.max(GAUGE_MIN, seg.from));
                    const x2 = valToX(Math.min(GAUGE_MAX, seg.to));
                    return (
                      <Line
                        key={i}
                        x1={x1}
                        y1={trackY}
                        x2={x2}
                        y2={trackY}
                        stroke={seg.color}
                        strokeWidth={14}
                        strokeLinecap="butt"
                      />
                    );
                  })}

                  {/* Tick marks + numeric labels at key thresholds */}
                  {[GAUGE_MIN, 18.5, 25, 30, 35, GAUGE_MAX].map((tick, i) => {
                const x = valToX(tick);
              return (
              <React.Fragment key={i}>
                <Line x1={x} y1={trackY + 12} x2={x} y2={trackY + 20} stroke="#374151" strokeWidth={2} />
                <SvgText
                  x={x}
                  y={trackY + 34}
                  fontSize="10"
                  fill="#9ca3af"
                  textAnchor="middle"
                >
                  {tick}
                </SvgText>
              </React.Fragment>
              );
          })}

                  {/* Pointer showing the user’s BMI position on the track */}
                  {isFinite(bmi) && (() => {
                    const px = valToX(bmi);
                    return (
                      <>
                        <Line
                          x1={px}
                          y1={trackY - 16}
                          x2={px}
                          y2={trackY + 16}
                          stroke="#ffffff"
                          strokeWidth={3}
                        />
                        <Circle
                          cx={px}
                          cy={trackY}
                          r={6}
                          fill="#ffffff"
                          stroke="#111827"
                          strokeWidth={2}
                        />
                      </>
                    );
                  })()}

                  {/* Centered labels above the track: category and numeric BMI */}
                  <SvgText
                    x={(trackX1 + trackX2) / 2}
                    y={14}
                    fontSize="12"
                    fill="#a1a1aa"
                    textAnchor="middle"
                  >
                    {category ? category.label : "—"}
                  </SvgText>
                  <SvgText
                    x={(trackX1 + trackX2) / 2}
                    y={36}
                    fontSize="22"
                    fontWeight="700"
                    fill="#ffffff"
                    textAnchor="middle"
                  >
                    {bmiText}
                  </SvgText>
                </>
              );
            })()}
          </Svg>

          {/* Category + body-fat estimate labels below the gauge */}
          <Text style={styles.centerLabel}>
            {category ? category.label : "—"}
            {category?.label === "Normal" ? "  •  Great!" : ""}
          </Text>
          <Text style={styles.subtle}>
            Estimated body fat ({sex}): {bfText}
          </Text>
        </View>

        {/* Legend */}
        {/* List of WHO categories with color dots and numeric ranges. */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Categories</Text>
          {cats.map((c, i) => (
            <View style={styles.legendRow} key={i}>
              <View style={[styles.dot, { backgroundColor: c.color }]} />
              <Text style={styles.legendText}>{c.label}</Text>
              <Text style={styles.legendRange}>
                {c.min === 0
                  ? "< 16.0"
                  : c.max === Infinity
                  ? "≥ 40"
                  : `${c.min.toFixed(1)} – ${c.max.toFixed(1)}`}
              </Text>
            </View>
          ))}
        </View>

        {/* Footnote disclaimers */}
        <Text style={styles.footerNote}>
          * BMI is a screening tool and may not reflect body composition (e.g.,
          athletes, bodybuilders, etc).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles for the entire screen: dark theme with soft borders and rounded cards.
// Uses a mix of layout (flex, spacing) and color tokens for visual hierarchy.
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b0b0c" },
  scrollContent: { padding: 16, gap: 12 },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    alignSelf: "center",
    marginTop: 4,
  },

  // Segmented control container for gender selection.
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

  // Input “chip” group that wraps across lines on small screens.
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

  // Single compact input field: label, input, and trailing unit.
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
    flexBasis: "45%", // 2 per row on small screens
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

  // Card container around the SVG gauge and textual readings.
  gaugeCard: {
    backgroundColor: "#0f1016",
    borderWidth: 1,
    borderColor: "#1f2530",
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  centerLabel: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  subtle: { color: "#9ca3af", fontSize: 12, marginTop: 4 },

  // Legend card lists color-coded categories with their numeric bounds.
  legend: {
    backgroundColor: "#0f1016",
    borderWidth: 1,
    borderColor: "#1f2530",
    borderRadius: 16,
    padding: 12,
  },
  legendTitle: {
    color: "#c8c8cc",
    fontWeight: "700",
    marginBottom: 8,
    alignSelf: "center",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  dot: { width: 10, height: 10, borderRadius: 6, marginRight: 10 },
  legendText: { flex: 1, color: "#e5e7eb" },
  legendRange: { color: "#9ca3af" },

  // Fine print / disclaimer text at the bottom.
  footerNote: {
    color: "#9ca3af",
    fontSize: 11,
    textAlign: "center",
    marginTop: 6,
  },
});
