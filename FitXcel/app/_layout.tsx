// Main layout file for the app, handles navigation stack and authentication redirects

import { Stack, Redirect, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';

// Set of routes that do not require authentication
const AUTH_ROUTES = new Set(['LoginScreen', 'RegisterScreen']);

export default function RootLayout() {
  // State to track if async storage check is complete
  const [ready, setReady] = useState(false);
  // State to track if user is authenticated
  const [isAuthed, setIsAuthed] = useState(false);
  // Get current route path
  const pathname = usePathname();
  // Get current color scheme (dark/light)
  const colorScheme = useColorScheme();

  // On mount, check for authentication token
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthed(!!token);
      setReady(true);
    })();
  }, []);

  // Re-check authentication when route changes
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthed(!!token);
    })();
  }, [pathname]);

  // Wait until authentication check is complete
  if (!ready) return null;

  // Remove leading slash from pathname for comparison
  const currentRoute = (pathname ?? '').replace(/^\//, '');

  // Redirect unauthenticated users to LoginScreen
  if (!isAuthed && !AUTH_ROUTES.has(currentRoute)) {
    return <Redirect href="/LoginScreen" />;
  }
  // Redirect authenticated users away from auth screens to main app
  if (isAuthed && AUTH_ROUTES.has(currentRoute)) {
    return <Redirect href="/(tabs)" />;
  }

  // Render navigation stack and theme provider
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Main app tabs */}
        <Stack.Screen name="(tabs)" />
        {/* Saved meals screen with custom header */}
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
        {/* Not found screen */}
        <Stack.Screen name="+not-found" />
        {/* Authentication screens */}
        <Stack.Screen name="LoginScreen" />
        <Stack.Screen name="RegisterScreen" />
      </Stack>
    </ThemeProvider>
  );
}
