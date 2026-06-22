import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import OptionCard from "../../src/components/OptionCard";
import { apiFetch } from "../../src/utils/api";
import { isLoggedIn, getCurrentUserId } from "../../src/utils/authUser";
import { timeAgo } from "../../src/utils/timeAgo";
import i18n from "../../src/i18n";
import * as SecureStore from "expo-secure-store";
import { useTheme } from "../../src/utils/theme";

const PALETTE = ["#8b5cf6", "#d946ef", "#0ea5e9", "#10b981"];
const STEPS = ["Region", "Vote", "Results"] as const;

/** Normalise regional result row → per-option vote counts keyed "1","2","3","4" */
function extractOptionVotes(row: any): Record<string, number> {
  // Shape A: { votes: { option1: n, option2: n, … } }
  if (row.votes && typeof row.votes === "object" && !Array.isArray(row.votes)) {
    const out: Record<string, number> = {};
    for (let i = 1; i <= 4; i++) {
      out[String(i)] =
        row.votes[`option${i}`] ??
        row.votes[`option_${i}`] ??
        row.votes[i] ??
        0;
    }
    return out;
  }
  // Shape B: flat { votes1: n, votes2: n, … }
  const out: Record<string, number> = {};
  for (let i = 1; i <= 4; i++) {
    out[String(i)] =
      row[`votes${i}`] ??
      row[`option${i}Votes`] ??
      row[`vote${i}`] ??
      0;
  }
  return out;
}

