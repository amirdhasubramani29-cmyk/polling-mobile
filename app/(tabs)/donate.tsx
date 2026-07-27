import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Linking, Modal, Clipboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/utils/theme";
import BrandName from "../../src/components/BrandName";
import QRCode from "react-native-qrcode-svg";

const UPI_ID = "samirdha@ptaxis";
const UPI_URL = `upi://pay?pa=${UPI_ID}&pn=trendingPolls&cu=INR`;

export default function DonateScreen() {
  const { colors, isDark } = useTheme();
  const [noAppModal, setNoAppModal] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleOpenUPI() {
    try {
      const canOpen = await Linking.canOpenURL(UPI_URL);
      if (canOpen) {
        await Linking.openURL(UPI_URL);
      } else {
        setNoAppModal(true);
      }
    } catch {
      setNoAppModal(true);
    }
  }

  function handleCopyUpiId() {
    Clipboard.setString(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>

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

            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={{ fontSize: 26, fontWeight: "800", color: colors.textPrimary, marginRight: 4 }}>
                Support{" "}
              </Text>
              <BrandName
                className="text-3xl font-extrabold text-text-primary"
                style={{ transform: [{ translateY: 0 }] }}
              />
            </View>

            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 }}>
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
            <View
              key={s.label}
              style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border }}
            >
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
            <QRCode value={UPI_URL} size={200} />
          </View>

          <TouchableOpacity
            onPress={handleOpenUPI}
            activeOpacity={0.8}
            style={{
              marginTop: 18,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: "#7c3aed",
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 28,
              shadowColor: "#7c3aed",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff", letterSpacing: 0.3 }}>
              Open UPI App
            </Text>
          </TouchableOpacity>
        </View>

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

      {/* ── No UPI App Found Modal ── */}
      <Modal
        visible={noAppModal}
        transparent
        animationType="slide"
        onRequestClose={() => setNoAppModal(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#00000080" }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 24,
              paddingBottom: 36,
              gap: 16,
            }}
          >
            {/* Drag handle */}
            <View style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: colors.border, alignSelf: "center" }} />

            {/* Icon + title */}
            <View style={{ alignItems: "center", gap: 10 }}>
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: "#f59e0b1a", borderWidth: 1, borderColor: "#f59e0b33", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="warning-outline" size={28} color="#f59e0b" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textPrimary }}>No UPI App Found</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 20 }}>
                We couldn't find a UPI-compatible payment app (GPay, PhonePe, Paytm, etc.) on this device. You can still donate using one of the options below.
              </Text>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: colors.border }} />

            {/* Option 1 — Copy UPI ID */}
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Option 1 — Copy UPI ID
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{ flex: 1, backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12 }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary }}>{UPI_ID}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleCopyUpiId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: copied ? "#10b9811a" : "#7c3aed1a",
                    borderWidth: 1,
                    borderColor: copied ? "#10b98133" : "#7c3aed33",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color={copied ? "#10b981" : "#a855f7"} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: copied ? "#10b981" : "#a855f7" }}>
                    {copied ? "Copied!" : "Copy"}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                Open any UPI app manually, tap "Pay by UPI ID", and paste the ID above.
              </Text>
            </View>

            {/* Option 2 — Scan QR */}
            <View style={{ gap: 6, backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="qr-code-outline" size={16} color="#a855f7" />
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Option 2 — Scan the QR Code
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                Use another phone that has GPay, PhonePe, or Paytm installed to scan the QR code shown on the donate screen.
              </Text>
            </View>

            {/* Close */}
            <TouchableOpacity
              onPress={() => setNoAppModal(false)}
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: "700", fontSize: 14 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
