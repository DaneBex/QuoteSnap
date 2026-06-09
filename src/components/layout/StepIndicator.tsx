import { View, Text } from "react-native";

interface StepIndicatorProps {
  total: number;
  current: number;
  labels?: string[];
}

export function StepIndicator({ total, current, labels }: StepIndicatorProps) {
  return (
    <View className="px-4 py-3 bg-white border-b border-gray-100">
      <View className="flex-row items-center gap-1.5 mb-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < current ? "bg-blue-600" : "bg-gray-200"
            }`}
          />
        ))}
      </View>
      {labels && (
        <Text className="text-xs text-gray-500">
          Step {current} of {total}
          {labels[current - 1] ? ` — ${labels[current - 1]}` : ""}
        </Text>
      )}
    </View>
  );
}
