import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiFetch } from "../../src/utils/api";
import { useTheme } from "../../src/utils/theme";

type Step = "email" | "otp" | "newPassword" | "success";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<TextInput>(null);

  const fieldBox = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  };

  const inputStyle = { flex: 1, paddingVertical: 14, color: colors.textPrimary, fontSize: 14 };

  async function handleSendReset() {
    if (!email) return Alert.alert("Error", "Please enter your email.");
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reset OTP");
      setStep("otp");
      setTimeout(() => otpRef.current?.focus(), 300);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) return Alert.alert("Error", "Please enter the 6-digit OTP.");
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/verify-reset-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");
      setResetToken(data.resetToken || "");
      setStep("newPassword");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword() {
    if (!newPassword || newPassword.length < 8) return Alert.alert("Error", "Password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return Alert.alert("Error", "Passwords do not match.");
    setLoading(true);
    try {
      const body: any = resetToken
        ? { resetToken, password: newPassword }
        : { email, otp, password: newPassword };
      const res = await apiFetch("/api/auth/update-password", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update password");
      setStep("success");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  const StepDot = ({ active, done }: { active: boolean; done: boolean }) => (
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: done || active ? "#7c3aed" : colors.border }} />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Back button */}
          {step !== "success" && (
            <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 24 }}>
              <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>Back to Sign In</Text>
            </TouchableOpacity>
          )}

          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 26, fontWeight: "800", color: colors.textPrimary }}>Reset Password</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6 }}>
              {step === "email" && "Enter your email and we'll send a verification code."}
              {step === "otp" && `Enter the 6-digit code sent to ${email}`}
              {step === "newPassword" && "Create a new secure password for your account."}
              {step === "success" && "Your password has been reset successfully!"}
            </Text>

            {/* Step indicators */}
            {step !== "success" && (
              <View style={{ flexDirection: "row", gap: 6, marginTop: 16, alignItems: "center" }}>
                <StepDot active={step === "email"} done={step !== "email"} />
                <View style={{ width: 24, height: 1, backgroundColor: step !== "email" ? "#7c3aed" : colors.border }} />
                <StepDot active={step === "otp"} done={step === "newPassword"} />
                <View style={{ width: 24, height: 1, backgroundColor: step === "newPassword" ? "#7c3aed" : colors.border }} />
                <StepDot active={step === "newPassword"} done={false} />
              </View>
            )}
          </View>

          {/* ── Step: Email ── */}
          {step === "email" && (
            <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 }}>Email Address</Text>
                <View style={fieldBox}>
                  <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                  <TextInput
                    style={inputStyle}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />
                </View>
              </View>
              <TouchableOpacity onPress={handleSendReset} disabled={loading} style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingVertical: 14, alignItems: "center", opacity: loading ? 0.7 : 1 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Send Reset Code</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step: OTP ── */}
          {step === "otp" && (
            <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
              <View style={{ alignItems: "center" }}>
                <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "#7c3aed26", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Ionicons name="mail-open-outline" size={26} color="#a855f7" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.textPrimary }}>Check your inbox</Text>
              </View>

              {/* 6-box OTP */}
              <TouchableOpacity activeOpacity={1} onPress={() => otpRef.current?.focus()}>
                <View style={{ flexDirection: "row", gap: 10, justifyContent: "center", marginVertical: 4 }}>
                  {Array.from({ length: 6 }).map((_, i) => {
                    const filled = i < otp.length;
                    const active = i === otp.length;
                    return (
                      <View
                        key={i}
                        style={{
                          width: 44,
                          height: 54,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: active ? "#a855f7" : filled ? "#7c3aed" : colors.border,
                          backgroundColor: active ? "#a855f714" : colors.inputBg,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontSize: 22, fontWeight: "700", color: colors.textPrimary }}>{otp[i] || ""}</Text>
                      </View>
                    );
                  })}
                </View>
                <TextInput
                  ref={otpRef}
                  style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, "").slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleVerifyOtp} disabled={loading || otp.length !== 6} style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingVertical: 14, alignItems: "center", opacity: loading || otp.length !== 6 ? 0.6 : 1 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Verify Code</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSendReset} disabled={loading} style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Didn't receive it?{" "}<Text style={{ color: "#a855f7", fontWeight: "600" }}>Resend</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step: New Password ── */}
          {step === "newPassword" && (
            <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 }}>New Password</Text>
                <View style={fieldBox}>
                  <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
                  <TextInput style={inputStyle} placeholder="Min. 8 characters" placeholderTextColor={colors.textSecondary} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showPass} autoFocus />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 }}>Confirm Password</Text>
                <View style={fieldBox}>
                  <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
                  <TextInput style={inputStyle} placeholder="Repeat password" placeholderTextColor={colors.textSecondary} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                    <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity onPress={handleUpdatePassword} disabled={loading} style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingVertical: 14, alignItems: "center", opacity: loading ? 0.7 : 1 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Reset Password</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step: Success ── */}
          {step === "success" && (
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <View style={{ width: 80, height: 80, borderRadius: 28, backgroundColor: "#10b98126", borderWidth: 2, borderColor: "#10b98166", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Ionicons name="checkmark-circle" size={44} color="#10b981" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary, textAlign: "center" }}>Password Reset!</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 10, lineHeight: 22 }}>
                Your password has been updated successfully. Sign in with your new password.
              </Text>
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingHorizontal: 36, paddingVertical: 14, marginTop: 32 }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Sign In Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
