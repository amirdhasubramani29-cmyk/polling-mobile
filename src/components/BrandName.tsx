import { Text, TextProps } from "react-native";

interface BrandNameProps extends TextProps {
  scale?: number;
}

export default function BrandName({ scale = 1.25, style, ...props }: BrandNameProps) {
  return (
    <Text
      {...props}
      style={[
        {
          color: "#7c3aed",
          lineHeight: 46,
        },
        style,
      ]}
    >
      trending
      <Text
        style={{
          fontSize: 32 * scale,
          color: "#a855f7",
          fontWeight: "bold",
        }}
      >
        p
      </Text>
      olls
    </Text>
  );
}
