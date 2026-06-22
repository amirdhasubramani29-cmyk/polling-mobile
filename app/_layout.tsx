import "../global.css";
import "../src/i18n";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { useEffect } from "react";
import { getGuestId } from "../src/utils/guestUser";
import { ThemeProvider, useTheme } from "../src/utils/theme";

function ThemedRoot() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={colors.statusBar} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="poll/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerTitle: "Poll",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="regional/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerTitle: "Regional Poll",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="privacy"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerTitle: "Privacy Policy",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="terms"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerTitle: "Terms of Service",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerTitle: "About Us",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="feedback"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerTitle: "Send Feedback",
            headerBackTitle: "Back",
          }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    getGuestId();
  }, []);
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemedRoot />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
