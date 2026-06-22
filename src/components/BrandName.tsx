import { Text, TextProps, View } from "react-native";
import { useTheme } from "../utils/theme";

interface BrandNameProps extends TextProps {
  size?: number;
}

/**
 * The trendingpolls logo wordmark.
 * In dark mode: "trending" is muted purple, "p" is bright violet.
 * In light mode: "trending" is deep indigo, "p" is vivid purple.
 */
export default function BrandName({ size = 30, style, ...props }: BrandNameProps) {
  const { isDark } = useTheme();

  const baseColor = isDark ? "#9d8fca" : "#4c1d95";
  const accentColor = isDark ? "#a855f7" : "#7c3aed";
  const dotColor = isDark ? "#a855f7" : "#7c3aed";

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
      {/* Icon dot */}
      {/*<View
        style={{
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: size * 0.22,
          backgroundColor: accentColor + "22",
          borderWidth: 1.5,
          borderColor: accentColor + "55",
          alignItems: "center",
          justifyContent: "center",
          marginRight: size * 0.18,
          marginBottom: 3,
        }}
      > */}
        {/* Trend arrow icon built from views */}
        {/*<View style={{ gap: 2, alignItems: "flex-end" }}>
          {[0.5, 0.75, 1].map((h, i) => (
            <View
              key={i}
              style={{
                width: size * 0.1,
                height: size * 0.1 * h,
                borderRadius: 2,
                backgroundColor: accentColor,
              }}
            />
          ))}
        </View>
      </View>*/}

      {/* Wordmark */}
      <Text
        {...props}
        style={[
          {
            fontSize: size,
            fontWeight: "800",
            color: baseColor,
            letterSpacing: -0.5,
            lineHeight: size * 1.2,
          },
          style,
        ]}
      >
        trending
        <Text style={{ color: accentColor, fontWeight: "900" }}>P</Text>
        <Text style={{ color: baseColor }}>olls</Text>
      </Text>
    </View>
  );
}
