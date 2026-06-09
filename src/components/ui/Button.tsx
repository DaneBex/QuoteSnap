import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { cn } from "@/lib/utils";
import { tokens } from "@/styles";

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
    primary: "bg-app-accent active:bg-app-accent-hover",
    secondary: "bg-app-surface border-2 border-app-accent active:bg-app-accent-light",
    ghost: "bg-transparent active:bg-app-surface-alt",
    danger: "bg-app-danger active:bg-app-danger",
  };

  const sizes = {
    sm: "px-4 py-2.5",
    md: "px-5 py-3.5",
    lg: "px-6 py-4",
  };

  const textVariants = {
    primary: "text-app-text-inverse font-semibold",
    secondary: "text-app-accent font-semibold",
    ghost: "text-app-text-secondary font-medium",
    danger: "text-app-text-inverse font-semibold",
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
          color={variant === "primary" || variant === "danger" ? tokens.textInverse : tokens.accent}
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
