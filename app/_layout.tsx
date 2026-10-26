import { AmiriQuran_400Regular } from '@expo-google-fonts/amiri-quran';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { HadithPlayerProvider } from '@/lib/hadithPlayer';
import { NotificationScheduler } from '@/lib/notifications';
import { SettingsProvider, useSettings } from '@/lib/settings';
import { WidgetSync } from '@/widgets/sync';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: '#0D1640' } };

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    AmiriQuran_400Regular,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  return (
    <SettingsProvider>
      <HadithPlayerProvider>
        <Root fontsLoaded={loaded} />
      </HadithPlayerProvider>
    </SettingsProvider>
  );
}

function Root({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready } = useSettings();

  useEffect(() => {
    if (fontsLoaded && ready) SplashScreen.hideAsync();
  }, [fontsLoaded, ready]);

  if (!fontsLoaded || !ready) return null;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <NotificationScheduler />
      <WidgetSync />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="city" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
