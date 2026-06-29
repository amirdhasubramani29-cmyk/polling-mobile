import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter, useFocusEffect } from "expo-router";
import { apiFetch } from "../../src/utils/api";
import { getCurrentUserId, isLoggedIn } from "../../src/utils/authUser";
import { useTheme } from "../../src/utils/theme";
import { getCategoryColor } from "../../src/utils/categoryColors";

type Tab = "voted" | "created";

export default function MyPollsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const c = colors;

  const [activeTab, setActiveTab] = useState<Tab>("voted");
  const [loggedIn, setLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Voted polls state
  const [votedPolls, setVotedPolls] = useState<any[]>([]);
  const [votedLoading, setVotedLoading] = useState(false);
  const [votedRefreshing, setVotedRefreshing] = useState(false);

  // Created polls state
  const [createdPolls, setCreatedPolls] = useState<any[]>([]);
  const [createdLoading, setCreatedLoading] = useState(false);
  const [createdRefreshing, setCreatedRefreshing] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Auth check ──
  useEffect(() => {
    isLoggedIn().then((logged) => {
      setLoggedIn(logged);
      setAuthLoading(false);
    });
  }, []);

  // ── Load on focus ──
  useFocusEffect(
    useCallback(() => {
      if (!loggedIn) return;
      loadVotedPolls();
      loadCreatedPolls();
    }, [loggedIn])
  );

  // ── Clear when logged out ──
  useEffect(() => {
    if (!authLoading && !loggedIn) {
      setVotedPolls([]);
      setCreatedPolls([]);
      setDeleteTarget(null);
    }
  }, [loggedIn, authLoading]);

  // ── Fetch: polls I voted on ──
  async function loadVotedPolls(refresh = false) {
    if (refresh) setVotedRefreshing(true);
    else setVotedLoading(true);
    try {
      const res = await apiFetch("/api/polls/mypolls");
      if (res.status === 401) { setLoggedIn(false); return; }
      if (!res.ok) return;
      const data = await res.json();
      setVotedPolls(
        data.map((v: any) => ({
          ...v.poll,
          myVote: v.selectedOption,
          categoryNames: v.poll?.categories?.map((c: any) => c.name) || [],
        }))
      );
    } catch (e) {
      console.error(e);
    } finally {
      setVotedLoading(false);
      setVotedRefreshing(false);
    }
  }

  // ── Fetch: polls I created ──
 async function loadCreatedPolls(refresh = false) {
      //console.log("Loading created polls...");
   if (refresh) setCreatedRefreshing(true);
   else setCreatedLoading(true);

   try {
     const res = await apiFetch("/api/polls/mine");

     if (res.status === 401) {
       setLoggedIn(false);
       return;
     }

     if (!res.ok) {
       console.log("Failed:", res.status);
       return;
     }

     const data = await res.json();

     //console.log("Created polls:", data);

     setCreatedPolls(
       data.map((p: any) => ({
         ...p,
         categoryNames: p.categories?.map((c: any) => c.name) || [],
         totalVotes:
           p.totalVotes ??
           ((p.option1Votes || 0) +
             (p.option2Votes || 0) +
             (p.option3Votes || 0) +
             (p.option4Votes || 0)),
       }))
     );
   } catch (e) {
     console.error(e);
   } finally {
     setCreatedLoading(false);
     setCreatedRefreshing(false);
   }
 }

  // ── Delete a poll ──
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/polls/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setCreatedPolls((p) => p.filter((x) => x.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else throw new Error("Failed");
    } catch {
      Alert.alert("Error", "Failed to delete poll.");
    } finally {
      setDeleting(false);
    }
  }

  // ── Poll card (used in both tabs) ──
  const PollRow = ({
    item,
    showDelete = false,
    myVote,
  }: {
    item: any;
    showDelete?: boolean;
    myVote?: string;
  }) => {
    const href = item.pollType === "REGIONAL" ? `/regional/${item.id}` : `/poll/${item.id}`;
    return (
      <View
        style={{
          backgroundColor: c.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: c.border,
          padding: 16,
          marginBottom: 12,
        }}
      >
        {/* Top row: title/desc + action buttons */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.textPrimary, fontWeight: "700", fontSize: 15, lineHeight: 21 }} numberOfLines={2}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 3 }} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>

          {/* Action buttons — fixed width column */}
          <View style={{ gap: 8, alignSelf: "flex-start" }}>
            <TouchableOpacity
              onPress={() => router.push(href as any)}
              style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#7c3aed1a", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#7c3aed33" }}
            >
              <Ionicons name="eye-outline" size={15} color="#a855f7" />
            </TouchableOpacity>
            {showDelete && (
              <TouchableOpacity
                onPress={() => setDeleteTarget(item)}
                style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#ef44441a", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ef444433" }}
              >
                <Ionicons name="trash-outline" size={15} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Badges row — full width, wraps freely */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 10 }}>
          {/* Vote count */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Ionicons name="people-outline" size={11} color={c.textSecondary} />
            <Text style={{ fontSize: 11, color: c.textSecondary }}>{item.totalVotes || 0} votes</Text>
          </View>

          {/* Poll type */}
          <View style={{
            paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999,
            backgroundColor: item.pollType === "REGIONAL" ? "#0ea5e91a" : "#7c3aed1a",
            borderWidth: 1,
            borderColor: item.pollType === "REGIONAL" ? "#0ea5e933" : "#7c3aed33",
          }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: item.pollType === "REGIONAL" ? "#38bdf8" : "#a855f7" }}>
              {item.pollType === "REGIONAL" ? "Regional" : "Standard"}
            </Text>
          </View>

          {/* Categories */}
          {item.categoryNames?.slice(0, 3).map((name: string) => {
            const col = getCategoryColor(name);
            return (
              <View key={name} style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: `${col}1a`, borderWidth: 1, borderColor: `${col}40` }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: col }}>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Text>
              </View>
            );
          })}

          {/* My vote badge */}
          {myVote && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: "#10b9811a", borderWidth: 1, borderColor: "#10b98130" }}>
              <Ionicons name="checkmark" size={10} color="#10b981" />
              <Text style={{ fontSize: 10, fontWeight: "600", color: "#10b981" }}>Voted</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ── Auth guard ──
  if (authLoading)
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#a855f7" size="large" />
      </SafeAreaView>
    );

  if (!loggedIn)
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Ionicons name="lock-closed-outline" size={52} color="#a855f7" />
        <Text style={{ color: c.textPrimary, fontWeight: "700", fontSize: 20, marginTop: 16, textAlign: "center" }}>
          Sign in to view your polls
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14, marginTop: 24 }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>{t("signIn")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );

  // ── Main render ──
  const isVoted = activeTab === "voted";
  const currentData = isVoted ? votedPolls : createdPolls;
  const currentLoading = isVoted ? votedLoading : createdLoading;
  const currentRefreshing = isVoted ? votedRefreshing : createdRefreshing;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: c.background }}>

      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: c.textPrimary }}>{t("myPolls")}</Text>
        <TouchableOpacity
          onPress={() => router.push("/create" as any)}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#7c3aed1a", borderWidth: 1, borderColor: "#7c3aed33", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }}
        >
          <Ionicons name="add" size={16} color="#a855f7" />
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#a855f7" }}>New</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab Bar ── */}
      <View style={{ flexDirection: "row", marginHorizontal: 16, marginBottom: 4, backgroundColor: c.surface, borderRadius: 14, padding: 3, borderWidth: 1, borderColor: c.border }}>
        {([
          { id: "voted" as Tab, label: "Polls I Voted", icon: "checkmark-circle-outline" },
          { id: "created" as Tab, label: "Polls I Created", icon: "create-outline" },
        ] as const).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 10,
                borderRadius: 11,
                backgroundColor: active ? "#7c3aed" : "transparent",
              }}
              activeOpacity={0.75}
            >
              <Ionicons name={tab.icon} size={14} color={active ? "#fff" : c.textSecondary} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "#fff" : c.textSecondary }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Count badge ── */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
        <Text style={{ fontSize: 11, color: c.textSecondary }}>
          {currentLoading ? "Loading..." : `${currentData.length} poll${currentData.length !== 1 ? "s" : ""}`}
        </Text>
      </View>

      {/* ── List ── */}
      {currentLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#a855f7" size="large" />
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={currentRefreshing}
              onRefresh={() => isVoted ? loadVotedPolls(true) : loadCreatedPolls(true)}
              tintColor="#a855f7"
            />
          }
          renderItem={({ item }) => (
            <PollRow
              item={item}
              showDelete={!isVoted}
              myVote={isVoted ? item.myVote : undefined}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 80 }}>
              <Ionicons
                name={isVoted ? "checkmark-circle-outline" : "create-outline"}
                size={52}
                color={c.textSecondary}
              />
              <Text style={{ color: c.textPrimary, fontWeight: "700", fontSize: 18, marginTop: 16, textAlign: "center" }}>
                {isVoted ? "No polls voted yet" : "No polls created yet"}
              </Text>
              <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 8, textAlign: "center" }}>
                {isVoted
                  ? "Browse trending polls and cast your first vote!"
                  : "Create your first poll and share it with the world."}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  isVoted ? router.push("/(tabs)") : router.push("/create" as any)
                }
                style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12, marginTop: 20 }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {isVoted ? "Browse Polls" : t("createPoll")}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ── Delete Confirmation Modal ── */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "#00000099", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: c.surface, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 24, width: "100%" }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "#ef44441a", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 }}>
              <Ionicons name="trash-outline" size={28} color="#ef4444" />
            </View>
            <Text style={{ color: c.textPrimary, fontWeight: "700", fontSize: 17, textAlign: "center", marginBottom: 8 }}>
              {t("deletePoll")}
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: 13, textAlign: "center", marginBottom: 24 }}>
              {t("deleteConfirm")}
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setDeleteTarget(null)}
                style={{ flex: 1, backgroundColor: c.surface2, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ color: c.textSecondary, fontWeight: "600" }}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                disabled={deleting}
                style={{ flex: 1, backgroundColor: "#ef4444", borderRadius: 12, paddingVertical: 12, alignItems: "center", opacity: deleting ? 0.7 : 1 }}
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
