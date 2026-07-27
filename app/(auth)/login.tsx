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
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { apiFetch } from "../../src/utils/api";
import { useTheme } from "../../src/utils/theme";
import BrandName from "../../src/components/BrandName";

type Mode = "signin" | "signup" | "otp";

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const otpRef = useRef<TextInput>(null);

  const EMAIL_REGEX =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  const inputStyle = {
    flex: 1,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 14,
  };

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

  async function handleSignIn() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail)
      return Alert.alert("Error", "Please enter your email address.");
    if (!EMAIL_REGEX.test(trimmedEmail))
      return Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );
    if (!password)
      return Alert.alert("Error", "Please enter your password.");
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Authentication failed");
      await SecureStore.setItemAsync("token", data.token);
      await SecureStore.setItemAsync("userId", String(data.user?.id || data.userId || ""));
      await SecureStore.setItemAsync("user", JSON.stringify(data.user || {}));
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    const trimmedEmail = email.trim();

    if (!name || !trimmedEmail || !password)
      return Alert.alert("Error", "Please fill in all fields.");

    if (!EMAIL_REGEX.test(trimmedEmail))
      return Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );

    if (password !== confirmPassword)
      return Alert.alert("Error", "Passwords do not match.");

    if (password.length < 8)
      return Alert.alert("Password", "Password must be at least 8 characters long.");

    if (!/[A-Z]/.test(password))
      return Alert.alert("Password", "Password must contain at least one uppercase letter.");

    if (!/[a-z]/.test(password))
      return Alert.alert("Password", "Password must contain at least one lowercase letter.");

    if (!/[0-9]/.test(password))
      return Alert.alert("Password", "Password must contain at least one number.");

    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password))
      return Alert.alert("Password", "Password must contain at least one special character.");

    if (!agreedToTerms)
      return Alert.alert("Error", "Please agree to the Terms and Privacy Policy.");

    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/register/send-otp", {
        method: "POST",
        body: JSON.stringify({ name, email, password, lang: "en" }),
      });
      const data = await res.json();
      if (!res.ok) {
        let message = "Failed to send OTP.";

        switch (data.code) {
          case "EMAIL_REQUIRED":
            message = "Please enter your email address.";
            break;

          case "EMAIL_EXISTS":
            message = "An account with this email already exists.";
            break;

          case "OTP_FAIL":
            message = "Unable to send OTP. Please try again later.";
            break;

          default:
            message = data.message || "Something went wrong.";
        }
        throw new Error(message);
      }
      setMode("otp");
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
      const res = await apiFetch("/api/auth/register/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp, name, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");
      if (data.token) {
        await SecureStore.setItemAsync("token", data.token);
        await SecureStore.setItemAsync("userId", String(data.user?.id || data.userId || ""));
        await SecureStore.setItemAsync("user", JSON.stringify(data.user || {}));
        router.replace("/(tabs)");
      } else {
        // OTP verified, now sign in
        Alert.alert("Success", "Account created! Please sign in.", [
          { text: "OK", onPress: () => { setMode("signin"); setPassword(""); setOtp(""); } },
        ]);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m: "signin" | "signup") {
    setMode(m);
    setOtp("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: 36 }}>
           <View
             style={{
               width: 68,
               height: 68,
               borderRadius: 22,
               backgroundColor: "#7c3aed26",
               alignItems: "center",
               justifyContent: "center",
               marginBottom: 14,
               borderWidth: 1.5,
               borderColor: "#7c3aed66",
               overflow: "hidden",
             }}
           >
             <Image
               source={require("../../assets/logo.png")}
               style={{
                 width: 82,
                 height: 82,
               }}
               resizeMode="contain"
             />
           </View>
            <BrandName
                            className="text-3xl font-extrabold text-text-primary"
                            style={{
                              transform: [{ translateY: 0 }],
                            }}
                          />
             <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>Your voice, amplified</Text>
          </View>

          {/* Tab toggle — only shown in signin/signup */}
          {mode !== "otp" && (
            <View style={{ flexDirection: "row", backgroundColor: colors.surface, borderRadius: 16, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
              {(["signin", "signup"] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => switchMode(m)}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", backgroundColor: mode === m ? "#7c3aed" : "transparent" }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: mode === m ? "#fff" : colors.textSecondary }}>
                    {m === "signin" ? t("signIn") : t("signUp")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Form card */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 14 }}>

            {/* ── OTP mode ── */}
            {mode === "otp" && (
              <>
                <View style={{ alignItems: "center", marginBottom: 4 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "#7c3aed26", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <Ionicons name="mail-open-outline" size={26} color="#a855f7" />
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textPrimary }}>Check your email</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", marginTop: 6 }}>
                    We sent a 6-digit code to{"\n"}<Text style={{ color: "#a855f7", fontWeight: "600" }}>{email}</Text>
                  </Text>
                </View>

                {/* 6-box OTP display */}
                <TouchableOpacity activeOpacity={1} onPress={() => otpRef.current?.focus()}>
                  <View style={{ flexDirection: "row", gap: 8, marginVertical: 8 }}>
                    {Array.from({ length: 6 }).map((_, i) => {
                      const filled = i < otp.length;
                      const active = i === otp.length;
                      return (
                        <View
                          key={i}
                          style={{
                            flex: 1,
                            aspectRatio: 0.8,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: active ? "#a855f7" : filled ? "#7c3aed" : colors.border,
                            backgroundColor: active ? "#a855f714" : colors.inputBg,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.textPrimary }}>
                            {otp[i] || ""}
                          </Text>
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

                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingVertical: 14, alignItems: "center", opacity: loading || otp.length !== 6 ? 0.6 : 1 }}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Verify OTP</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => switchMode("signup")} style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    Wrong email?{" "}<Text style={{ color: "#a855f7", fontWeight: "600" }}>Go back</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── Sign In ── */}
            {mode === "signin" && (
              <>
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 }}>{t("email")}</Text>
                  <View style={fieldBox}>
                    <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                    <TextInput style={inputStyle} placeholder="you@example.com" placeholderTextColor={colors.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                  </View>
                </View>

                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 }}>{t("password")}</Text>
                    <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
                      <Text style={{ fontSize: 12, color: "#a855f7", fontWeight: "600" }}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={fieldBox}>
                    <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
                    <TextInput style={inputStyle} placeholder="••••••••" maxLength={128} placeholderTextColor={colors.textSecondary} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity onPress={handleSignIn} disabled={loading} style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{t("signIn")}</Text>}
                </TouchableOpacity>
              </>
            )}

            {/* ── Sign Up ── */}
            {mode === "signup" && (
              <>
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 }}>{t("name")}</Text>
                  <View style={fieldBox}>
                    <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                    <TextInput style={inputStyle} placeholder="Enter your name" maxLength={100} placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} autoCapitalize="words" />
                  </View>
                </View>

                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 }}>{t("email")}</Text>
                  <View style={fieldBox}>
                    <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                    <TextInput style={inputStyle} placeholder="you@example.com" maxLength={254} placeholderTextColor={colors.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                  </View>
                </View>

                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 }}>{t("password")}</Text>
                  <View style={fieldBox}>
                    <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
                    <TextInput style={inputStyle} placeholder="Min. 8 characters" placeholderTextColor={colors.textSecondary} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Password rules — shown as soon as the user starts typing */}
                  {password.length > 0 && (() => {
                    const rules = [
                      { label: "At least 8 characters",          ok: password.length >= 8 },
                      { label: "One uppercase letter (A–Z)",      ok: /[A-Z]/.test(password) },
                      { label: "One lowercase letter (a–z)",      ok: /[a-z]/.test(password) },
                      { label: "One number (0–9)",                ok: /[0-9]/.test(password) },
                      { label: "One special character (!@#$…)",   ok: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
                    ];
                    const allPassed = rules.every((r) => r.ok);
                    return (
                      <View
                        style={{
                          backgroundColor: allPassed ? "#10b9810d" : colors.inputBg,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: allPassed ? "#10b98133" : colors.border,
                          padding: 12,
                          gap: 7,
                          marginTop: 2,
                        }}
                      >
                        {rules.map((rule) => (
                          <View key={rule.label} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <View
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 8,
                                backgroundColor: rule.ok ? "#10b981" : "#ef444426",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Ionicons
                                name={rule.ok ? "checkmark" : "close"}
                                size={10}
                                color={rule.ok ? "#fff" : "#ef4444"}
                              />
                            </View>
                            <Text style={{ fontSize: 12, color: rule.ok ? "#10b981" : colors.textSecondary, fontWeight: rule.ok ? "600" : "400" }}>
                              {rule.label}
                            </Text>
                          </View>
                        ))}
                      </View>
                    );
                  })()}
                </View>

                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 }}>Confirm Password</Text>
                  <View style={fieldBox}>
                    <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
                    <TextInput style={inputStyle} placeholder="Repeat password" maxLength={128} placeholderTextColor={colors.textSecondary} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} />
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                      <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Terms checkbox */}
                <TouchableOpacity onPress={() => setAgreedToTerms(!agreedToTerms)} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }} activeOpacity={0.7}>
                  <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: agreedToTerms ? "#7c3aed" : colors.border, backgroundColor: agreedToTerms ? "#7c3aed" : "transparent", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    {agreedToTerms && <Ionicons name="checkmark" size={13} color="#fff" />}
                  </View>
                  <Text style={{ flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>
                    I agree to the{" "}
                    <Text style={{ color: "#a855f7", fontWeight: "600" }}>Terms of Service</Text>
                    {" "}and{" "}
                    <Text style={{ color: "#a855f7", fontWeight: "600" }}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSendOtp} disabled={loading} style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4, opacity: loading ? 0.7 : 1 }}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Continue →</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Guest */}
          <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={{ alignItems: "center", marginTop: 20 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary + "99" }}>Continue as guest</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
