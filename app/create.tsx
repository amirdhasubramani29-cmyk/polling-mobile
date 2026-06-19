import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { apiFetch } from "../src/utils/api";
import { getCurrentUserId, isLoggedIn } from "../src/utils/authUser";

export default function CreatePollScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    isLoggedIn().then(setLoggedIn);
  }, []);

  async function handleCreate() {
    if (!title.trim()) return Alert.alert("Error", "Title is required.");
    const filled = options.filter((o) => o.trim());
    if (filled.length < 2) return Alert.alert("Error", "At least 2 options are required.");
    setSubmitting(true);
    try {
      const userId = await getCurrentUserId();
      const body = {
        title: title.trim(),
        description: description.trim(),
        userId,
        option1: filled[0] || "",
        option2: filled[1] || "",
        option3: filled[2] || "",
        option4: filled[3] || "",
      };
      const res = await apiFetch("/api/polls", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create poll");
      const data = await res.json();
      Alert.alert("Success!", "Poll created successfully.", [
        {
          text: "View Poll",
          onPress: () => router.replace(`/poll/${data.id}` as any),
        },
        {
          text: "Create Another",
          onPress: () => {
            setTitle("");
            setDescription("");
            setOptions(["", ""]);
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!loggedIn)
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center p-6">
        <Ionicons name="lock-closed-outline" size={48} color="#a855f7" />
        <Text className="text-text-primary font-bold text-xl mt-4 text-center">Sign in to create polls</Text>
        <Text className="text-text-secondary text-sm mt-2 text-center">
          Join trendingPolls to share your questions with the world.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          className="bg-primary rounded-xl px-8 py-3.5 mt-6"
        >
          <Text className="text-white font-bold">{t("signIn")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-extrabold text-text-primary">{t("createPoll")}</Text>
          <View className="flex-row items-center gap-2 bg-primary/8 border border-primary/20 rounded-xl p-3 mt-3">
            <Ionicons name="information-circle-outline" size={16} color="#a855f7" />
            <Text className="text-xs text-accent/80 flex-1">{t("signedInVoting")}</Text>
          </View>
        </View>

        {/* Title */}
        <View className="bg-surface rounded-3xl border border-border p-5 mb-4">
          <Text className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            {t("pollTitle")} *
          </Text>
          <TextInput
            className="text-text-primary text-base leading-relaxed"
            placeholder="What's your question?"
            placeholderTextColor="#6060a0"
            value={title}
            onChangeText={setTitle}
            multiline
            maxLength={200}
          />
          <Text className="text-xs text-text-secondary/50 text-right mt-2">{title.length}/200</Text>
        </View>

        {/* Description */}
        <View className="bg-surface rounded-3xl border border-border p-5 mb-4">
          <Text className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            {t("description")}
          </Text>
          <TextInput
            className="text-text-primary text-sm leading-relaxed"
            placeholder="Add more context (optional)"
            placeholderTextColor="#6060a0"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />
        </View>

        {/* Options */}
        <View className="bg-surface rounded-3xl border border-border p-5 mb-4">
          <Text className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Options (min 2, max 4)
          </Text>
          {options.map((opt, i) => (
            <View key={i} className="flex-row items-center gap-3 mb-3">
              <View className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 items-center justify-center">
                <Text className="text-xs font-bold text-accent">{i + 1}</Text>
              </View>
              <TextInput
                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-text-primary text-sm"
                placeholder={`Option ${i + 1}${i < 2 ? " (required)" : " (optional)"}`}
                placeholderTextColor="#6060a0"
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
                  <Ionicons name="close-circle" size={20} color="#6060a0" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {options.length < 4 && (
            <TouchableOpacity onPress={() => setOptions([...options, ""])} className="flex-row items-center gap-2 mt-1">
              <Ionicons name="add-circle-outline" size={18} color="#a855f7" />
              <Text className="text-accent text-sm font-medium">{t("addOption")}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleCreate}
          disabled={submitting}
          className="bg-primary rounded-2xl py-4 items-center"
          style={{ opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">{t("createPoll")}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
