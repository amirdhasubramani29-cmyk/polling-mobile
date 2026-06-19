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

const PALETTE = ["#8b5cf6", "#d946ef", "#0ea5e9", "#10b981"];
const STEPS = ["Region", "Vote", "Results"] as const;

export default function RegionalPollScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const [poll, setPoll] = useState<any>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0=region 1=vote 2=results
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
        setRegions(regData);

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
              const region = regData.find((r: any) => r.regionCode === vd.regionCode);
              setSelectedRegion(
                region || {
                  regionCode: vd.regionCode,
                  regionName: vd.regionCode,
                }
              );
            }
            setStep(2);
            // Load regional results
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

  async function handleShare() {
    try {
      await Share.share({
        message: `${poll.title}

  Vote now:
  https://trendingpolls.in/regional/${poll.id}`,
      });
    } catch (error) {
      console.error("Share failed", error);
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
        body: JSON.stringify({
          selectedOption,
          userId,
          regionCode: selectedRegion.regionCode,
        }),
      });
      if (!res.ok) throw new Error("Vote failed");
      const updated = await res.json();
      setPoll(updated);
      setHasVoted(true);
      setOriginalVoted(selectedOption);
      const rrRes = await apiFetch(`/api/polls/${id}/regional-results`);
      if (rrRes.ok) setRegionalData(await rrRes.json());
      setStep(2);
    } catch (e) {
      Alert.alert("Error", "Failed to submit vote");
    } finally {
      setIsVoting(false);
    }
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
        <Text className="text-text-primary">Poll not found</Text>
      </SafeAreaView>
    );

  const options = [
    { id: "1", text: poll.option1 },
    { id: "2", text: poll.option2 },
    { id: "3", text: poll.option3 },
    { id: "4", text: poll.option4 },
  ].filter((o) => o.text?.trim());

  // Overall results
  const overallTotal = options.reduce((sum, opt) => {
    return sum + regionalData.reduce((s, r) => s + (r.votes?.[`option${opt.id}`] || 0), 0);
  }, 0);
  const overallResults = options
    .map((opt, i) => {
      const votes = regionalData.reduce((s, r) => s + (r.votes?.[`option${opt.id}`] || 0), 0);
      return {
        ...opt,
        votes,
        pct: overallTotal > 0 ? Math.round((votes / overallTotal) * 100) : 0,
        color: PALETTE[i],
      };
    })
    .sort((a, b) => b.votes - a.votes);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Step progress bar */}
          <View className="flex-row items-center mb-6">
            {STEPS.map((s, i) => (
              <View key={s} className="flex-row items-center flex-1">
                <View
                  className={`w-7 h-7 rounded-full items-center justify-center ${step >= i ? "bg-primary" : "bg-surface border border-border"}`}
                >
                  {step > i ? (
                    <Ionicons name="checkmark" size={14} color="white" />
                  ) : (
                    <Text className={`text-xs font-bold ${step === i ? "text-white" : "text-text-secondary"}`}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text className={`text-xs ml-1 font-medium ${step >= i ? "text-accent" : "text-text-secondary"}`}>
                  {s}
                </Text>
                {i < STEPS.length - 1 && (
                  <View className={`flex-1 h-0.5 mx-2 ${step > i ? "bg-primary" : "bg-border"}`} />
                )}
              </View>
            ))}
          </View>

          {/* Poll title */}
          <View className="bg-surface rounded-3xl border border-border p-5 mb-4">
            <Text className="text-xl font-extrabold text-text-primary leading-snug">{poll.title}</Text>
            {poll.description && <Text className="text-text-secondary text-sm mt-1">{poll.description}</Text>}

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

          {/* Step 0: Region selection */}
          {step === 0 && (
            <View className="bg-surface rounded-3xl border border-border p-5 mb-4">
              <View className="flex-row items-center gap-3 mb-4">
                <View className="w-8 h-8 rounded-xl bg-sky-500/10 items-center justify-center">
                  <Ionicons name="map-outline" size={16} color="#0ea5e9" />
                </View>
                <Text className="text-base font-bold text-text-primary">{t("selectRegion")}</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {regions.map((r) => (
                  <TouchableOpacity
                    key={r.regionCode}
                    onPress={() => {
                      setSelectedRegion(r);
                      setStep(1);
                    }}
                    className="px-4 py-3 rounded-2xl border border-border bg-surface-2 items-center min-w-[80px]"
                  >
                    <Text className="text-lg mb-0.5">{r.flag || "🌐"}</Text>
                    <Text className="text-xs font-bold text-text-primary">{r.regionCode}</Text>
                    <Text className="text-[10px] text-text-secondary text-center mt-0.5" numberOfLines={1}>
                      {r.regionName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 1: Vote */}
          {step === 1 && !hasVoted && (
            <View className="bg-surface rounded-3xl border border-border p-5 mb-4">
              {/* Region chip */}
              <View className="flex-row items-center gap-2 mb-4">
                <View className="flex-row items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                  <Ionicons name="location-outline" size={12} color="#a855f7" />
                  <Text className="text-xs font-semibold text-accent">{selectedRegion?.regionCode}</Text>
                  <Text className="text-xs text-text-secondary">· {selectedRegion?.regionName}</Text>
                </View>
                <TouchableOpacity onPress={() => setStep(0)}>
                  <Text className="text-xs text-accent/70">Change</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-base font-bold text-text-primary mb-4">{poll.questionTitle || poll.title}</Text>
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
                className="bg-primary rounded-xl py-3.5 items-center mt-2"
                style={{ opacity: !selectedOption || isVoting ? 0.5 : 1 }}
              >
                <Text className="text-white font-bold">{isVoting ? t("loading") : t("submitVote")}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Results */}
          {step === 2 && (
            <View>
              {/* Your vote banner */}
              {selectedOption &&
                (() => {
                  const myOpt = options.find((o) => o.id === selectedOption);
                  return myOpt ? (
                    <View className="flex-row items-center gap-3 bg-success/8 border border-success/25 rounded-2xl p-4 mb-4">
                      <View className="w-9 h-9 rounded-xl bg-success/15 items-center justify-center">
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-success">{t("yourVote")}</Text>
                        <Text className="text-sm font-bold text-green-300">{myOpt.text}</Text>
                      </View>
                      <Text className="text-xs text-success/60">See results below</Text>
                    </View>
                  ) : null;
                })()}

              {/* Stats */}
              <View className="flex-row gap-3 mb-4">
                {[
                  {
                    icon: "globe-outline",
                    val: String(poll.availableRegions?.length || regions.length || 0),
                    label: t("regionParticipating"),
                    color: "#0ea5e9",
                  },
                  {
                    icon: "people-outline",
                    val: (poll.totalVotes || 0).toLocaleString(),
                    label: t("totalVotes"),
                    color: "#8b5cf6",
                  },
                ].map((s, i) => (
                  <View key={i} className="flex-1 bg-surface rounded-2xl p-3.5 border border-border items-center">
                    <Ionicons name={s.icon as any} size={18} color={s.color} />
                    <Text className="text-xl font-extrabold mt-1" style={{ color: s.color }}>
                      {s.val}
                    </Text>
                    <Text className="text-[10px] text-text-secondary text-center mt-0.5">{s.label}</Text>
                  </View>
                ))}
              </View>

              {/* Overall results */}
              <View className="bg-surface rounded-3xl border border-border p-5 mb-4">
                <Text className="text-base font-bold text-text-primary mb-4">{t("overallResults")}</Text>
                {overallResults.map((opt, i) => {
                  const isMyVote = opt.id === selectedOption;
                  const isWinner = i === 0 && opt.votes > 0;
                  return (
                    <View
                      key={opt.id}
                      className={`mb-3 p-3 rounded-2xl border-2 ${isMyVote ? "border-success/30 bg-success/5" : "border-transparent"}`}
                    >
                      <View className="flex-row items-center justify-between mb-1.5">
                        <View className="flex-row items-center gap-2 flex-1">
                          {isWinner && <Ionicons name="trophy" size={13} color="#f59e0b" />}
                          <Text className="text-sm font-medium text-text-secondary flex-1" numberOfLines={1}>
                            {opt.text}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                          {isMyVote && (
                            <View className="flex-row items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-success/15 border border-success/25">
                              <Ionicons name="checkmark" size={9} color="#10b981" />
                              <Text className="text-[9px] font-bold text-success">Your vote</Text>
                            </View>
                          )}
                          <Text className="text-xs font-bold" style={{ color: opt.color }}>
                            {opt.pct}%
                          </Text>
                        </View>
                      </View>
                      <View className="h-2 bg-surface-2 rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${opt.pct}%`,
                            backgroundColor: opt.color,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Change vote */}
              {loggedIn && (
                <TouchableOpacity
                  onPress={() => {
                    setHasVoted(false);
                    setStep(1);
                  }}
                  className="flex-row items-center justify-center gap-2 bg-surface border border-border rounded-2xl py-3 mb-4"
                >
                  <Ionicons name="pencil-outline" size={14} color="#9090b0" />
                  <Text className="text-text-secondary text-sm font-medium">{t("changeVote")}</Text>
                </TouchableOpacity>
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

            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
