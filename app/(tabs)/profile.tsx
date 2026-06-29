import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Switch, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { isLoggedIn, logout } from "../../src/utils/authUser";
import { useTheme } from "../../src/utils/theme";
import { useFocusEffect } from "expo-router";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Reload user data every time this tab is focused so commentName changes are reflected
  useFocusEffect(
    useCallback(() => {
      isLoggedIn().then(setLoggedIn);
      SecureStore.getItemAsync("user").then((u) => {
        if (u) setUser(JSON.parse(u));
      });
    }, [])
  );

  async function handleLogout() {
    Alert.alert(t("logout"), "Are you sure you want to log out?", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: async () => {
          await logout();
          setLoggedIn(false);
          setUser(null);
        },
      },
    ]);
  }

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginLeft: 4 }}>
      {title}
    </Text>
  );

  const Card = ({ children }: { children: React.ReactNode }) => (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 20 }}>
      {children}
    </View>
  );

  const Row = ({
    icon,
    iconColor = colors.textSecondary,
    label,
    value,
    onPress,
    right,
    danger = false,
    last = false,
  }: any) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border + "80",
        backgroundColor: danger ? "#ef44440d" : "transparent",
      }}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: danger ? "#ef444426" : colors.surface2, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        <Ionicons name={icon} size={17} color={danger ? "#ef4444" : iconColor} />
      </View>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: "500", color: danger ? "#ef4444" : colors.textPrimary }}>{label}</Text>
      {value && <Text style={{ fontSize: 12, color: colors.textSecondary, marginRight: 6 }}>{value}</Text>}
      {right !== undefined ? right : onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} /> : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.textPrimary, marginBottom: 20 }}>{t("profile")}</Text>

        {/* Avatar */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 28, backgroundColor: "#7c3aed26", borderWidth: 2, borderColor: "#7c3aed66", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <Ionicons name="person" size={36} color="#a855f7" />
          </View>
          {loggedIn && user ? (
            <>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textPrimary }}>{user.commentName || user.name || "User"}</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>{user.email}</Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textPrimary }}>Guest</Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={{ fontSize: 13, color: "#a855f7", marginTop: 4 }}>Sign in for full access →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Appearance */}
        <SectionTitle title="Appearance" />
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Ionicons name={isDark ? "moon" : "sunny"} size={17} color={isDark ? "#a855f7" : "#f59e0b"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary }}>{isDark ? "Dark Mode" : "Light Mode"}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Toggle app appearance</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: "#7c3aed" }}
              thumbColor={isDark ? "#a855f7" : "#f5f3ff"}
            />
          </View>
        </Card>

        {/* Language */}
        <SectionTitle title={t("language")} />
        <Card>
          <Row
            icon="language-outline"
            label="English"
            value="More coming soon"
            last
          />
        </Card>

        {/* Account */}
        <SectionTitle title="Account" />
        <Card>
          {loggedIn ? (
            <>
              <Row icon="list-outline" label={t("myPolls")} onPress={() => router.push("/(tabs)/my-polls")} />
              <Row icon="add-circle-outline" label={t("createPoll")} onPress={() => router.push("/create" as any)} />
              <Row icon="log-out-outline" label={t("logout")} onPress={handleLogout} danger last />
            </>
          ) : (
            <Row icon="log-in-outline" label={t("signIn")} onPress={() => router.push("/(auth)/login")} last />
          )}
        </Card>

        {/* App links */}
        <SectionTitle title="App" />
        <Card>
          <Row icon="information-circle-outline" label="About Us" onPress={() => router.push("/about" as any)} />
          <Row icon="document-text-outline" label="Privacy Policy" onPress={() => router.push("/privacy" as any)} />
          <Row icon="shield-checkmark-outline" label="Terms of Service" onPress={() => router.push("/terms" as any)} />
          <Row icon="chatbubble-ellipses-outline" label="Send Feedback" onPress={() => router.push("/feedback" as any)} />
          <Row icon="heart-outline" label="Donate" iconColor="#ef4444" onPress={() => router.push("/(tabs)/donate")} last value="Support us ❤️" />
        </Card>

        {/* Version */}
        <Text style={{ textAlign: "center", fontSize: 11, color: colors.textSecondary, marginTop: 8 }}>
          trendingPolls v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
