import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../utils/theme";

interface OptionCardProps {
  text: string;
  isSelected: boolean;
  isPrevVote?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export default function OptionCard({
  text,
  isSelected,
  isPrevVote,
  onPress,
  disabled,
}: OptionCardProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    !disabled &&
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 25 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 25 }).start();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={!disabled ? onPress : undefined}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          padding: 14,
          borderRadius: 16,
          borderWidth: 2,
          marginBottom: 10,
          borderColor: isSelected ? "#7c3aed" : colors.border,
          backgroundColor: isSelected ? "#7c3aed14" : colors.surface,
        }}
      >
        {/* Radio circle */}
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            alignItems: "center",
            justifyContent: "center",
            borderColor: isSelected ? "#7c3aed" : colors.border,
            backgroundColor: isSelected ? "#7c3aed" : "transparent",
          }}
        >
          {isSelected && <Ionicons name="checkmark" size={12} color="white" />}
        </View>

        {/* Option text */}
        <Text
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: "500",
            color: isSelected ? colors.textPrimary : colors.textSecondary,
          }}
        >
          {text}
        </Text>

        {/* Prev-vote badge */}
        {isPrevVote && !isSelected && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#10b98133",
              backgroundColor: "#10b9810d",
            }}
          >
            <Ionicons name="checkmark" size={10} color="#10b981" />
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#10b981" }}>Prev.</Text>
          </View>
        )}

        {isSelected && (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#7c3aed",
            }}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}
