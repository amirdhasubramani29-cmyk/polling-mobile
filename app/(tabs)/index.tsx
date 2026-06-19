import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import PollCard from "../../src/components/PollCard";
import BrandName from "../../src/components/BrandName";
import { apiFetch } from "../../src/utils/api";
import { isLoggedIn } from "../../src/utils/authUser";
import { useTheme } from "../../src/utils/theme";
import { POLL_CATEGORIES  } from "../../src/constants/categories";

export default function TrendingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const [polls, setPolls] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [backendDown, setBackendDown] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    isLoggedIn().then(setLoggedIn);
  }, []);

  async function loadData() {
    try {
      const [pollRes, statRes] = await Promise.all([
        apiFetch("/api/polls"),
        apiFetch("/api/polls/stats"),
      ]);
      const [pollData, statData] = await Promise.all([pollRes.json(), statRes.json()]);
      const withCats = pollData.map((p: any) => ({
        ...p,
        categoryNames: p.categories?.length ? p.categories.map((c: any) => c.name) : [t("uncategorized")],
      }));
      setPolls(withCats);
      setStats(statData);
    } catch (e: any) {
      if (e.message === "BACKEND_UNAVAILABLE") {
        setBackendDown(true);
        return;
      }
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function doSearch() {
    if (search.length > 0 && search.length < 3) return;
    try {
      const params = new URLSearchParams({ search: search.trim(), category: selectedCategory });
      const res = await apiFetch(`/api/polls/search?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const uniquePolls = Array.from(new Map(data.map((p: any) => [p.id, p])).values());
      const normalized = uniquePolls.map((poll: any) => ({
        ...poll,
        categoryNames: poll.categories?.length ? poll.categories.map((c: any) => c.name) : [t("uncategorized")],
      }));
      setPolls(normalized);
      setPage(1);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    doSearch();
  }, [search, selectedCategory]);

  const filtered = polls;
  const paged = filtered.slice(0, page * PER_PAGE);
  const hasMore = paged.length < filtered.length;

  if (backendDown)
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        <Ionicons name="cloud-offline-outline" size={72} color="#ef4444" />
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary, marginTop: 16 }}>Server Unavailable</Text>
        <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 8 }}>Unable to connect to the trendingPolls server.</Text>
        <TouchableOpacity onPress={loadData} style={{ backgroundColor: "#7c3aed", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 24 }}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );

  if (loading)
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#a855f7" size="large" />
        <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: 13 }}>{t("loading")}</Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={paged}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor="#a855f7"
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={{ marginBottom: 20 }}>
              <BrandName className="text-3xl font-extrabold text-text-primary" />
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>Discover what people are voting on</Text>
            </View>

            {/* Stats */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              {[
                { label: t("activePolls"), value: stats?.totalPolls, icon: "flame-outline", color: "#a855f7" },
                { label: t("totalVotes"), value: stats?.totalVotes, icon: "people-outline", color: "#0ea5e9" },
              ].map((s, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                  <Ionicons name={s.icon as any} size={18} color={s.color} />
                  <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary, marginTop: 4 }}>{s.value?.toLocaleString()}</Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Guest banner */}
            {!loggedIn && (
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#f59e0b14", borderWidth: 1, borderColor: "#f59e0b40", borderRadius: 16, padding: 16, marginBottom: 16 }}
              >
                <Ionicons name="sparkles" size={18} color="#f59e0b" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: "#fbbf24", fontWeight: "500" }}>{t("guestBanner")}</Text>
                  <Text style={{ fontSize: 11, color: "#fbbf2499", textDecorationLine: "underline" }}>{t("loginToViewAll")}</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Search */}
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12, marginBottom: 12 }}>
              <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={{ flex: 1, paddingVertical: 12, color: colors.textPrimary, fontSize: 13 }}
                placeholder={t("search")}
                placeholderTextColor={colors.textSecondary}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            {search.length > 0 && search.length < 3 && (
              <Text style={{ fontSize: 11, color: "#f59e0b", marginBottom: 8, marginLeft: 4 }}>
                Type {3 - search.length} more character{3 - search.length > 1 ? "s" : ""} to search
              </Text>
            )}

            {/* Category filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", gap: 8, paddingRight: 16 }}>
                {["all", ...POLL_CATEGORIES.map((c) => c.name)].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => { setSelectedCategory(cat); setPage(1); }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      backgroundColor: selectedCategory === cat ? "#7c3aed" : colors.surface,
                      borderColor: selectedCategory === cat ? "#7c3aed" : colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "600", color: selectedCategory === cat ? "#fff" : colors.textSecondary }}>
                      {cat === "all"
                        ? t("all")
                        : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 12 }}>
              {t("showing")} {Math.min(paged.length, filtered.length)} {t("of")} {filtered.length} {t("polls")}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => <PollCard poll={item} showTrending={index < 3} />}
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              onPress={() => setPage((p) => p + 1)}
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingVertical: 12, alignItems: "center", marginTop: 8 }}
            >
              <Text style={{ color: "#a855f7", fontWeight: "600", fontSize: 13 }}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 80 }}>
            <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
            <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 20, marginTop: 16 }}>{t("noPolls")}</Text>
            <TouchableOpacity onPress={() => { setSearch(""); setSelectedCategory("all"); }} style={{ marginTop: 16 }}>
              <Text style={{ color: "#a855f7", fontSize: 13 }}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}
