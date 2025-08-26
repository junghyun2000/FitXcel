import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Profile</ThemedText>
      <ThemedView style={styles.infoContainer}>
        <ThemedText type="subtitle">User Information</ThemedText>
        <ThemedText>Name: John Doe</ThemedText>
        <ThemedText>Email: johndoe@example.com</ThemedText>
      </ThemedView>
      <ThemedView style={styles.settingsContainer}>
        <ThemedText type="subtitle">Settings</ThemedText>
        <ThemedText>Change Password</ThemedText>
        <ThemedText>Privacy Settings</ThemedText>
        <ThemedText>Logout</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  infoContainer: {
    marginBottom: 16,
  },
  settingsContainer: {
    marginTop: 16,
  },
});