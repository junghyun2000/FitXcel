import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from "react-native";
import Svg, { Line, Circle, Text as SvgText } from "react-native-svg";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiPost } from "../utils/api";

/** WHO categories */
const WHO_CATEGORIES = [
  { label: "Severely Underweight", min: 0, max: 16.0, color: "#3b82f6" },
  { label: "Underweight", min: 16.0, max: 18.5, color: "#60a5fa" },
  { label: "Normal", min: 18.5, max: 25.0, color: "#22c55e" },
  { label: "Overweight", min: 25.0, max: 30.0, color: "#f59e0b" },
  { label: "Obese Class I", min: 30.0, max: 35.0, color: "#ef4444" },
  { label: "Obese Class II", min: 35.0, max: 40.0, color: "#dc2626" },
  { label: "Obese Class III", min: 40.0, color: "#991b1b", max: Infinity },
];

const getCategoriesFor = (_sex) => WHO_CATEGORIES;
const GAUGE_MIN = 16;
const GAUGE_MAX = 40;

function classifyBMI(bmi, categories) {
  if (!isFinite(bmi)) return null;
  return (
    categories.find((c) => bmi >= c.min && bmi < c.max) ||
    categories[categories.length - 1]
  );
}

function estimateBodyFat(bmi, age, sex) {
  if (!isFinite(bmi) || !isFinite(age)) return NaN;
  const maleAdjust = sex === "male" ? 10.8 : 0;
  return 1.2 * bmi + 0.23 * age - maleAdjust - 5.4;
}

