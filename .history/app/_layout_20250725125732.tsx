import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [fontTimeout, setFontTimeout] = useState(false);

  console.log('🎨 RootLayout - Fonts loaded:', loaded);

  // Add timeout for font loading to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!loaded) {
        console.log('⏰ Font loading timeout - proceeding without custom fonts');
        setFontTimeout(true);
      }
    }, 3000); // 3 second timeout for fonts

    return () => clearTimeout(timeout);
  }, [loaded]);

  if (!loaded && !fontTimeout) {
    // Async font loading only occurs in development.
    console.log('⏳ Waiting for fonts to load...');
    return null;
  }

  console.log('✅ RootLayout - Rendering app with loaded fonts:', loaded);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
