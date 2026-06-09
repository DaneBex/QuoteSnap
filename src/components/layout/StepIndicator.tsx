import { View, Text } from "react-native";

interface StepIndicatorProps {
  total: number;
  current: number;
  labels?: string[];
}

export function StepIndicator({ total, current, labels }: StepIndicatorProps) {
  return (
    <View className="px-4 py-3 bg-app-surface border-b border-app-border">
      <View className="flex-row items-center gap-1.5 mb-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < current ? "bg-app-accent" : "bg-app-surface-alt"
            }`}
          />
        ))}
      </View>
      {labels && (
        <Text className="text-xs text-app-text-secondary">
          Step {current} of {total}
          {labels[current - 1] ? ` — ${labels[current - 1]}` : ""}
        </Text>
      )}
    </View>
  );
}
