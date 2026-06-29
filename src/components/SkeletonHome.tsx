import { useEffect, useRef } from "react";
import { Animated, View, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../utils/theme";
import SkeletonPollCard from "./SkeletonPollCard";
import BrandName from "../../src/components/BrandName";

/** Animated shimmer bar used in the header section */
function ShimBar({ w, h = 14, r = 8, style }: { w: number | string; h?: number; r?: number; style?: any }) {
  const { isDark } = useTheme();
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
  return (
    <Animated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: shimmer, opacity }, style]} />
  );
}

export default function SkeletonHome() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + subtitle */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
         <View style={{ flex: 1 }}>
          <BrandName className="text-3xl font-extrabold text-text-primary" />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 13,
              marginTop: 4,
              opacity: 0.5,
            }}
          >
            Discover what people are voting on
          </Text>
          </View>
        </View>

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
              <ShimBar w={22} h={22} r={6} />
              <ShimBar w="70%" h={22} r={8} />
              <ShimBar w="85%" h={11} r={6} />
            </View>
          ))}
        </View>

        {/* Search bar */}
        <ShimBar w="100%" h={48} r={16} style={{ marginBottom: 12 }} />

        {/* Category chips */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {[80, 100, 70, 90, 85].map((w, i) => (
            <ShimBar key={i} w={w} h={34} r={999} />
          ))}
        </View>

        {/* Result count */}
        <ShimBar w={130} h={12} r={6} style={{ marginBottom: 14 }} />

        {/* Poll card skeletons */}
        <SkeletonPollCard />
        <SkeletonPollCard />
        <SkeletonPollCard />
      </ScrollView>
    </SafeAreaView>
  );
}