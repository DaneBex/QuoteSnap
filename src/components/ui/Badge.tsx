import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  className?: string;
  textClassName?: string;
}

export function Badge({ label, className, textClassName }: BadgeProps) {
  return (
    <View className={cn("px-2.5 py-1 rounded-full", className)}>
      <Text className={cn("text-xs font-medium", textClassName)}>{label}</Text>
    </View>
  );
}
