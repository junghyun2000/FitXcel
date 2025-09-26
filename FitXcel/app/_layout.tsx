// app/_layout.tsx
import { Stack, Redirect, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';

const AUTH_ROUTES = new Set(['LoginScreen', 'RegisterScreen']);

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const pathname = usePathname();
  const colorScheme = useColorScheme();

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthed(!!token);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthed(!!token);
    })();
  }, [pathname]);

  if (!ready) return null;

  const currentRoute = (pathname ?? '').replace(/^\//, '');

  // Hard guard: decide BEFORE rendering <Stack>
  if (!isAuthed && !AUTH_ROUTES.has(currentRoute)) {
    return <Redirect href="/LoginScreen" />;
  }
  if (isAuthed && AUTH_ROUTES.has(currentRoute)) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="saved-meals"
          options={{
            headerShown: true,
            title: 'Saved Meals',
            headerBackTitle: 'Calorie page',
            headerTintColor: '#fff',
            headerStyle: { backgroundColor: '#0B1220' },
          }}
        />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="LoginScreen" />
        <Stack.Screen name="RegisterScreen" />
      </Stack>
    </ThemeProvider>
  );
}
