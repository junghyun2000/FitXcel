// app/_layout.tsx
import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';

// make everything lowercase here to match our normalized pathname
const AUTH_ROUTES_LC = new Set([
  'loginscreen',
  'registerscreen',
  'forgotpassword',
  'resetpassword',
  'login',
  'register',
  'forgot-password',
  'reset-password',
]);

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const pathname = usePathname();                 // e.g. "/LoginScreen" or "/reset-password"
  const router = useRouter();
  const colorScheme = useColorScheme();
  const didRedirect = useRef(false);              // prevents loops within a single render cycle

  // initial auth check
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthed(!!token);
      setReady(true);
    })();
  }, []);

  // re-check auth on route change (optional)
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      setIsAuthed(!!token);
    })();
  }, [pathname]);

  // normalize current route for set membership
  const currentRoute =
    (pathname ?? '')
      .replace(/^\/|\/$/g, '')  // strip leading/trailing slash
      .toLowerCase();            // normalize

  const isAuthRoute = AUTH_ROUTES_LC.has(currentRoute);

  // perform redirects in an effect with guards (no <Redirect /> in render)
  useEffect(() => {
    if (!ready) return;

    // compute targets once
    const toLogin = '/LoginScreen';
    const toApp = '/(tabs)';

    // avoid duplicate redirects
    if (didRedirect.current) return;

    // current full path (pathname + query) for comparison
    const currentFull = typeof window !== 'undefined'
      ? pathname + window.location.search
      : pathname;

    if (!isAuthed && !isAuthRoute) {
      if (currentFull !== toLogin) {
        didRedirect.current = true;
        router.replace(toLogin);
      }
      return;
    }

    if (isAuthed && isAuthRoute) {
      if (currentFull !== toApp) {
        didRedirect.current = true;
        router.replace(toApp);
      }
      return;
    }
  }, [ready, isAuthed, isAuthRoute, pathname, router]);

  // render nothing until we know auth state (prevents flicker)
  if (!ready) return null;

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
        {/* Auth screens */}
        <Stack.Screen name="LoginScreen" />
        <Stack.Screen name="RegisterScreen" />
        <Stack.Screen name="ForgotPassword" />
        <Stack.Screen name="ResetPassword" />
      </Stack>
    </ThemeProvider>
  );
}
