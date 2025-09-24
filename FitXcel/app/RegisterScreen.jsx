import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const router = useRouter();

const handleRegister = async () => {
const res = await fetch('http://localhost:4000/auth/register', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email, password }),
});
if (res.ok) {
router.replace('/LoginScreen');
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
<Button title="Register" onPress={handleRegister} />
<Button title="Go to Login" onPress={() => router.push('/LoginScreen')} />
</View>
);
}

const styles = StyleSheet.create({
container: { flex: 1, justifyContent: 'center', padding: 20 },
input: { borderWidth: 1, marginBottom: 10, padding: 8 },
});
