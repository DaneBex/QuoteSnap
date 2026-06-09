import { View, Text } from "react-native";
import { ClipboardList } from "lucide-react-native";
import { tokens } from "@/styles";

export function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 bg-app-accent-light rounded-full items-center justify-center mb-5">
        <ClipboardList size={36} color={tokens.accent} />
      </View>
      <Text className="text-xl font-bold text-app-text-primary text-center mb-2">
        No estimates yet
      </Text>
      <Text className="text-app-text-secondary text-center text-base leading-6">
        Tap <Text className="font-semibold text-app-accent">New Estimate</Text> to
        turn your jobsite notes into a professional proposal.
      </Text>
    </View>
  );
}
