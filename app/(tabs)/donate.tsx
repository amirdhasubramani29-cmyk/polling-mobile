import { View, Text, TouchableOpacity, Image, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/utils/theme";
import BrandName from "../../src/components/BrandName";
import QRCode from "react-native-qrcode-svg";

const DONATION_METHODS = [
  {
    id: "upi",
    icon: "qr-code-outline" as const,
    label: "UPI / QR Code",
    sub: "Scan and pay instantly",
    color: "#7c3aed",
    bg: "#7c3aed1a",
    border: "#7c3aed33",
  },
  {
    id: "paypal",
    icon: "globe-outline" as const,
    label: "PayPal",
    sub: "pay.trendingpolls.com",
    color: "#0ea5e9",
    bg: "#0ea5e91a",
    border: "#0ea5e933",
    url: "https://paypal.me/trendingpolls",
  },
  {
    id: "crypto",
    icon: "hardware-chip-outline" as const,
    label: "Crypto",
    sub: "Bitcoin & Ethereum accepted",
    color: "#f59e0b",
    bg: "#f59e0b1a",
    border: "#f59e0b33",
  },
];

export default function DonateScreen() {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                backgroundColor: "#ef44441a",
                borderWidth: 2,
                borderColor: "#ef444440",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Ionicons name="heart" size={36} color="#ef4444" />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
              }}
            >
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "800",
                  color: colors.textPrimary,
                  marginRight: 4,
                }}
              >
                Support{" "}
              </Text>

              <BrandName
                className="text-3xl font-extrabold text-text-primary"
                style={{
                  transform: [{ translateY: 0 }],
                }}
              />
            </View>

            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: 8,
                lineHeight: 22,
              }}
            >
              Support the platform and help keep it free, independent, and ad-free.
            </Text>
          </View>
        </View>

        {/* Impact stats */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 28 }}>
          {[
            { icon: "server-outline", label: "Server Costs", value: "2k/mo" },
            { icon: "people-outline", label: "Users Served", value: "1K+" },
            { icon: "lock-closed-outline", label: "Always Free", value: "Forever" },
          ].map((s) => (
            <View key={s.label} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
              <Ionicons name={s.icon as any} size={20} color="#a855f7" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginTop: 6 }}>{s.value}</Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: "center" }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* QR Code section */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 }}>Scan to Donate via UPI</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>Works with GPay, PhonePe, Paytm & all UPI apps</Text>

          <View style={{ padding: 12, backgroundColor: "#fff", borderRadius: 16, borderWidth: 3, borderColor: "#7c3aed40" }}>
            <View>
              <QRCode
                value="upi://pay?pa=yourupi@oksbi&pn=trendingPolls"
                size={200}
              />
            </View>
          </View>

        </View>

        {/* Other donation methods */}
        {/*<Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Other Ways to Give</Text>
        <View style={{ gap: 10, marginBottom: 28 }}>
          {DONATION_METHODS.filter((m) => m.id !== "upi").map((method) => (
            <TouchableOpacity
              key={method.id}
              onPress={() => method.url && Linking.openURL(method.url)}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 14 }}
              activeOpacity={0.7}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: method.bg, borderWidth: 1, borderColor: method.border, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={method.icon} size={22} color={method.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textPrimary }}>{method.label}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{method.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>*/}

        {/* Thank you note */}
        <View style={{ backgroundColor: isDark ? "#7c3aed14" : "#ede9fe", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#7c3aed30", flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
          <Ionicons name="heart-circle-outline" size={28} color="#a855f7" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>Thank you! 🙏</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 20 }}>
              Every rupee helps us serve more users, improve features, and keep the platform free for everyone.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
