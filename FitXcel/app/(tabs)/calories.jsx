import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';


// Circular gauge for calories (goal vs current)
function CalorieGauge({ current, goal }) {
  const pct = Math.max(0, Math.min(1, goal > 0 ? current / goal : 0));
  const size = 240; // px
  const stroke = 18; // px
  const r = (size - stroke) / 2; // radius
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct);
  const remaining = Math.max(0, goal - current);
  const pctLabel = Math.round(pct * 100);

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={`Calories: ${current} of ${goal}. ${remaining} remaining. ${pctLabel}% of goal.`}
    >
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#E5E7EB"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="#22C55E"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          fill="none"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>


      {/* Center labels */}
      <View style={styles.centerLabels} pointerEvents="none">
        <Text style={styles.title}>Calories</Text>
        <Text style={styles.current}>{current}</Text>
        <Text style={styles.goal}>of {goal} kcal</Text>
        <Text style={styles.remaining}>{remaining} left</Text>
      </View>
    </View>
  );
}

export default function CaloriePage() {
// TODO: Wire these to your store/API; kept static for the initial visual
  const goal = 2200;
  const current = 1460;


  return (
    <View style={styles.container}>
      <CalorieGauge current={current} goal={goal} />


      {/* Simple meal-type summary placeholder (optional, can remove) */}
      <View style={styles.row}>
        <Badge label="Breakfast" value={420} />
        <Badge label="Lunch" value={680} />
        <Badge label="Dinner" value={260} />
        <Badge label="Snacks" value={100} />
      </View>


      <Text style={styles.helper}>Only the gauge for now.</Text>
      <Text style={styles.helperSmall}>Need to wire to API later(?)</Text>
    </View>
  );
}

function Badge({ label, value }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeLabel}>{label}</Text>
      <Text style={styles.badgeValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  centerLabels: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#93C5FD',
    fontSize: 16,
    marginBottom: 2,
  },
  current: {
    color: 'white',
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 46,
  },
  goal: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  remaining: {
    color: '#22C55E',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#111827',
    borderColor: '#1F2937',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
  },
  badgeLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  badgeValue: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
  },
  helper: {
    color: '#CBD5E1',
    marginTop: 12,
  },
  helperSmall: {
    color: '#94A3B8',
    fontSize: 12,
  },
});