export default function RegionalPollScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();

  const [poll, setPoll] = useState<any>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [originalVoted, setOriginalVoted] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [regionalData, setRegionalData] = useState<any[]>([]);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    isLoggedIn().then(setLoggedIn);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [pollRes, regRes, reactRes] = await Promise.all([
          apiFetch(`/api/polls/${id}`),
          apiFetch(`/api/polls/${id}/regions`),
          apiFetch(`/api/pollsreaction/${id}/reactions`),
        ]);
        const [pollData, regData] = await Promise.all([pollRes.json(), regRes.json()]);
        setPoll(pollData);
        setRegions(Array.isArray(regData) ? regData : []);

        if (reactRes.ok) {
          const rd = await reactRes.json();
          setLikes(rd.likes || 0);
          setDislikes(rd.dislikes || 0);
        }

        const userId = await getCurrentUserId();
        const voteRes = await apiFetch(`/api/polls/${id}/myvote?userId=${encodeURIComponent(userId)}`);
        if (voteRes.ok) {
          const vd = await voteRes.json();
          if (vd.voted) {
            setHasVoted(true);
            const vid = String(vd.selectedOption);
            setSelectedOption(vid);
            setOriginalVoted(vid);
            if (vd.regionCode) {
              const region =
                (Array.isArray(regData) ? regData : []).find((r: any) => r.regionCode === vd.regionCode) ||
                { regionCode: vd.regionCode, regionName: vd.regionCode };
              setSelectedRegion(region);
            }
            setStep(2);
            const rrRes = await apiFetch(`/api/polls/${id}/regional-results`);
            if (rrRes.ok) setRegionalData(await rrRes.json());
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    loadComments();
  }, [id]);

  async function handlePostComment() {
    if (!commentText.trim()) return;
    if (!loggedIn) { router.push("/(auth)/login"); return; }
    setIsPosting(true);
    try {
      const userId = await getCurrentUserId();
      const userJson = await SecureStore.getItemAsync("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const res = await apiFetch(`/api/comments/${id}`, {
        method: "POST",
        body: JSON.stringify({ userId, userName: user?.name, text: commentText.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      setCommentText("");
      await loadComments();
    } catch {
      Alert.alert("Error", "Failed to post comment");
    } finally {
      setIsPosting(false);
    }
  }

  async function handleShare() {
    try {
      await Share.share({ message: `${poll.title}\n\nVote now:\nhttps://trendingpolls.in/regional/${poll.id}` });
    } catch (error) {
      console.error("Share failed", error);
    }
  }

  async function handleReact(reaction: "like" | "dislike") {
    if (!loggedIn) {
      Alert.alert("Login Required", "Sign in to like or dislike this poll.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/(auth)/login") },
      ]);
      return;
    }
    const userId = await getCurrentUserId();
    const res = await apiFetch(`/api/pollsreaction/${id}/reaction`, {
      method: "POST",
      body: JSON.stringify({ userId, reaction }),
    });
    if (!res.ok) return;
    const d = await res.json();
    setLikes(d.likes);
    setDislikes(d.dislikes);
    setMyReaction(d.myReaction);
  }

  async function loadComments() {
    setCommentsLoading(true);
    try {
      const res = await apiFetch(`/api/comments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : data.comments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCommentsLoading(false);
    }
  }

  async function handleVote() {
    if (!selectedOption || !selectedRegion) return;
    setIsVoting(true);
    try {
      const userId = await getCurrentUserId();
      const res = await apiFetch(`/api/polls/${id}/vote`, {
        method: "POST",
        body: JSON.stringify({ selectedOption, userId, regionCode: selectedRegion.regionCode }),
      });
      if (!res.ok) throw new Error("Vote failed");
      const updated = await res.json();
      setPoll(updated);
      setHasVoted(true);
      setOriginalVoted(selectedOption);
      const rrRes = await apiFetch(`/api/polls/${id}/regional-results`);
      if (rrRes.ok) setRegionalData(await rrRes.json());
      setStep(2);
    } catch {
      Alert.alert("Error", "Failed to submit vote");
    } finally {
      setIsVoting(false);
    }
  }

  if (loading)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#a855f7" size="large" />
      </SafeAreaView>
    );

  if (!poll)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.textPrimary }}>Poll not found</Text>
      </SafeAreaView>
    );

  const options = [
    { id: "1", text: poll.option1 },
    { id: "2", text: poll.option2 },
    { id: "3", text: poll.option3 },
    { id: "4", text: poll.option4 },
  ].filter((o) => o.text?.trim());

  // ── Aggregate overall results across all regions ──
  const overallVotesById: Record<string, number> = {};
  for (const row of regionalData) {
    const v = extractOptionVotes(row);
    for (const opt of options) {
      overallVotesById[opt.id] = (overallVotesById[opt.id] || 0) + (v[opt.id] || 0);
    }
  }
  const overallTotal = Object.values(overallVotesById).reduce((s, n) => s + n, 0);
  const overallResults = options
    .map((opt, i) => {
      const votes = overallVotesById[opt.id] || 0;
      return { ...opt, votes, pct: overallTotal > 0 ? Math.round((votes / overallTotal) * 100) : 0, color: PALETTE[i] };
    })
    .sort((a, b) => b.votes - a.votes);

  // ── Per-region breakdown for selected region ──
  const myRegionRow = selectedRegion
    ? regionalData.find((r) => r.regionCode === selectedRegion.regionCode)
    : null;
  const myRegionVotes = myRegionRow ? extractOptionVotes(myRegionRow) : null;
  const myRegionTotal = myRegionVotes ? Object.values(myRegionVotes).reduce((s, n) => s + n, 0) : 0;
  const myRegionResults = myRegionVotes
    ? options
        .map((opt, i) => ({
          ...opt,
          votes: myRegionVotes[opt.id] || 0,
          pct: myRegionTotal > 0 ? Math.round(((myRegionVotes[opt.id] || 0) / myRegionTotal) * 100) : 0,
          color: PALETTE[i],
        }))
        .sort((a, b) => b.votes - a.votes)
    : [];

  // ─────────────────────────────────────────────────

  const c = colors; // shorthand
  const cardStyle = {
    backgroundColor: c.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.border,
    padding: 20,
    marginBottom: 16,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: c.background }}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>

          {/* ── Step progress ── */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            {STEPS.map((s, i) => (
              <View key={s} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <View
                  style={{
                    width: 28, height: 28, borderRadius: 14,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: step >= i ? "#7c3aed" : c.surface,
                    borderWidth: step >= i ? 0 : 1,
                    borderColor: c.border,
                  }}
                >
                  {step > i ? (
                    <Ionicons name="checkmark" size={14} color="white" />
                  ) : (
                    <Text style={{ fontSize: 11, fontWeight: "700", color: step === i ? "#fff" : c.textSecondary }}>{i + 1}</Text>
                  )}
                </View>
                <Text style={{ fontSize: 11, marginLeft: 4, fontWeight: "600", color: step >= i ? "#a855f7" : c.textSecondary }}>{s}</Text>
                {i < STEPS.length - 1 && (
                  <View style={{ flex: 1, height: 1.5, marginHorizontal: 8, backgroundColor: step > i ? "#7c3aed" : c.border }} />
                )}
              </View>
            ))}
          </View>

          {/* ── Poll title card ── */}
          <View style={cardStyle}>
            <Text style={{ fontSize: 19, fontWeight: "800", color: c.textPrimary, lineHeight: 26 }}>{poll.title}</Text>
            {poll.description && <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 6 }}>{poll.description}</Text>}

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 5 }} onPress={() => handleReact("like")}>
                  <Ionicons name={myReaction === "like" ? "thumbs-up" : "thumbs-up-outline"} size={18} color="#22c55e" />
                  <Text style={{ color: c.textSecondary, fontSize: 13 }}>{likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 5 }} onPress={() => handleReact("dislike")}>
                  <Ionicons name={myReaction === "dislike" ? "thumbs-down" : "thumbs-down-outline"} size={18} color="#ef4444" />
                  <Text style={{ color: c.textSecondary, fontSize: 13 }}>{dislikes}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleShare}>
                <Ionicons name="share-social-outline" size={20} color="#a855f7" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Step 0: Region selection ── */}
          {step === 0 && (
            <View style={cardStyle}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#0ea5e91a", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="map-outline" size={18} color="#0ea5e9" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: c.textPrimary }}>{t("selectRegion")}</Text>
              </View>
              {regions.length === 0 ? (
                <Text style={{ color: c.textSecondary, fontSize: 13 }}>No regions available for this poll.</Text>
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {regions.map((r) => (
                    <TouchableOpacity
                      key={r.regionCode}
                      onPress={() => { setSelectedRegion(r); setStep(1); }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: c.border,
                        backgroundColor: c.surface2,
                        alignItems: "center",
                        minWidth: 80,
                      }}
                    >
                      <Text style={{ fontSize: 20, marginBottom: 2 }}>{r.flag || "🌐"}</Text>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: c.textPrimary }}>{r.regionCode}</Text>
                      <Text style={{ fontSize: 10, color: c.textSecondary, textAlign: "center", marginTop: 2 }} numberOfLines={1}>{r.regionName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── Step 1: Vote ── */}
          {step === 1 && !hasVoted && (
            <View style={cardStyle}>
              {/* Region chip + change */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#7c3aed1a", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "#7c3aed33" }}>
                  <Text style={{ fontSize: 16 }}>{selectedRegion?.flag || "🌐"}</Text>
                  <Ionicons name="location-outline" size={12} color="#a855f7" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#a855f7" }}>{selectedRegion?.regionCode}</Text>
                  <Text style={{ fontSize: 12, color: c.textSecondary }}>· {selectedRegion?.regionName}</Text>
                </View>
                <TouchableOpacity onPress={() => setStep(0)}>
                  <Text style={{ fontSize: 12, color: "#a855f780" }}>Change</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 15, fontWeight: "700", color: c.textPrimary, marginBottom: 14 }}>{poll.questionTitle || poll.title}</Text>
              {options.map((opt) => (
                <OptionCard
                  key={opt.id}
                  text={opt.text}
                  isSelected={selectedOption === opt.id}
                  isPrevVote={originalVoted === opt.id}
                  onPress={() => setSelectedOption(opt.id)}
                />
              ))}
              <TouchableOpacity
                onPress={handleVote}
                disabled={!selectedOption || isVoting}
                style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 8, opacity: !selectedOption || isVoting ? 0.5 : 1 }}
              >
                {isVoting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{t("submitVote")}</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 2: Results ── */}
          {step === 2 && (
            <View>
              {/* Your vote banner */}
              {selectedOption && (() => {
                const myOpt = options.find((o) => o.id === selectedOption);
                return myOpt ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#10b9811a", borderWidth: 1, borderColor: "#10b98133", borderRadius: 16, padding: 16, marginBottom: 16 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#10b98126", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#10b981" }}>{t("yourVote")}</Text>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: "#34d399" }}>{myOpt.text}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: "#10b98166" }}>See results below</Text>
                  </View>
                ) : null;
              })()}

              {/* Your region banner */}
              {selectedRegion && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#0ea5e91a", borderWidth: 1, borderColor: "#0ea5e933", borderRadius: 16, padding: 14, marginBottom: 16 }}>
                  <Text style={{ fontSize: 22 }}>{selectedRegion.flag || "🌐"}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#0ea5e9" }}>Your Region</Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: c.textPrimary }}>{selectedRegion.regionName || selectedRegion.regionCode}</Text>
                  </View>
                  <View style={{ backgroundColor: "#0ea5e91a", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#0ea5e933" }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#0ea5e9" }}>{myRegionTotal > 0 ? `${myRegionTotal} votes` : "No votes yet"}</Text>
                  </View>
                </View>
              )}

              {/* Stats row */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                {[
                  { icon: "globe-outline", val: String(regions.length || 0), label: t("regionParticipating"), color: "#0ea5e9" },
                  { icon: "people-outline", val: (poll.totalVotes || overallTotal || 0).toLocaleString(), label: t("totalVotes"), color: "#8b5cf6" },
                ].map((s, i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: c.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.border, alignItems: "center" }}>
                    <Ionicons name={s.icon as any} size={18} color={s.color} />
                    <Text style={{ fontSize: 20, fontWeight: "800", color: s.color, marginTop: 4 }}>{s.val}</Text>
                    <Text style={{ fontSize: 10, color: c.textSecondary, textAlign: "center", marginTop: 2 }}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* ── Your region breakdown ── */}
              {myRegionResults.length > 0 && (
                <View style={{ ...cardStyle, marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <Text style={{ fontSize: 16 }}>{selectedRegion?.flag || "🌐"}</Text>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: c.textPrimary }}>
                      {selectedRegion?.regionName || selectedRegion?.regionCode} Results
                    </Text>
                    <View style={{ marginLeft: "auto", backgroundColor: "#0ea5e91a", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#0ea5e930" }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#0ea5e9" }}>{myRegionTotal} votes</Text>
                    </View>
                  </View>
                  {myRegionResults.map((opt, i) => {
                    const isMyVote = opt.id === selectedOption;
                    const isWinner = i === 0 && opt.votes > 0;
                    return (
                      <View
                        key={opt.id}
                        style={{
                          marginBottom: 12,
                          padding: 12,
                          borderRadius: 14,
                          borderWidth: 2,
                          borderColor: isMyVote ? "#10b98133" : "transparent",
                          backgroundColor: isMyVote ? "#10b9810d" : "transparent",
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                            {isWinner && <Ionicons name="trophy" size={13} color="#f59e0b" />}
                            <Text style={{ fontSize: 13, color: c.textSecondary, flex: 1 }} numberOfLines={1}>{opt.text}</Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            {isMyVote && (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: "#10b98120", borderWidth: 1, borderColor: "#10b98130" }}>
                                <Ionicons name="checkmark" size={9} color="#10b981" />
                                <Text style={{ fontSize: 9, fontWeight: "700", color: "#10b981" }}>Your vote</Text>
                              </View>
                            )}
                            <Text style={{ fontSize: 12, fontWeight: "700", color: opt.color }}>{opt.pct}%</Text>
                          </View>
                        </View>
                        <View style={{ height: 7, backgroundColor: c.surface2, borderRadius: 999, overflow: "hidden" }}>
                          <View style={{ height: "100%", borderRadius: 999, width: `${opt.pct}%`, backgroundColor: opt.color }} />
                        </View>
                        <Text style={{ fontSize: 10, color: c.textSecondary, marginTop: 3 }}>{opt.votes} votes</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* ── Overall results ── */}
              <View style={cardStyle}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: c.textPrimary, marginBottom: 16 }}>{t("overallResults")}</Text>
                {overallResults.map((opt, i) => {
                  const isMyVote = opt.id === selectedOption;
                  const isWinner = i === 0 && opt.votes > 0;
                  return (
                    <View
                      key={opt.id}
                      style={{
                        marginBottom: 12,
                        padding: 12,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: isMyVote ? "#10b98133" : "transparent",
                        backgroundColor: isMyVote ? "#10b9810d" : "transparent",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                          {isWinner && <Ionicons name="trophy" size={13} color="#f59e0b" />}
                          <Text style={{ fontSize: 13, color: c.textSecondary, flex: 1 }} numberOfLines={1}>{opt.text}</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          {isMyVote && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: "#10b98120", borderWidth: 1, borderColor: "#10b98130" }}>
                              <Ionicons name="checkmark" size={9} color="#10b981" />
                              <Text style={{ fontSize: 9, fontWeight: "700", color: "#10b981" }}>Your vote</Text>
                            </View>
                          )}
                          <Text style={{ fontSize: 12, fontWeight: "700", color: opt.color }}>{opt.pct}%</Text>
                        </View>
                      </View>
                      <View style={{ height: 7, backgroundColor: c.surface2, borderRadius: 999, overflow: "hidden" }}>
                        <View style={{ height: "100%", borderRadius: 999, width: `${opt.pct}%`, backgroundColor: opt.color }} />
                      </View>
                      <Text style={{ fontSize: 10, color: c.textSecondary, marginTop: 3 }}>{opt.votes.toLocaleString()} votes across all regions</Text>
                    </View>
                  );
                })}
              </View>

              {/* ── Results by Region ── */}
              {regionalData.length > 0 && (
                <View style={{ ...cardStyle, marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#0ea5e91a", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="globe-outline" size={18} color="#0ea5e9" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: c.textPrimary }}>Results by Region</Text>
                      <Text style={{ fontSize: 11, color: c.textSecondary, marginTop: 2 }}>{regionalData.length} region{regionalData.length !== 1 ? "s" : ""} participated</Text>
                    </View>
                  </View>

                  {regionalData.map((row, rowIdx) => {
                    const regionCode = row.regionCode || row.region;
                    const regionMeta = regions.find((r) => r.regionCode === regionCode) || { regionCode, regionName: regionCode, flag: "🌐" };
                    const isMyRegion = selectedRegion?.regionCode === regionCode;
                    const rv = extractOptionVotes(row);
                    const rTotal = Object.values(rv).reduce((s: number, n) => s + (n as number), 0);
                    const rSorted = options
                      .map((opt, i) => ({ ...opt, votes: rv[opt.id] || 0, pct: rTotal > 0 ? Math.round(((rv[opt.id] || 0) / rTotal) * 100) : 0, color: PALETTE[i] }))
                      .sort((a, b) => b.votes - a.votes);

                    return (
                      <View
                        key={regionCode}
                        style={{
                          borderRadius: 16,
                          borderWidth: 1.5,
                          borderColor: isMyRegion ? "#0ea5e966" : c.border,
                          backgroundColor: isMyRegion ? "#0ea5e908" : c.background,
                          padding: 14,
                          marginBottom: rowIdx < regionalData.length - 1 ? 12 : 0,
                        }}
                      >
                        {/* Region header */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: rTotal > 0 ? 12 : 0 }}>
                          <Text style={{ fontSize: 20 }}>{regionMeta.flag || "🌐"}</Text>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Text style={{ fontSize: 13, fontWeight: "700", color: c.textPrimary }}>{regionMeta.regionName || regionCode}</Text>
                              {isMyRegion && (
                                <View style={{ backgroundColor: "#0ea5e91a", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: "#0ea5e933" }}>
                                  <Text style={{ fontSize: 9, fontWeight: "700", color: "#0ea5e9" }}>YOUR REGION</Text>
                                </View>
                              )}
                            </View>
                            <Text style={{ fontSize: 11, color: c.textSecondary, marginTop: 1 }}>{regionCode}</Text>
                          </View>
                          <View style={{ backgroundColor: c.surface2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: rTotal > 0 ? "#0ea5e9" : c.textSecondary }}>
                              {rTotal > 0 ? `${rTotal.toLocaleString()} votes` : "No votes yet"}
                            </Text>
                          </View>
                        </View>

                        {/* Per-option mini bars */}
                        {rTotal > 0 && rSorted.map((opt) => {
                          const isWinner = opt.pct === Math.max(...rSorted.map((o) => o.pct)) && opt.pct > 0;
                          return (
                            <View key={opt.id} style={{ marginBottom: 8 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1 }}>
                                  {isWinner && <Ionicons name="trophy" size={11} color="#f59e0b" />}
                                  <Text style={{ fontSize: 12, color: c.textSecondary, flex: 1 }} numberOfLines={1}>{opt.text}</Text>
                                </View>
                                <Text style={{ fontSize: 11, fontWeight: "700", color: opt.color, marginLeft: 8 }}>{opt.pct}%</Text>
                              </View>
                              <View style={{ height: 5, backgroundColor: c.surface2, borderRadius: 999, overflow: "hidden" }}>
                                <View style={{ height: "100%", borderRadius: 999, width: `${opt.pct}%`, backgroundColor: opt.color }} />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Change vote */}
              {loggedIn && (
                <TouchableOpacity
                  onPress={() => { setHasVoted(false); setStep(1); }}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 16, paddingVertical: 12, marginBottom: 16 }}
                >
                  <Ionicons name="pencil-outline" size={14} color={c.textSecondary} />
                  <Text style={{ fontSize: 13, color: c.textSecondary, fontWeight: "500" }}>{t("changeVote")}</Text>
                </TouchableOpacity>
              )}

              {/* ── Comments ── */}
              <View style={cardStyle}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Ionicons name="chatbubbles-outline" size={18} color="#a855f7" />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: c.textPrimary }}>
                    {t("comments")} {comments.length > 0 ? `(${comments.length})` : ""}
                  </Text>
                </View>

                {loggedIn ? (
                  <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, marginBottom: 20 }}>
                    <View style={{ flex: 1, backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 }}>
                      <TextInput
                        style={{ color: c.textPrimary, fontSize: 13, minHeight: 36, maxHeight: 80 }}
                        placeholder={t("writeComment")}
                        placeholderTextColor={c.textSecondary}
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        maxLength={200}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={handlePostComment}
                      disabled={!commentText.trim() || isPosting}
                      style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center", opacity: !commentText.trim() || isPosting ? 0.5 : 1 }}
                    >
                      {isPosting ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={16} color="white" />}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/login")}
                    style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#7c3aed1a", borderWidth: 1, borderColor: "#7c3aed33", borderRadius: 14, padding: 12, marginBottom: 16 }}
                  >
                    <Ionicons name="log-in-outline" size={16} color="#a855f7" />
                    <Text style={{ color: "#a855f7", fontSize: 13, fontWeight: "500" }}>{t("loginToComment")}</Text>
                  </TouchableOpacity>
                )}

                {commentsLoading ? (
                  <ActivityIndicator color="#a855f7" size="small" />
                ) : comments.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 24 }}>
                    <Ionicons name="chatbubble-outline" size={32} color={c.textSecondary} />
                    <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 8 }}>{t("noComments")}</Text>
                  </View>
                ) : (
                  comments.map((cm, i) => (
                    <View key={cm.id ?? i} style={{ borderBottomWidth: i < comments.length - 1 ? 1 : 0, borderBottomColor: c.border + "80", marginBottom: i < comments.length - 1 ? 14 : 0, paddingBottom: i < comments.length - 1 ? 14 : 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: "#7c3aed26", alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontSize: 12, fontWeight: "700", color: "#a855f7" }}>
                            {(cm.userName || cm.user?.name || "U")[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, fontWeight: "600", color: c.textPrimary }}>{cm.userName || cm.user?.name || "Anonymous"}</Text>
                          {cm.createdAt && <Text style={{ fontSize: 10, color: c.textSecondary }}>{timeAgo(new Date(cm.createdAt), i18n.language)}</Text>}
                        </View>
                      </View>
                      <Text style={{ fontSize: 13, color: c.textSecondary, lineHeight: 20, marginLeft: 36 }}>{cm.text || cm.content}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
