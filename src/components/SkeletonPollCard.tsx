import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { useTheme } from "../utils/theme";

/** Animated shimmer rectangle — adapts to dark/light theme */
export default function SkeletonPollCard() {
  const { colors, isDark } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  const shimmer = isDark ? "#3d3d60" : "#c4b5fd";

  // Wrap in a plain View so 'width' can be a string (e.g. '88%');
  // the Animated.View inside only carries the opacity animation.
  const Bar = ({ w, h = 14, r = 8 }: { w: number | string; h?: number; r?: number }) => (
    <View style={{ width: w as any, height: h, borderRadius: r, overflow: "hidden" }}>
      <Animated.View style={{ flex: 1, backgroundColor: shimmer, opacity }} />
    </View>
  );

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
        {/* Badge row */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Bar w={64} h={18} r={999} />
          <Bar w={48} h={18} r={999} />
        </View>
        {/* Title lines */}
        <Bar w="88%" h={15} />
        <Bar w="65%" h={15} />
        {/* Mini bars block */}
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
          {[95, 72, 50].map((pct, i) => (
            <View key={i} style={{ gap: 5 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Bar w={`${pct - 10}%`} h={11} />
                <Bar w={26} h={11} />
              </View>
              <Bar w="100%" h={6} r={999} />
            </View>
          ))}
        </View>
        {/* Footer */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Bar w={88} h={28} r={8} />
          <Bar w={72} h={32} r={12} />
        </View>
      </View>
    </View>
  );
}