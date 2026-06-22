import { Stack } from "expo-router";
import { useTheme } from "../../src/utils/theme";

export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: true,
          headerTitle: "Reset Password",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerBackTitle: "Back",
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
