import { TextInput, Text, View, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";
import { tokens } from "@/styles";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-app-text-secondary mb-1.5">{label}</Text>
      )}
      <TextInput
        className={cn(
          "bg-app-surface border border-app-border rounded-xl px-4 py-3.5 text-base text-app-text-primary",
          "focus:border-app-accent",
          error && "border-app-danger",
          className
        )}
        placeholderTextColor={tokens.textTertiary}
        {...props}
      />
      {error && (
        <Text className="text-app-danger text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}
