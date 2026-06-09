import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { cn } from "@/lib/utils";

interface ButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  onPress,
  children,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  className,
}: ButtonProps) {
  const base = "rounded-xl flex-row items-center justify-center";

  const variants = {
    primary: "bg-blue-600 active:bg-blue-700",
    secondary: "bg-white border-2 border-blue-600 active:bg-blue-50",
    ghost: "bg-transparent active:bg-gray-100",
    danger: "bg-red-500 active:bg-red-600",
  };

  const sizes = {
    sm: "px-4 py-2.5",
    md: "px-5 py-3.5",
    lg: "px-6 py-4",
  };

  const textVariants = {
    primary: "text-white font-semibold",
    secondary: "text-blue-600 font-semibold",
    ghost: "text-gray-700 font-medium",
    danger: "text-white font-semibold",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={cn(base, variants[variant], sizes[size], isDisabled && "opacity-50", className)}
      activeOpacity={0.8}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? "#fff" : "#2563eb"}
          className="mr-2"
        />
      )}
      {typeof children === "string" ? (
        <Text className={cn(textVariants[variant], textSizes[size])}>{children}</Text>
      ) : (
        <View className="flex-row items-center gap-2">{children}</View>
      )}
    </TouchableOpacity>
  );
}
