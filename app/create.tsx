import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { apiFetch } from "../src/utils/api";
import { getCurrentUserId, isLoggedIn } from "../src/utils/authUser";
import { useTheme } from "../src/utils/theme";
import { POLL_CATEGORIES } from "../src/constants/categories";
import { getCategoryColor } from "../src/utils/categoryColors";

type RegionRow = { code: string; name: string };

type PollType = "NORMAL" | "REGIONAL";

export default function CreatePollScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const c = colors;

  const [loggedIn, setLoggedIn] = useState(false);

  // Form state
  const [pollType, setPollType] = useState<PollType>("NORMAL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  // Free-text region rows (code + name)
  const [regionRows, setRegionRows] = useState<RegionRow[]>([
    { code: "", name: "" },
    { code: "", name: "" },
  ]);
  const [allowGuestVotes, setAllowGuestVotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pickers visibility
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    isLoggedIn().then(setLoggedIn);
  }, []);

  function toggleCategory(id: number) {
    setSelectedCategories((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  }

  function updateRegionRow(i: number, field: keyof RegionRow, val: string) {
    setRegionRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r))
    );
  }

  function addRegionRow() {
    if (regionRows.length < 8)
      setRegionRows((prev) => [...prev, { code: "", name: "" }]);
  }

  function removeRegionRow(i: number) {
    if (regionRows.length > 2)
      setRegionRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  const filledRegions = regionRows.filter(
    (r) => r.code.trim().length > 0 && r.name.trim().length > 0
  );

  async function handleCreate() {
    if (!title.trim()) return Alert.alert("Error", "Title is required.");
    const filled = options.filter((o) => o.trim());
    if (filled.length < 2) return Alert.alert("Error", "At least 2 options are required.");
    if (selectedCategories.length === 0)
      return Alert.alert("Error", "Please select at least one category.");
    if (pollType === "REGIONAL" && filledRegions.length < 2)
      return Alert.alert("Error", "Please enter at least 2 regions (code + name) for a regional poll.");

    setSubmitting(true);
    try {
      const userId = await getCurrentUserId();

      const body: any = {
          title: title.trim(),
          description: description.trim(),
          userId,
          isRegional: pollType === "REGIONAL",
          categories: selectedCategories.map((id) => ({ id })),
          option1: filled[0] || "",
          option2: filled[1] || "",
          option3: filled[2] || "",
          option4: filled[3] || "",
          allowGuestVotes,
      };

      if (pollType === "REGIONAL") {
        body.regions = filledRegions.map((r) => ({
            code: r.code.trim().toUpperCase(),
            name: r.name.trim(),
        }));
      }

      const endpoint = "/api/polls";
      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create poll");
      }

      const data = await res.json();
      Alert.alert("Success! 🎉", "Your poll has been created.", [
        {
          text: "My Polls",
          onPress: () =>
            router.replace("/(tabs)/my-polls"),
        },
        {
          text: "Create Another",
          onPress: () => {
            setTitle("");
            setDescription("");
            setOptions(["", ""]);
            setSelectedCategories([]);
            setAllowGuestVotes(false);
            setRegionRows([{ code: "", name: "" }, { code: "", name: "" }]);
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared style helpers ──
  const card = {
    backgroundColor: c.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: c.border,
    padding: 18,
    marginBottom: 14,
  };
  const label = {
    fontSize: 11,
    fontWeight: "700" as const,
    color: c.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    marginBottom: 10,
  };
  const inputBox = {
    backgroundColor: c.inputBg,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: c.textPrimary,
    fontSize: 14,
  };

  // ── Not logged in ──
  if (!loggedIn)
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{ flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center", padding: 24 }}
      >
        <Ionicons name="lock-closed-outline" size={52} color="#a855f7" />
        <Text style={{ color: c.textPrimary, fontWeight: "700", fontSize: 20, marginTop: 16, textAlign: "center" }}>
          Sign in to create polls
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 8, textAlign: "center" }}>
          Join TrendingPolls to share your questions with the world.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginTop: 24 }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{t("signIn")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 26, fontWeight: "800", color: c.textPrimary }}>{t("createPoll")}</Text>
          <Text style={{ fontSize: 13, color: c.textSecondary, marginTop: 4 }}>
            Share a question and let people vote
          </Text>
        </View>

        {/* ── Poll Type Toggle ── */}
        <Text style={label}>Poll Type</Text>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: c.surface,
            borderRadius: 16,
            padding: 4,
            borderWidth: 1,
            borderColor: c.border,
            marginBottom: 14,
            gap: 4,
          }}
        >
          {(["NORMAL", "REGIONAL"] as PollType[]).map((type) => {
            const active = pollType === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setPollType(type)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 11,
                  borderRadius: 12,
                  backgroundColor: active ? "#7c3aed" : "transparent",
                }}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={type === "NORMAL" ? "stats-chart-outline" : "map-outline"}
                  size={15}
                  color={active ? "#fff" : c.textSecondary}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: active ? "#fff" : c.textSecondary,
                  }}
                >
                  {type === "NORMAL" ? "Standard Poll" : "Regional Poll"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Type description */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 10,
            backgroundColor: pollType === "REGIONAL" ? "#0ea5e90e" : "#7c3aed0e",
            borderWidth: 1,
            borderColor: pollType === "REGIONAL" ? "#0ea5e930" : "#7c3aed30",
            borderRadius: 14,
            padding: 12,
            marginBottom: 18,
          }}
        >
          <Ionicons
            name={pollType === "REGIONAL" ? "map-outline" : "stats-chart-outline"}
            size={16}
            color={pollType === "REGIONAL" ? "#0ea5e9" : "#a855f7"}
          />
          <Text style={{ fontSize: 12, color: c.textSecondary, flex: 1, lineHeight: 18 }}>
            {pollType === "REGIONAL"
              ? "A regional poll lets voters pick their region before voting, so you can see results broken down by area."
              : "A standard poll lets anyone vote and shows overall results for all participants."}
          </Text>
        </View>

        {/* ── Title ── */}
        <View style={card}>
          <Text style={label}>{t("pollTitle")} *</Text>
          <TextInput
            style={[inputBox, { minHeight: 56, textAlignVertical: "top" }]}
            placeholder="What's your question?"
            placeholderTextColor={c.textSecondary}
            value={title}
            onChangeText={setTitle}
            multiline
            maxLength={200}
          />
          <Text style={{ fontSize: 11, color: c.textSecondary, textAlign: "right", marginTop: 6 }}>
            {title.length}/200
          </Text>
        </View>

        {/* ── Description ── */}
        <View style={card}>
          <Text style={label}>{t("description")}</Text>
          <TextInput
            style={[inputBox, { minHeight: 72, textAlignVertical: "top" }]}
            placeholder="Add more context to help voters decide..."
            placeholderTextColor={c.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />
        </View>

        {/* ── Options ── */}
        <View style={card}>
          <Text style={label}>Options * (min 2, max 4)</Text>
          {options.map((opt, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: "#7c3aed1a",
                  borderWidth: 1,
                  borderColor: "#7c3aed33",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#a855f7" }}>{i + 1}</Text>
              </View>
              <TextInput
                style={[inputBox, { flex: 1 }]}
                placeholder={`Option ${i + 1}${i < 2 ? " (required)" : " (optional)"}`}
                placeholderTextColor={c.textSecondary}
                value={opt}
                onChangeText={(v) => {
                  const n = [...options];
                  n[i] = v;
                  setOptions(n);
                }}
                maxLength={100}
              />
              {i >= 2 && (
                <TouchableOpacity onPress={() => setOptions(options.filter((_, j) => j !== i))}>
                  <Ionicons name="close-circle" size={22} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {options.length < 4 && (
            <TouchableOpacity
              onPress={() => setOptions([...options, ""])}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}
            >
              <Ionicons name="add-circle-outline" size={18} color="#a855f7" />
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#a855f7" }}>{t("addOption")}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Category Picker ── */}
        <View style={card}>
          <Text style={label}>Category *</Text>
          <TouchableOpacity
            onPress={() => setShowCategoryPicker(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: c.inputBg,
              borderWidth: 1,
              borderColor: selectedCategories.length > 0 ? "#7c3aed66" : c.border,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: selectedCategories.length > 0 ? c.textPrimary : c.textSecondary,
              }}
            >
              {selectedCategories.length === 0
                ? "Select categories..."
                : POLL_CATEGORIES.filter((cat) => selectedCategories.includes(cat.id))
                    .map((cat) => cat.name.charAt(0).toUpperCase() + cat.name.slice(1))
                    .join(", ")}
            </Text>
            <Ionicons name="chevron-down" size={16} color={c.textSecondary} />
          </TouchableOpacity>

          {selectedCategories.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {POLL_CATEGORIES.filter((cat) => selectedCategories.includes(cat.id)).map((cat) => {
                const cc = getCategoryColor(cat.name);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => toggleCategory(cat.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: cc + "22",
                      borderWidth: 1,
                      borderColor: cc + "55",
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: cc }}>
                      {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                    </Text>
                    <Ionicons name="close" size={11} color={cc} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Regional: Free-text Region Rows ── */}
        {pollType === "REGIONAL" && (
          <View style={card}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={label}>Regions * (min 2)</Text>
              {regionRows.length < 8 && (
                <TouchableOpacity
                  onPress={addRegionRow}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4,
                    backgroundColor: "#0ea5e91a", borderWidth: 1, borderColor: "#0ea5e940",
                    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}
                >
                  <Ionicons name="add" size={14} color="#0ea5e9" />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#0ea5e9" }}>Add Region</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={{ fontSize: 12, color: c.textSecondary, marginBottom: 12, lineHeight: 18 }}>
              Enter each region your poll covers. Voters will pick their region before voting.
            </Text>

            {regionRows.map((row, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {/* Index badge */}
                <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: "#0ea5e91a",
                  alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#0ea5e9" }}>{i + 1}</Text>
                </View>
                {/* Code input */}
                <TextInput
                  style={[inputBox, { width: 64, textAlign: "center", fontWeight: "700",
                    fontSize: 12, letterSpacing: 1, paddingHorizontal: 8, paddingVertical: 9 }]}
                  placeholder="CODE"
                  placeholderTextColor={c.textSecondary}
                  value={row.code}
                  onChangeText={(v) => updateRegionRow(i, "code", v.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={6}
                />
                {/* Name input */}
                <TextInput
                  style={[inputBox, { flex: 1, paddingVertical: 9 }]}
                  placeholder="Region name"
                  placeholderTextColor={c.textSecondary}
                  value={row.name}
                  onChangeText={(v) => updateRegionRow(i, "name", v)}
                  maxLength={40}
                />
                {/* Remove */}
                <TouchableOpacity
                  onPress={() => removeRegionRow(i)}
                  disabled={regionRows.length <= 2}
                  style={{ opacity: regionRows.length <= 2 ? 0.3 : 1 }}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            {filledRegions.length < 2 && (
              <Text style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>
                ⚠ Fill at least 2 regions to create a regional poll.
              </Text>
            )}
            {filledRegions.length >= 2 && (
              <Text style={{ fontSize: 11, color: "#10b981", marginTop: 4 }}>
                ✓ {filledRegions.length} region{filledRegions.length > 1 ? "s" : ""} ready
              </Text>
            )}
          </View>
        )}

        {/* ── Allow Guest Votes Toggle ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: c.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: allowGuestVotes ? "#22c55e33" : c.border,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: allowGuestVotes ? "#22c55e1a" : c.surface2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={allowGuestVotes ? "shield-checkmark" : "shield-outline"}
                size={20}
                color={allowGuestVotes ? "#22c55e" : c.textSecondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.textPrimary }}>Allow Guest Voting</Text>
              <Text style={{ fontSize: 12, color: c.textSecondary, marginTop: 2, lineHeight: 17 }}>
                {allowGuestVotes
                  ? "Anyone can vote, even without an account"
                  : "Only signed-in users can vote"}
              </Text>
            </View>
          </View>
          {/* Toggle switch */}
          <TouchableOpacity
            onPress={() => setAllowGuestVotes((v) => !v)}
            activeOpacity={0.8}
            style={{
              width: 48,
              height: 26,
              borderRadius: 13,
              backgroundColor: allowGuestVotes ? "#22c55e" : c.border,
              justifyContent: "center",
              paddingHorizontal: 3,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#fff",
                alignSelf: allowGuestVotes ? "flex-end" : "flex-start",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 2,
              }}
            />
          </TouchableOpacity>
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          onPress={handleCreate}
          disabled={submitting}
          style={{
            backgroundColor: "#7c3aed",
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            opacity: submitting ? 0.7 : 1,
          }}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{t("createPoll")}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Category Picker Modal ── */}
      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#00000080", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              paddingBottom: 40,
              maxHeight: "70%",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Select Categories</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close-circle" size={26} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: c.textSecondary, marginBottom: 10 }}>
              Pick up to 3 categories
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {POLL_CATEGORIES.map((cat) => {
                const active = selectedCategories.includes(cat.id);
                const cc = getCategoryColor(cat.name);
                const disabled = !active && selectedCategories.length >= 3;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => !disabled && toggleCategory(cat.id)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 9,
                      borderRadius: 999,
                      borderWidth: 1.5,
                      borderColor: active ? cc : c.border,
                      backgroundColor: active ? cc : c.inputBg,
                      opacity: disabled ? 0.35 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#fff" : c.textSecondary }}>
                      {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={() => setShowCategoryPicker(false)}
              style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 20 }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Done — {selectedCategories.length}/3 selected
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
}
