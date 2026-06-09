import { View, Text } from "react-native";
import { ClipboardList } from "lucide-react-native";

export function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-5">
        <ClipboardList size={36} color="#2563eb" />
      </View>
      <Text className="text-xl font-bold text-gray-900 text-center mb-2">
        No estimates yet
      </Text>
      <Text className="text-gray-500 text-center text-base leading-6">
        Tap <Text className="font-semibold text-blue-600">New Estimate</Text> to
        turn your jobsite notes into a professional proposal.
      </Text>
    </View>
  );
}
