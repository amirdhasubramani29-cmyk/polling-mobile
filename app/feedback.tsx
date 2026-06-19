import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";

export default function FeedbackScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-text-primary">
          Feedback
        </Text>
      </View>
    </SafeAreaView>
  );
}