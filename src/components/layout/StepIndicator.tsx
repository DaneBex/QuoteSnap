import { View, Text, TouchableOpacity, useWindowDimensions } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { tokens } from "@/styles";

interface StepIndicatorProps {
  total: number;
  current: number;
  labels?: string[];
  onBack?: () => void;
}

export function StepIndicator({ total, current, labels, onBack }: StepIndicatorProps) {
  const { height } = useWindowDimensions();
  const compact = height <= 700;

  return (
    <View className={`px-4 ${compact ? "py-1.5" : "py-3"} bg-app-surface border-b border-app-border`}>
      <View className={`flex-row items-center gap-1.5 ${compact ? "" : "mb-1.5"}`}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < current ? "bg-app-accent" : "bg-app-surface-alt"
            }`}
          />
        ))}
      </View>
      {!compact && labels && (
        <View className="flex-row items-center">
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="mr-1.5"
            >
              <ChevronLeft size={14} color={tokens.textSecondary} />
            </TouchableOpacity>
          )}
          <Text className="text-xs text-app-text-secondary">
            Step {current} of {total}
            {labels[current - 1] ? ` — ${labels[current - 1]}` : ""}
          </Text>
        </View>
      )}
    </View>
  );
}
