import { useState, useEffect, useRef } from "react";
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

const PALETTE = ["#8b5cf6", "#d946ef", "#0ea5e9", "#10b981"];

export default function PollDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
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

  // Comments state
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

  useEffect(() => {
    loadComments();
  }, [id]);

  async function handleShare() {
    try {
      await Share.share({
        message: `${poll.title}\n\nVote now:\nhttps://trendingpolls.in/poll/${poll.id}`,
      });
    } catch (error) {
      console.error("Share failed", error);
    }
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

  async function handlePostComment() {
    if (!commentText.trim()) return;
    if (!loggedIn) {
      router.push("/(auth)/login");
      return;
    }
    setIsPosting(true);
    try {
      const userId = await getCurrentUserId();
      const userJson = await SecureStore.getItemAsync("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const res = await apiFetch(`/api/comments/${id}`, {
        method: "POST",
        body: JSON.stringify({
          userId,
          userName: user?.name,
          text: commentText.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setCommentText("");
      await loadComments();
    } catch (e) {
      Alert.alert("Error", "Failed to post comment");
    } finally {
      setIsPosting(false);
    }
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
    } catch (e) {
      Alert.alert("Error", "Failed to submit vote");
    } finally {
      setIsVoting(false);
    }
  }

  async function handleReact(reaction: "like" | "dislike") {
    if (!loggedIn) {
      Alert.alert("Login Required", "Sign in to like or dislike this poll.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Login",
          onPress: () => router.push("/(auth)/login"),
        },
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

  if (loading)
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#a855f7" size="large" />
      </SafeAreaView>
    );

  if (!poll)
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-text-primary font-bold mt-3">Poll not found</Text>
      </SafeAreaView>
    );

  // Build options from flat fields (option1, option2, option3, option4)
  const options = [
    { id: "1", text: poll.option1, votes: poll.votes1 ?? 0 },
    { id: "2", text: poll.option2, votes: poll.votes2 ?? 0 },
    { id: "3", text: poll.option3, votes: poll.votes3 ?? 0 },
    { id: "4", text: poll.option4, votes: poll.votes4 ?? 0 },
  ].filter((o) => o.text?.trim());

  const total = options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Poll card header */}
          <View className="bg-surface rounded-3xl border border-border p-5 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                <Ionicons name="time-outline" size={11} color="#a855f7" />
                <Text className="text-xs text-accent">{timeAgo(new Date(poll.createdAt), i18n.language)}</Text>
              </View>
              <View className="flex-row items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full">
                <Ionicons name="people-outline" size={11} color="#a855f7" />
                <Text className="text-xs font-bold text-accent">{total.toLocaleString()}</Text>
              </View>
            </View>
            <Text className="text-xl font-extrabold text-text-primary leading-snug mb-2">{poll.title}</Text>
            {poll.description && (
              <Text className="text-text-secondary text-sm leading-relaxed">{poll.description}</Text>
            )}
            <View className="flex-row items-center justify-between mt-3 mb-4">
              <View className="flex-row items-center gap-5">
                <TouchableOpacity className="flex-row items-center" onPress={() => handleReact("like")}>
                  <Ionicons name="thumbs-up-outline" size={18} color="#22c55e" />
                  <Text className="ml-1 text-text-secondary">{likes}</Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center" onPress={() => handleReact("dislike")}>
                  <Ionicons name="thumbs-down-outline" size={18} color="#ef4444" />
                  <Text className="ml-1 text-text-secondary">{dislikes}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleShare}>
                <Ionicons name="share-social-outline" size={20} color="#a855f7" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Already voted banner */}
          {hasVoted && (
            <View className="flex-row items-center gap-3 bg-warning/8 border border-warning/25 rounded-2xl p-4 mb-4">
              <Ionicons name="checkmark-circle" size={20} color="#f59e0b" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-amber-400">{t("alreadyVoted")}</Text>
                <Text className="text-xs text-amber-400/70">{t("resultsBelow")}</Text>
              </View>
              {loggedIn && (
                <TouchableOpacity onPress={() => setHasVoted(false)}>
                  <Ionicons name="pencil-outline" size={16} color="#f59e0b" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Voting section */}
          {!hasVoted && (
            <View className="bg-surface rounded-3xl border border-border p-5 mb-4">
              <View className="flex-row items-center gap-3 mb-4">
                <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center">
                  <Ionicons name="sparkles-outline" size={16} color="#a855f7" />
                </View>
                <Text className="text-base font-bold text-text-primary">{t("castYourVote")}</Text>
              </View>
              {options.length === 0 ? (
                <Text className="text-text-secondary text-sm text-center py-4">No options available</Text>
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
                className="bg-primary rounded-xl py-3.5 items-center mt-2"
                style={{ opacity: !selectedOption || isVoting ? 0.5 : 1 }}
              >
                <Text className="text-white font-bold">{isVoting ? t("loading") : t("submitVote")}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Results */}
          {hasVoted && options.length > 0 && (
            <View className="bg-surface rounded-3xl border border-border p-5 mb-4">
              {/* Your vote banner */}
              {selectedOption &&
                (() => {
                  const myOpt = options.find((o) => o.id === selectedOption);
                  return myOpt ? (
                    <View className="flex-row items-center gap-3 bg-success/8 border border-success/25 rounded-2xl p-3 mb-4">
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      <View>
                        <Text className="text-xs font-semibold text-success">{t("yourVote")}</Text>
                        <Text className="text-sm font-bold text-green-300">{myOpt.text}</Text>
                      </View>
                    </View>
                  ) : null;
                })()}

              <Text className="text-base font-bold text-text-primary mb-4">{t("pollResults")}</Text>
              {[...options]
                .sort((a, b) => b.votes - a.votes)
                .map((opt, i) => {
                  const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                  const isMyVote = opt.id === selectedOption;
                  const isWinner = i === 0 && opt.votes > 0;
                  return (
                    <View
                      key={opt.id}
                      className={`mb-3 p-3 rounded-2xl border-2 ${isMyVote ? "border-success/30 bg-success/5" : "border-transparent"}`}
                    >
                      <View className="flex-row items-center justify-between mb-1.5">
                        <View className="flex-row items-center gap-2 flex-1">
                          {isWinner && <Ionicons name="trophy" size={14} color={PALETTE[0]} />}
                          <Text
                            className={`text-sm font-medium flex-1 ${isMyVote ? "font-semibold text-text-primary" : "text-text-secondary"}`}
                            numberOfLines={2}
                          >
                            {opt.text}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          {isMyVote && (
                            <View className="flex-row items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-success/15 border border-success/25">
                              <Ionicons name="checkmark" size={10} color="#10b981" />
                              <Text className="text-[10px] font-bold text-success">Your vote</Text>
                            </View>
                          )}
                          <Text className="text-xs font-bold text-text-secondary">{opt.votes.toLocaleString()}</Text>
                          <Text
                            className="text-xs font-bold w-9 text-right"
                            style={{ color: PALETTE[i % PALETTE.length] }}
                          >
                            {pct}%
                          </Text>
                        </View>
                      </View>
                      <View className="h-2.5 bg-surface-2 rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: PALETTE[i % PALETTE.length],
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              {/* Change vote */}
              {loggedIn && (
                <TouchableOpacity
                  onPress={() => setHasVoted(false)}
                  className="flex-row items-center justify-center gap-2 border border-border rounded-xl py-2.5 mt-2"
                >
                  <Ionicons name="pencil-outline" size={14} color="#9090b0" />
                  <Text className="text-text-secondary text-sm font-medium">{t("changeVote")}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Comments */}
          <View className="bg-surface rounded-3xl border border-border p-5 mb-4">
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="chatbubbles-outline" size={18} color="#a855f7" />
              <Text className="text-base font-bold text-text-primary">
                {t("comments")} {comments.length > 0 ? `(${comments.length})` : ""}
              </Text>
            </View>

            {/* Post comment input */}
            {loggedIn ? (
              <View className="flex-row items-end gap-2 mb-5">
                <View className="flex-1 bg-background border border-border rounded-2xl px-4 py-3">
                  <TextInput
                    className="text-text-primary text-sm"
                    placeholder={t("writeComment")}
                    placeholderTextColor="#6060a0"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    maxLength={200}
                    style={{
                      minHeight: 40,
                      maxHeight: 80,
                    }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handlePostComment}
                  disabled={!commentText.trim() || isPosting}
                  className="w-11 h-11 rounded-2xl bg-primary items-center justify-center"
                  style={{
                    opacity: !commentText.trim() || isPosting ? 0.5 : 1,
                  }}
                >
                  {isPosting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="send" size={16} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
                className="flex-row items-center gap-2 bg-primary/10 border border-primary/20 rounded-2xl p-3 mb-4"
              >
                <Ionicons name="log-in-outline" size={16} color="#a855f7" />
                <Text className="text-accent text-sm font-medium">{t("loginToComment")}</Text>
              </TouchableOpacity>
            )}

            {/* Comments list */}
            {commentsLoading ? (
              <ActivityIndicator color="#a855f7" size="small" />
            ) : comments.length === 0 ? (
              <View className="items-center py-6">
                <Ionicons name="chatbubble-outline" size={32} color="#6060a0" />
                <Text className="text-text-secondary text-sm mt-2">{t("noComments")}</Text>
              </View>
            ) : (
              comments.map((c, i) => (
                <View
                  key={c.id ?? i}
                  className={`${i < comments.length - 1 ? "border-b border-border mb-3 pb-3" : ""}`}
                >
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <View className="w-7 h-7 rounded-full bg-primary/20 items-center justify-center">
                      <Text className="text-xs font-bold text-accent">
                        {(c.userName || c.user?.name || "U")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-text-primary">
                        {c.userName || c.user?.name || "Anonymous"}
                      </Text>
                      {c.createdAt && (
                        <Text className="text-[10px] text-text-secondary">
                          {timeAgo(new Date(c.createdAt), i18n.language)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text className="text-sm text-text-secondary leading-relaxed ml-9">{c.text || c.content}</Text>
                  {c.replies?.length > 0 && (
                    <View className="ml-9 mt-3 gap-3">
                      {c.replies.map((reply: any) => (
                        <View key={reply.id} className="border-l-2 border-primary/20 pl-3">
                          <View className="flex-row items-center gap-2 mb-1">
                            <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center">
                              <Text className="text-[10px] font-bold text-accent">
                                {(reply.userName || "U")[0].toUpperCase()}
                              </Text>
                            </View>

                            <Text className="text-xs font-semibold text-text-primary">
                              {reply.userName || "Anonymous"}
                            </Text>
                          </View>

                          <Text className="text-sm text-text-secondary">{reply.text}</Text>
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
