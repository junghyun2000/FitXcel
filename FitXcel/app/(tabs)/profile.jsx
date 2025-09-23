import { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

function ProgressBar({ progress, color }) {
  return (
    <View style={styles.progressBackground}>
      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function ProfileScreen() {
  const [experience, setExperience] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelPoints, setLevelPoints] = useState(0);
  const [stats, setStats] = useState({
    strength: 10,
    stamina: 10,
    agility: 10,
  });
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Complete 10 push-ups', xp: 100, done: false },
    { id: 2, name: 'Run for 15 minutes', xp: 100, done: false },
    { id: 3, name: 'Stretch for 5 minutes', xp: 100, done: false },
    { id: 4, name: 'Complete 10 squats', xp: 100, done: false },
  ]);

  const XP_THRESHOLD = 100;

  // Avatar progression images
  const avatars = {
    1: require('../../assets/images/level1.png'),
    2: require('../../assets/images/level2.jpg'),
    3: require('../../assets/images/level3.png'),
    4: require('../../assets/images/level4.png'),
  };

  const currentAvatar =
    avatars[level] || avatars[Object.keys(avatars).length]; // if past max, use last avatar

  const handleCompleteTask = (taskId) => {
    setTasks(prev =>
      prev.map(task => (task.id === taskId ? { ...task, done: true } : task))
    );

    const completedTask = tasks.find(task => task.id === taskId);
    if (completedTask && !completedTask.done) {
      const newExp = experience + completedTask.xp;
      if (newExp >= XP_THRESHOLD) {
        setExperience(newExp - XP_THRESHOLD);
        setLevel(level + 1);
        setLevelPoints(lp => lp + 1);
      } else {
        setExperience(newExp);
      }
    }
  };

  const handleUpgrade = (stat) => {
    if (levelPoints > 0) {
      setStats(prev => ({ ...prev, [stat]: prev[stat] + 1 }));
      setLevelPoints(lp => lp - 1);
    }
  };

  const experienceProgress = (experience / XP_THRESHOLD) * 100;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Large Avatar */}
        <View style={styles.avatarContainer}>
          <Image source={currentAvatar} style={styles.avatar} />
          <ThemedText style={styles.avatarLevel}>Level {level}</ThemedText>
        </View>

        {/* Experience and Level */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.subtitle}>Experience</ThemedText>
          <ThemedText style={styles.info}>{experience}/{XP_THRESHOLD} XP</ThemedText>
          <ProgressBar progress={experienceProgress} color="#4FC3F7" />
          <ThemedText style={styles.info}>Level Points: {levelPoints}</ThemedText>
        </ThemedView>

        {/* Stats for the character */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.subtitle}>Character Stats</ThemedText>
          {Object.keys(stats).map((stat) => (
            <View key={stat} style={styles.statBlock}>
              <ThemedText style={styles.statLabel}>
                {stat.charAt(0).toUpperCase() + stat.slice(1)}: {stats[stat]}
              </ThemedText>
              <ProgressBar progress={(stats[stat] % 100)} color="#81C784" />
              <TouchableOpacity
                style={[styles.bigButton, levelPoints <= 0 && styles.buttonDisabled]}
                onPress={() => handleUpgrade(stat)}
                disabled={levelPoints <= 0}
              >
                <ThemedText style={styles.bigButtonText}>Upgrade +1</ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </ThemedView>

        {/* Workout tasks */}
        <ThemedView style={styles.card}>
          <ThemedText style={styles.subtitle}>Gym Tasks</ThemedText>
          {tasks.map(task => (
            <View key={task.id} style={styles.taskBlock}>
              <ThemedText style={styles.taskLabel}>{task.name}</ThemedText>
              <ProgressBar progress={task.done ? 100 : 0} color="#FFB74D" />
              <TouchableOpacity
                style={[styles.bigButton, task.done && styles.buttonDisabled]}
                onPress={() => handleCompleteTask(task.id)}
                disabled={task.done}
              >
                <ThemedText style={styles.bigButtonText}>
                  {task.done ? '✅ Completed' : `Complete (+${task.xp} XP)`}
                </ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#121212' },

  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: '100%', height: 250, resizeMode: 'contain', marginBottom: 8 },
  avatarLevel: { color: '#4FC3F7', fontSize: 18, fontWeight: 'bold' },

  subtitle: { color: '#4FC3F7', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  info: { color: '#E0E0E0', fontSize: 14, marginBottom: 6 },
  card: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, marginBottom: 20 },

  statBlock: { marginBottom: 20 },
  statLabel: { color: '#FFFFFF', marginBottom: 6, fontSize: 15 },

  taskBlock: { marginBottom: 20 },
  taskLabel: { color: '#FFFFFF', marginBottom: 6, fontSize: 15 },

  progressBackground: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: { height: '100%', borderRadius: 6 },

  bigButton: {
    backgroundColor: '#4FC3F7',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  bigButtonText: { color: '#121212', fontWeight: 'bold', fontSize: 16 },
  buttonDisabled: { backgroundColor: '#555' },
});