import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View
      className={cn("bg-app-surface rounded-2xl p-4 shadow-sm border border-app-border", className)}
      {...props}
    >
      {children}
    </View>
  );
}
