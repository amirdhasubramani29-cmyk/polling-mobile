import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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

export default function PollDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();

  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState("");
  const [originalVoted, setOriginalVoted] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => { isLoggedIn().then(setLoggedIn); }, []);

  useEffect(() => {
    async function load() {
      try {
        const [pollRes, reactRes] = await Promise.all([
          apiFetch(`/api/polls/${id}`),
          apiFetch(`/api/pollsreaction/${id}/reactions`),
        ]);
        const pollData = await pollRes.json();
        setPoll(pollData);
        if (reactRes.ok) {
          const rd = await reactRes.json();
          setLikes(rd.likes || 0);
          setDislikes(rd.dislikes || 0);
        }
        const userId = await getCurrentUserId();
        if (userId) {
          const voteRes = await apiFetch(`/api/polls/${id}/myvote?userId=${encodeURIComponent(userId)}`);
          if (voteRes.ok) {
            const vd = await voteRes.json();
            if (vd.voted) {
              setHasVoted(true);
              const vid = String(vd.selectedOption);
              setSelectedOption(vid);
              setOriginalVoted(vid);
            }
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

  useEffect(() => { loadComments(); }, [id]);

  async function handleShare() {
    try {
      await Share.share({ message: `${poll.title}\n\nVote now:\nhttps://trendingpolls.in/poll/${poll.id}` });
    } catch (e) { console.error("Share failed", e); }
  }

  async function loadComments() {
    setCommentsLoading(true);
    try {
      const res = await apiFetch(`/api/comments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : data.comments || []);
      }
    } catch (e) { console.error(e); }
    finally { setCommentsLoading(false); }
  }

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
    } catch { Alert.alert("Error", "Failed to post comment"); }
    finally { setIsPosting(false); }
  }

  async function handleVote() {
    if (!selectedOption) return;
    setIsVoting(true);
    try {
      const userId = await getCurrentUserId();
      const res = await apiFetch(`/api/polls/${id}/vote`, {
        method: "POST",
        body: JSON.stringify({ selectedOption, userId }),
      });
      if (!res.ok) throw new Error("Vote failed");
      const updated = await res.json();
      setPoll(updated);
      setHasVoted(true);
      setOriginalVoted(selectedOption);
    } catch { Alert.alert("Error", "Failed to submit vote"); }
    finally { setIsVoting(false); }
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

  const c = colors;

  const card = {
    backgroundColor: c.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.border,
    padding: 20,
    marginBottom: 16,
  };

  if (loading)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#a855f7" size="large" />
      </SafeAreaView>
    );

  if (!poll)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={{ color: c.textPrimary, fontWeight: "700", marginTop: 12 }}>Poll not found</Text>
      </SafeAreaView>
    );

  const options = [
    { id: "1", text: poll.option1, votes: poll.votes1 ?? 0 },
    { id: "2", text: poll.option2, votes: poll.votes2 ?? 0 },
    { id: "3", text: poll.option3, votes: poll.votes3 ?? 0 },
    { id: "4", text: poll.option4, votes: poll.votes4 ?? 0 },
  ].filter((o) => o.text?.trim());

  const total = options.reduce((s, o) => s + o.votes, 0);
  const sorted = [...options].sort((a, b) => b.votes - a.votes);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <SafeAreaView edges={["left", "right", "bottom"]} style={{ flex: 1, backgroundColor: c.background }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

          {/* ── Poll header card ── */}
          <View style={card}>
            {/* Meta row */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#7c3aed1a", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: "#7c3aed30" }}>
                <Ionicons name="time-outline" size={11} color="#a855f7" />
                <Text style={{ fontSize: 11, color: "#a855f7" }}>{timeAgo(new Date(poll.createdAt), i18n.language)}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#7c3aed1a", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: "#7c3aed30" }}>
                <Ionicons name="people-outline" size={11} color="#a855f7" />
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#a855f7" }}>{total.toLocaleString()}</Text>
              </View>
            </View>

            <Text style={{ fontSize: 20, fontWeight: "800", color: c.textPrimary, lineHeight: 28, marginBottom: 8 }}>{poll.title}</Text>
            {poll.description && <Text style={{ fontSize: 13, color: c.textSecondary, lineHeight: 20 }}>{poll.description}</Text>}

            {/* Reactions + share */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
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

          {/* ── Already voted banner ── */}
          {hasVoted && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#f59e0b14", borderWidth: 1, borderColor: "#f59e0b33", borderRadius: 16, padding: 14, marginBottom: 16 }}>
              <Ionicons name="checkmark-circle" size={20} color="#f59e0b" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#fbbf24" }}>{t("alreadyVoted")}</Text>
                <Text style={{ fontSize: 11, color: "#fbbf2499" }}>{t("resultsBelow")}</Text>
              </View>
              {loggedIn && (
                <TouchableOpacity onPress={() => setHasVoted(false)}>
                  <Ionicons name="pencil-outline" size={16} color="#f59e0b" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Vote section ── */}
          {!hasVoted && (
            <View style={card}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#7c3aed1a", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="sparkles-outline" size={17} color="#a855f7" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: c.textPrimary }}>{t("castYourVote")}</Text>
              </View>
              {options.length === 0 ? (
                <Text style={{ color: c.textSecondary, fontSize: 13, textAlign: "center", paddingVertical: 16 }}>No options available</Text>
              ) : (
                options.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    text={opt.text}
                    isSelected={selectedOption === opt.id}
                    isPrevVote={originalVoted === opt.id}
                    onPress={() => setSelectedOption(opt.id)}
                  />
                ))
              )}
              <TouchableOpacity
                onPress={handleVote}
                disabled={!selectedOption || isVoting}
                style={{ backgroundColor: "#7c3aed", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 8, opacity: !selectedOption || isVoting ? 0.5 : 1 }}
              >
                {isVoting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>{t("submitVote")}</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Results ── */}
          {hasVoted && options.length > 0 && (
            <View style={card}>
              {/* Your vote */}
              {selectedOption && (() => {
                const myOpt = options.find((o) => o.id === selectedOption);
                return myOpt ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#10b9811a", borderWidth: 1, borderColor: "#10b98133", borderRadius: 14, padding: 12, marginBottom: 16 }}>
                    <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#10b981" }}>{t("yourVote")}</Text>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#34d399" }}>{myOpt.text}</Text>
                    </View>
                  </View>
                ) : null;
              })()}

              <Text style={{ fontSize: 15, fontWeight: "700", color: c.textPrimary, marginBottom: 16 }}>{t("pollResults")}</Text>
              {sorted.map((opt, i) => {
                const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                const isMyVote = opt.id === selectedOption;
                const isWinner = i === 0 && opt.votes > 0;
                const barColor = PALETTE[options.findIndex((o) => o.id === opt.id) % PALETTE.length];
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
                        <Text
                          style={{ fontSize: 13, fontWeight: isMyVote ? "600" : "400", color: isMyVote ? c.textPrimary : c.textSecondary, flex: 1 }}
                          numberOfLines={2}
                        >
                          {opt.text}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {isMyVote && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: "#10b98120", borderWidth: 1, borderColor: "#10b98133" }}>
                            <Ionicons name="checkmark" size={9} color="#10b981" />
                            <Text style={{ fontSize: 9, fontWeight: "700", color: "#10b981" }}>Your vote</Text>
                          </View>
                        )}
                        <Text style={{ fontSize: 11, color: c.textSecondary }}>{opt.votes.toLocaleString()}</Text>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: barColor, minWidth: 36, textAlign: "right" }}>{pct}%</Text>
                      </View>
                    </View>
                    <View style={{ height: 8, backgroundColor: c.surface2, borderRadius: 999, overflow: "hidden" }}>
                      <View style={{ height: "100%", borderRadius: 999, width: `${pct}%`, backgroundColor: barColor }} />
                    </View>
                  </View>
                );
              })}

              {/* Change vote */}
              {loggedIn && (
                <TouchableOpacity
                  onPress={() => setHasVoted(false)}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: c.surface2, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 10, marginTop: 4 }}
                >
                  <Ionicons name="pencil-outline" size={14} color={c.textSecondary} />
                  <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: "500" }}>{t("changeVote")}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Comments ── */}
          <View style={card}>
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
                <View
                  key={cm.id ?? i}
                  style={{ borderBottomWidth: i < comments.length - 1 ? 1 : 0, borderBottomColor: c.border + "80", marginBottom: i < comments.length - 1 ? 14 : 0, paddingBottom: i < comments.length - 1 ? 14 : 0 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: "#7c3aed26", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#a855f7" }}>
                        {(cm.userName || cm.user?.name || "U")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: c.textPrimary }}>{cm.userName || cm.user?.name || "Anonymous"}</Text>
                      {cm.createdAt && (
                        <Text style={{ fontSize: 10, color: c.textSecondary }}>{timeAgo(new Date(cm.createdAt), i18n.language)}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, color: c.textSecondary, lineHeight: 20, marginLeft: 36 }}>{cm.text || cm.content}</Text>
                  {cm.replies?.length > 0 && (
                    <View style={{ marginLeft: 36, marginTop: 10, gap: 10 }}>
                      {cm.replies.map((reply: any) => (
                        <View key={reply.id} style={{ borderLeftWidth: 2, borderLeftColor: "#7c3aed33", paddingLeft: 12 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <View style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: "#7c3aed1a", alignItems: "center", justifyContent: "center" }}>
                              <Text style={{ fontSize: 10, fontWeight: "700", color: "#a855f7" }}>{(reply.userName || "U")[0].toUpperCase()}</Text>
                            </View>
                            <Text style={{ fontSize: 11, fontWeight: "600", color: c.textPrimary }}>{reply.userName || "Anonymous"}</Text>
                          </View>
                          <Text style={{ fontSize: 12, color: c.textSecondary }}>{reply.text}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
