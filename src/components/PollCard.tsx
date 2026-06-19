import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { timeAgo } from "../utils/timeAgo";
import i18n from "../i18n";
import { useTheme } from "../utils/theme";
import { getCategoryColor } from "../../src/utils/categoryColors";

const PALETTE = ["#8b5cf6", "#d946ef", "#0ea5e9", "#10b981"];

interface PollCardProps {
  poll: any;
  showTrending?: boolean;
}

export default function PollCard({ poll, showTrending = false }: PollCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 20 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const opts = [
    { text: poll.option1, votes: poll.votes1 ?? 0 },
    { text: poll.option2, votes: poll.votes2 ?? 0 },
    { text: poll.option3, votes: poll.votes3 ?? 0 },
    { text: poll.option4, votes: poll.votes4 ?? 0 },
  ].filter((o) => o.text);

  const total = opts.reduce((s, o) => s + o.votes, 0);
  const sorted = [...opts].sort((a, b) => b.votes - a.votes);
  const href = poll.pollType === "REGIONAL" ? `/regional/${poll.id}` : `/poll/${poll.id}`;
  const categories: string[] = poll.categoryNames?.length ? poll.categoryNames : [t("uncategorized")];

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={onPressIn} onPressOut={onPressOut} onPress={() => router.push(href as any)}>
      <Animated.View
        style={{
          transform: [{ scale }],
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
          overflow: "hidden",
        }}
      >
        {/* Top accent line */}
        <View style={{ height: 2, width: "100%", backgroundColor: "#7c3aed33" }} />

        <View style={{ padding: 16 }}>
          {/* Category badges + time */}
          <View style={{ marginBottom: 8, gap: 4 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {categories.map((cat) => {
                const color = getCategoryColor(cat);
                return (
                  <View
                    key={cat}
                    style={{
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 2,
                      borderWidth: 1,
                      borderColor: color,
                      backgroundColor: color + "20",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "600", color }} numberOfLines={1}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </View>
                );
              })}
              {showTrending && poll.totalVotes > 100 && (
                <View
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 2,
                    borderWidth: 1,
                    borderColor: "#f59e0b66",
                    backgroundColor: "#f59e0b26",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Ionicons name="flame" size={10} color="#f59e0b" />
                  <Text style={{ fontSize: 11, fontWeight: "600", color: "#fbbf24" }}>{t("trending")}</Text>
                </View>
              )}
            </View>
            {/* Time row */}
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: colors.surface2,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Ionicons name="time-outline" size={11} color={colors.textSecondary} />
                <Text style={{ fontSize: 11, color: colors.textSecondary }} numberOfLines={1}>
                  {timeAgo(new Date(poll.createdAt), i18n.language)}
                </Text>
              </View>
            </View>
          </View>

          {/* Title */}
          <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 15, marginBottom: 4, lineHeight: 20 }} numberOfLines={2}>
            {poll.title}
          </Text>
          {poll.description ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }} numberOfLines={2}>
              {poll.description}
            </Text>
          ) : (
            <View style={{ marginBottom: 12 }} />
          )}

          {/* Mini bars */}
          {total > 0 ? (
            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
                gap: 8,
              }}
            >
              {sorted.slice(0, 3).map((o, i) => {
                const pct = Math.round((o.votes / total) * 100);
                return (
                  <View key={i}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, flex: 1, marginRight: 8 }} numberOfLines={1}>
                        {o.text}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSecondary }}>{pct}%</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.surface2, borderRadius: 999, overflow: "hidden" }}>
                      <View
                        style={{
                          height: "100%",
                          borderRadius: 999,
                          width: `${pct}%`,
                          backgroundColor: PALETTE[i % PALETTE.length],
                        }}
                      />
                    </View>
                  </View>
                );
              })}
              {sorted.length > 3 && (
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  +{sorted.length - 3} {t("moreOptions")}
                </Text>
              )}
            </View>
          ) : (
            opts.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {opts.map((o, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: colors.surface2,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: colors.textSecondary }}>{o.text}</Text>
                  </View>
                ))}
              </View>
            )
          )}

          {/* Footer */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "#7c3aed1a",
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Ionicons name="people-outline" size={13} color="#a855f7" />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#a855f7" }}>{poll.totalVotes?.toLocaleString()}</Text>
              <Text style={{ fontSize: 11, color: "#a855f780" }}>{t("votes")}</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "#7c3aed",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>{t("vote")}</Text>
              <Ionicons name="chevron-forward" size={12} color="white" />
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}
