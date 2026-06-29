import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/utils/theme";
import { apiFetch } from "../src/utils/api";

type FeedbackType = "general" | "bug" | "feature" | "other";

const TYPES: { id: FeedbackType; label: string; icon: string; color: string }[] = [
  { id: "general", label: "General", icon: "chatbubble-outline", color: "#7c3aed" },
  { id: "bug", label: "Bug Report", icon: "bug-outline", color: "#ef4444" },
  { id: "feature", label: "Feature Request", icon: "bulb-outline", color: "#f59e0b" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal-circle-outline", color: "#0ea5e9" },
];

export default function FeedbackScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<FeedbackType>("general");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const fieldBox = {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
  };

  const inputStyle = { paddingVertical: 13, color: colors.textPrimary, fontSize: 14 };

  async function handleSubmit() {
    if (!name.trim()) return Alert.alert("Missing field", "Please enter your name.");
    if (!email.trim()) return Alert.alert("Missing field", "Please enter your email.");
    if (!message.trim() || message.trim().length < 10)
      return Alert.alert("Missing field", "Please enter a message (at least 10 characters).");

    setLoading(true);
    try {
      const res = await apiFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim(), type }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to send feedback");
      }
      setSent(true);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not send feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <View style={{ width: 80, height: 80, borderRadius: 28, backgroundColor: "#10b98126", borderWidth: 2, borderColor: "#10b98166", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Ionicons name="checkmark-circle" size={44} color="#10b981" />
        </View>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary, textAlign: "center" }}>Thank you!</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 10, lineHeight: 22 }}>
          Your feedback has been received. We read every submission and truly appreciate your input.
        </Text>
        <TouchableOpacity
          onPress={() => { setSent(false); setName(""); setEmail(""); setMessage(""); setType("general"); }}
          style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginTop: 28 }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Send Another</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Intro */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 24 }}>
            <Ionicons name="sparkles" size={20} color="#a855f7" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>We'd love to hear from you</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 19 }}>
                Share bugs, suggestions, or anything on your mind. Your feedback shapes trendingPolls.
              </Text>
            </View>
          </View>

          {/* Feedback type */}
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Type</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setType(t.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: type === t.id ? t.color : colors.border,
                  backgroundColor: type === t.id ? t.color + "1a" : colors.surface,
                }}
                activeOpacity={0.7}
              >
                <Ionicons name={t.icon as any} size={14} color={type === t.id ? t.color : colors.textSecondary} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: type === t.id ? t.color : colors.textSecondary }}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Name */}
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Your Name</Text>
          <View style={{ ...fieldBox, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <TextInput
              style={{ ...inputStyle, flex: 1 }}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Email Address</Text>
          <View style={{ ...fieldBox, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
            <TextInput
              style={{ ...inputStyle, flex: 1 }}
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Message */}
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Message</Text>
          <View style={{ ...fieldBox, marginBottom: 24 }}>
            <TextInput
              style={{ ...inputStyle, height: 130, textAlignVertical: "top" }}
              placeholder="Tell us what's on your mind..."
              placeholderTextColor={colors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
            />
          </View>

          {/* Character count */}
          <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: "right", marginTop: -20, marginBottom: 20, marginRight: 4 }}>
            {message.length} chars
          </Text>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingVertical: 15, alignItems: "center", opacity: loading ? 0.7 : 1, flexDirection: "row", justifyContent: "center", gap: 8 }}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Send Feedback</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}