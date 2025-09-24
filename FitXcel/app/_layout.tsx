// app/_layout.tsx
import { Stack, Redirect, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_ROUTES = new Set(['/LoginScreen', '/RegisterScreen']);

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const pathname = usePathname();

  // 1) Initial auth check on mount
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthed(!!token);
      setReady(true);
    })();
  }, []);

  // 2) Re-check when path changes (after login/register)
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthed(!!token);
    })();
  }, [pathname]);

  if (!ready) return null;

  // 3) HARD REDIRECT GUARD (prevents wrong screen showing)
  // If NOT authed and you're not already on an auth route, force to Login
  if (!isAuthed && !AUTH_ROUTES.has(pathname)) {
    return <Redirect href="/LoginScreen" />;
  }
  // If authed but you're on an auth route, force to tabs
  if (isAuthed && AUTH_ROUTES.has(pathname)) {
    return <Redirect href="/(tabs)" />;
  }

  // 4) Render the appropriate stack
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isAuthed ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <>
          <Stack.Screen name="LoginScreen" />
          <Stack.Screen name="RegisterScreen" />
        </>
      )}
    </Stack>
  );
}
