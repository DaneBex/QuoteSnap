import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View
      className={cn("bg-white rounded-2xl p-4 shadow-sm border border-gray-100", className)}
      {...props}
    >
      {children}
    </View>
  );
}
