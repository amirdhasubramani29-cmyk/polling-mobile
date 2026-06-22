import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { apiFetch } from "../../src/utils/api";
import { getCurrentUserId, isLoggedIn } from "../../src/utils/authUser";
import { useTheme } from "../../src/utils/theme";
import { getCategoryColor } from "../../src/utils/categoryColors";

export default function MyPollsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const logged = await isLoggedIn();
      setLoggedIn(logged);
      setAuthLoading(false);
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (loggedIn) {
      loadPolls();
    } else {
      setPolls([]);          // Clear old polls
      setDeleteTarget(null); // Optional
      setLoading(false);
    }
  }, [loggedIn, authLoading]);

  async function loadPolls() {
    try {
      const userId = await getCurrentUserId();
      const res = await apiFetch("/api/polls/mypolls");
      const data = await res.json();
      if (res.ok) {
        const polls = data.map((v: any) => ({
          ...v.poll,
          myVote: v.selectedOption,
          voteRecord: v,
          categoryNames: v.poll.categories?.map((c: any) => c.name) || [],
        }));
        setPolls(polls);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/polls/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setPolls((p) => p.filter((x) => x.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else throw new Error("Failed");
    } catch {
      Alert.alert("Error", "Failed to delete poll.");
    } finally {
      setDeleting(false);
    }
  }

  if (!loggedIn)
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Ionicons name="lock-closed-outline" size={48} color="#a855f7" />
        <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 20, marginTop: 16, textAlign: "center" }}>Sign in to view your polls</Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          style={{ backgroundColor: "#7c3aed", borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginTop: 24 }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>{t("signIn")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );

  if (authLoading || loading)
    return (
        <SafeAreaView
          edges={["top", "left", "right"]}
          style={{
            flex: 1,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color="#a855f7" size="large" />
        </SafeAreaView>
      );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={polls}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary }}>{t("myPolls")}</Text>
            <TouchableOpacity
              onPress={() => router.push("/create" as any)}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#7c3aed1a", borderWidth: 1, borderColor: "#7c3aed33", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
            >
              <Ionicons name="add" size={16} color="#a855f7" />
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#a855f7" }}>New</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 15 }} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.description && (
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }} numberOfLines={1}>
                    {item.description}
                  </Text>
                )}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
                  <View><View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>{item.totalVotes || 0} votes</Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                      backgroundColor: item.pollType === "REGIONAL" ? "#0ea5e926" : "#7c3aed1a",
                      borderWidth: 1,
                      borderColor: item.pollType === "REGIONAL" ? "#0ea5e940" : "#7c3aed33",
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "700", color: item.pollType === "REGIONAL" ? "#38bdf8" : "#a855f7" }}>
                      {item.pollType === "REGIONAL" ? "Regional" : "Standard"}
                    </Text>

                  </View></View>
                  {item.categoryNames?.map((name: string) => {
                    const categoryColor = getCategoryColor(name);

                    return (
                      <View
                        key={name}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 999,
                          backgroundColor: `${categoryColor}20`,
                          borderWidth: 1,
                          borderColor: `${categoryColor}50`,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color: categoryColor,
                          }}
                        >
                          {name.charAt(0).toUpperCase() + name.slice(1)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => router.push((item.pollType === "REGIONAL" ? `/regional/${item.id}` : `/poll/${item.id}`) as any)}
                  style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#7c3aed1a", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#7c3aed33" }}
                >
                  <Ionicons name="eye-outline" size={16} color="#a855f7" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDeleteTarget(item)}
                  style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#ef44441a", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ef444433" }}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 80 }}>
            <Ionicons name="document-outline" size={48} color={colors.textSecondary} />
            <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 20, marginTop: 16 }}>No polls yet</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8 }}>Create your first poll to get started.</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/create" as any)}
              style={{ backgroundColor: "#7c3aed", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 20 }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>{t("createPoll")}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Delete confirmation modal */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "#00000099", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 24, width: "100%" }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "#ef44441a", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 }}>
              <Ionicons name="trash-outline" size={28} color="#ef4444" />
            </View>
            <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 17, textAlign: "center", marginBottom: 8 }}>{t("deletePoll")}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center", marginBottom: 24 }}>{t("deleteConfirm")}</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setDeleteTarget(null)}
                style={{ flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                disabled={deleting}
                style={{ flex: 1, backgroundColor: "#ef4444e6", borderRadius: 12, paddingVertical: 12, alignItems: "center", opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700" }}>{t("deletePoll")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
