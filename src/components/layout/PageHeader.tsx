import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { tokens } from "@/styles";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function PageHeader({ title, subtitle, showBack, right }: PageHeaderProps) {
  const router = useRouter();

  return (
    <View className="bg-app-surface px-4 py-4 border-b border-app-border flex-row items-center">
      {showBack && (
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 -ml-1 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={tokens.textSecondary} />
        </TouchableOpacity>
      )}
      <View className="flex-1">
        <Text className="text-lg font-bold text-app-text-primary">{title}</Text>
        {subtitle && (
          <Text className="text-sm text-app-text-secondary mt-0.5">{subtitle}</Text>
        )}
      </View>
      {right && <View>{right}</View>}
    </View>
  );
}
