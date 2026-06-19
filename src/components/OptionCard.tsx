import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useRef } from "react";
import { Ionicons } from "@expo/vector-icons";

interface OptionCardProps {
  text: string;
  isSelected: boolean;
  isPrevVote?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export default function OptionCard({ text, isSelected, isPrevVote, onPress, disabled }: OptionCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    !disabled &&
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 25,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
    }).start();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={!disabled ? onPress : undefined}
    >
      <Animated.View
        style={{ transform: [{ scale }] }}
        className={`flex-row items-center gap-3 p-4 rounded-2xl border-2 mb-3 ${
          isSelected ? "border-primary bg-primary/8" : "border-border bg-surface"
        }`}
      >
        {/* Radio circle */}
        <View
          className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
            isSelected ? "border-primary bg-primary" : "border-border"
          }`}
        >
          {isSelected && <Ionicons name="checkmark" size={12} color="white" />}
        </View>

        {/* Option text */}
        <Text className={`flex-1 text-sm font-medium ${isSelected ? "text-text-primary" : "text-text-secondary"}`}>
          {text}
        </Text>

        {/* Badges */}
        {isPrevVote && !isSelected && (
          <View className="flex-row items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-success/30 bg-success/10">
            <Ionicons name="checkmark" size={10} color="#10b981" />
            <Text className="text-[10px] font-bold text-success">Prev.</Text>
          </View>
        )}
        {isSelected && <View className="w-2 h-2 rounded-full bg-primary" />}
      </Animated.View>
    </TouchableOpacity>
  );
}
