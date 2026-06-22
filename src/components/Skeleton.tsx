import { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { useTheme } from "../utils/theme";

/** A single shimmer bar. width/height/borderRadius are passed as style. */
export function ShimmerBox({
  width,
  height,
  borderRadius = 10,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) {
  const { colors, isDark } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const base = isDark ? "#2e2e4a" : "#ddd6fe";
  const highlight = isDark ? "#3d3d60" : "#c4b5fd";

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, opacity },
        { backgroundColor: highlight },
        style,
      ]}
    />
  );
}

/** Skeleton for a single PollCard */
export function PollCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
        overflow: "hidden",
      }}
    >
      {/* Top accent line */}
      <View style={{ height: 2, backgroundColor: "#7c3aed22" }} />
      <View style={{ padding: 16, gap: 10 }}>
        {/* Badges row */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <ShimmerBox width={64} height={18} borderRadius={999} />
          <ShimmerBox width={48} height={18} borderRadius={999} />
        </View>
        {/* Title */}
        <ShimmerBox width="90%" height={16} borderRadius={8} />
        <ShimmerBox width="70%" height={16} borderRadius={8} />
        {/* Mini bars */}
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 10,
          }}
        >
          {[100, 75, 50].map((w, i) => (
            <View key={i} style={{ gap: 5 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <ShimmerBox width={`${w - 10}%`} height={11} borderRadius={6} />
                <ShimmerBox width={28} height={11} borderRadius={6} />
              </View>
              <ShimmerBox width="100%" height={6} borderRadius={999} />
            </View>
          ))}
        </View>
        {/* Footer */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <ShimmerBox width={90} height={28} borderRadius={8} />
          <ShimmerBox width={72} height={32} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

/** Skeleton for the Trending home header (stats + search + category chips) */
export function HomeHeaderSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 0 }}>
      {/* Brand name */}
      <ShimmerBox width={200} height={30} borderRadius={10} style={{ marginBottom: 6 }} />
      <ShimmerBox width={160} height={14} borderRadius={6} style={{ marginBottom: 20 }} />

      {/* Stats cards */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        {[0, 1].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 8,
            }}
          >
            <ShimmerBox width={22} height={22} borderRadius={6} />
            <ShimmerBox width="70%" height={22} borderRadius={8} />
            <ShimmerBox width="90%" height={11} borderRadius={6} />
          </View>
        ))}
      </View>

      {/* Search bar */}
      <ShimmerBox width="100%" height={48} borderRadius={16} style={{ marginBottom: 12 }} />

      {/* Category chips */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {[80, 100, 70, 90].map((w, i) => (
          <ShimmerBox key={i} width={w} height={34} borderRadius={999} />
        ))}
      </View>

      {/* Result count line */}
      <ShimmerBox width={120} height={12} borderRadius={6} style={{ marginBottom: 12 }} />
    </View>
  );
}
