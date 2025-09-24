import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const router = useRouter();

const handleLogin = async () => {
const res = await fetch('http://localhost:4000/auth/login', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email, password }),
});
if (res.ok) {
const data = await res.json();
await AsyncStorage.setItem('token', data.token);
router.replace('/');
}
};

return (
<View style={styles.container}>
<Text>Email</Text>
<TextInput style={styles.input} value={email} onChangeText={setEmail} />
<Text>Password</Text>
<TextInput
style={styles.input}
secureTextEntry
value={password}
onChangeText={setPassword}
/>
<Button title="Login" onPress={handleLogin} />
<Button title="Go to Register" onPress={() => router.push('/RegisterScreen')} />
</View>
);
}

const styles = StyleSheet.create({
container: { flex: 1, justifyContent: 'center', padding: 20 },
input: { borderWidth: 1, marginBottom: 10, padding: 8 },
});