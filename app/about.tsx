import { ScrollView, Text, View, Linking, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/utils/theme";
import BrandName from "../src/components/BrandName";

const FEATURES = [
  { icon: "flame-outline", label: "Real-time Trending Polls", color: "#a855f7" },
  { icon: "location-outline", label: "Regional Polls by Location", color: "#0ea5e9" },
  { icon: "shield-checkmark-outline", label: "Privacy-first, No Ads", color: "#10b981" },
  { icon: "phone-portrait-outline", label: "Native Mobile Experience", color: "#f59e0b" },
  { icon: "people-outline", label: "Community-driven Voting", color: "#ef4444" },
  { icon: "globe-outline", label: "Multi-language Support", color: "#6366f1" },
];

const TEAM = [
  //{ name: "Amirdha Subramani", role: "Founder & Lead Developer", icon: "code-slash-outline" },
  { name: "Open Source", role: "Built on React Native & Expo", icon: "heart-outline" },
];

export default function AboutScreen() {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 26,
              backgroundColor: "#7c3aed26",
              borderWidth: 2,
              borderColor: "#7c3aed66",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              overflow: "hidden",
            }}
          >
            <Image
              source={require("../assets/logo.png")}
              style={{
                width: 82,
                height: 82,
              }}
              resizeMode="contain"
            />
          </View>
          <BrandName className="text-3xl font-extrabold text-text-primary" />
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: "center" }}>
            Your voice, amplified
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, backgroundColor: "#7c3aed1a", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: "#7c3aed33" }}>
            <Ionicons name="rocket-outline" size={13} color="#a855f7" />
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#a855f7" }}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Mission */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Our Mission</Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}>
            trendingPolls was built to give everyone a platform to share their opinions and discover what others think — without the noise of social media. We believe every voice deserves to be heard, and data should be transparent.
          </Text>
        </View>

        {/* Features */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>What We Offer</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
          {FEATURES.map((f) => (
            <View
              key={f.label}
              style={{
                width: "47%",
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 8,
              }}
            >
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: f.color + "26", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={f.icon as any} size={18} color={f.color} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textPrimary, lineHeight: 17 }}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Team */}
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>The Team</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 24 }}>
          {TEAM.map((member, i) => (
            <View
              key={member.name}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                gap: 14,
                borderBottomWidth: i < TEAM.length - 1 ? 1 : 0,
                borderBottomColor: colors.border + "80",
              }}
            >
              <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "#7c3aed26", borderWidth: 1, borderColor: "#7c3aed40", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={member.icon as any} size={20} color="#a855f7" />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>{member.name}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{member.role}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Open Source note */}
        <View style={{
          backgroundColor: isDark ? "#10b98114" : "#d1fae5",
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: "#10b98130",
          flexDirection: "row",
          gap: 12,
          alignItems: "flex-start",
          marginBottom: 24,
        }}>
          <Ionicons name="code-slash-outline" size={22} color="#10b981" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>Open at Heart</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 20 }}>
              trendingPolls is built with React Native, Expo, and Node.js. We believe in transparent development and community collaboration.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={{ textAlign: "center", fontSize: 12, color: colors.textSecondary }}>
          Made with ❤️ in India · © 2026 trendingPolls
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}