export default function BmiResultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [saving, setSaving] = useState(false);

  const sex = String(params.sex || "male");
  const age = Number(params.age || 0);
  const height = Number(params.height || 0);
  const weight = Number(params.weight || 0);

  const hM = height ? height / 100 : 0;
  const wKg = weight || 0;

  const { bmi, category, bf } = useMemo(() => {
    const cats = getCategoriesFor(sex);
    const val = !hM || !wKg ? NaN : wKg / (hM * hM);
    const cat = classifyBMI(val, cats);
    const bodyFat = estimateBodyFat(val, age, sex);
    return { bmi: val, category: cat, bf: bodyFat };
  }, [sex, age, hM, wKg]);

  const bmiRounded = isFinite(bmi) ? Number((Math.round(bmi * 10) / 10).toFixed(1)) : NaN;
  const bmiText = isFinite(bmi) ? bmiRounded.toFixed(1) : "--";
  const bfText = isFinite(bf) ? `${Math.max(0, Math.round(bf))}%` : "--";
  const cats = getCategoriesFor(sex);

  const onSave = async () => {
    if (!isFinite(bmi)) {
      Alert.alert("Enter values", "Invalid height/weight.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        // keep both generic and explicit keys to satisfy differing backends
        height: Number(height),
        weight: Number(weight),
        heightCm: Number(height),
        weightKg: Number(weight),
        age: Number(age),
        sex,
        bmi: bmiRounded,
        clientCreatedAt: new Date().toISOString(),
      };
      await apiPost("/bmi", payload);
      router.push("/bmi-history"); // go see it immediately
    } catch (err) {
      Alert.alert("Save failed", String(err?.message || err || "Could not save BMI"));
    } finally {
      setSaving(false);
    }
  };

  const onDoNotSave = () => {
    router.back();
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
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12, paddingVertical: 6 }}>
          <Text style={{ color: "#e5e7eb", fontWeight: "900" }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900" }}>BMI Result</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        <Text style={styles.title}>Your BMI</Text>

        {/* Gauge */}
        <View style={styles.gaugeCard}>
          <Svg width={320} height={92}>
            {(() => {
              const trackX1 = 10;
              const trackX2 = 310;
              const trackY = 53;
              const barW = trackX2 - trackX1;
              const valToX = (v) => {
                const t = (v - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN);
                const clamped = Math.max(0, Math.min(1, t));
                return trackX1 + clamped * barW;
              };
              return (
                <>
                  <Line x1={trackX1} y1={trackY} x2={trackX2} y2={trackY} stroke="#1f2937" strokeWidth={18} strokeLinecap="round" />
                  {[
                    { from: GAUGE_MIN, to: 18.5, color: "#60a5fa" },
                    { from: 18.5, to: 25.0, color: "#22c55e" },
                    { from: 25.0, to: 30.0, color: "#f59e0b" },
                    { from: 30.0, to: 35.0, color: "#ef4444" },
                    { from: 35.0, to: GAUGE_MAX, color: "#e61a1aff" },
                  ].map((seg, i) => {
                    const x1 = valToX(Math.max(GAUGE_MIN, seg.from));
                    const x2 = valToX(Math.min(GAUGE_MAX, seg.to));
                    return <Line key={i} x1={x1} y1={trackY} x2={x2} y2={trackY} stroke={seg.color} strokeWidth={14} strokeLinecap="butt" />;
                  })}
                  {[GAUGE_MIN, 18.5, 25, 30, 35, GAUGE_MAX].map((tick, i) => {
                    const x = valToX(tick);
                    return (
                      <React.Fragment key={i}>
                        <Line x1={x} y1={trackY + 12} x2={x} y2={trackY + 20} stroke="#374151" strokeWidth={2} />
                        <SvgText x={x} y={trackY + 34} fontSize="10" fill="#9ca3af" textAnchor="middle">
                          {tick}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                  {isFinite(bmiRounded) && (() => {
                    const px = valToX(bmiRounded);
                    return (
                      <>
                        <Line x1={px} y1={trackY - 16} x2={px} y2={trackY + 16} stroke="#ffffff" strokeWidth={3} />
                        <Circle cx={px} cy={trackY} r={6} fill="#ffffff" stroke="#111827" strokeWidth={2} />
                      </>
                    );
                  })()}
                  <SvgText x={(trackX1 + trackX2) / 2} y={14} fontSize="12" fill="#a1a1aa" textAnchor="middle">
                    {category ? category.label : "—"}
                  </SvgText>
                  <SvgText x={(trackX1 + trackX2) / 2} y={36} fontSize="22" fontWeight="700" fill="#ffffff" textAnchor="middle">
                    {isFinite(bmiRounded) ? bmiRounded : "--"}
                  </SvgText>
                </>
              );
            })()}
          </Svg>

          <Text style={styles.centerLabel}>{category ? category.label : "—"}</Text>
          <Text style={styles.subtle}>Estimated body fat ({sex}): {bfText}</Text>
        </View>

        {/* WHO legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Categories</Text>
          {cats.map((c, i) => (
            <View style={styles.legendRow} key={i}>
              <View style={[styles.dot, { backgroundColor: c.color }]} />
              <Text style={styles.legendText}>{c.label}</Text>
              <Text style={styles.legendRange}>
                {c.min === 0 ? "< 16.0" : c.max === Infinity ? "≥ 40" : `${c.min.toFixed(1)} – ${c.max.toFixed(1)}`}
              </Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={{ marginTop: 12, gap: 8 }}>
          <TouchableOpacity
            disabled={saving}
            onPress={onSave}
            style={{
              opacity: saving ? 0.6 : 1,
              backgroundColor: "#22c55e",
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#14532d",
            }}
          >
            <Text style={{ color: "#06210f", fontWeight: "800" }}>{saving ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDoNotSave}
            style={{
              backgroundColor: "#0f1016",
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#1f2530",
            }}
          >
            <Text style={{ color: "#e5e7eb", fontWeight: "800" }}>Do not save</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          * BMI is a screening tool and may not reflect body composition.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: "800", color: "#fff", alignSelf: "center", marginTop: 4 },
  gaugeCard: {
    backgroundColor: "#0f1016",
    borderWidth: 1,
    borderColor: "#1f2530",
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  centerLabel: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 4 },
  subtle: { color: "#9ca3af", fontSize: 12, marginTop: 4 },
  legend: { backgroundColor: "#0f1016", borderWidth: 1, borderColor: "#1f2530", borderRadius: 16, padding: 12 },
  legendTitle: { color: "#c8c8cc", fontWeight: "700", marginBottom: 8, alignSelf: "center" },
  legendRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  dot: { width: 10, height: 10, borderRadius: 6, marginRight: 10 },
  legendText: { flex: 1, color: "#e5e7eb" },
  legendRange: { color: "#9ca3af" },
  footerNote: { color: "#9ca3af", fontSize: 11, textAlign: "center", marginTop: 6 },
});
