import { TouchableOpacity, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, FileText } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { tokens } from "@/styles";
import type { SavedEstimate } from "@/types/estimate";

interface EstimateCardProps {
  estimate: SavedEstimate;
}

export function EstimateCard({ estimate }: EstimateCardProps) {
  const router = useRouter();
  const customer = estimate.jobs?.customers;
  const statusColor = getStatusColor(estimate.status);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/estimates/${estimate.id}`)}
      activeOpacity={0.7}
    >
      <Card className="mb-3 flex-row items-center">
        <View className="w-10 h-10 bg-app-accent-light rounded-xl items-center justify-center mr-3">
          <FileText size={20} color={tokens.accent} />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-app-text-primary text-base">
            {estimate.title || customer?.name || "No customer"}
          </Text>
          <Text className="text-app-text-secondary text-sm mt-0.5">
            {estimate.jobs?.job_type} · {formatDate(estimate.created_at)}
          </Text>
          {estimate.total != null && (
            <Text className="text-app-accent font-semibold text-sm mt-0.5">
              {formatCurrency(estimate.total)}
            </Text>
          )}
        </View>
        <View className="items-end gap-1.5">
          <Badge
            label={getStatusLabel(estimate.status)}
            className={statusColor}
          />
          <ChevronRight size={16} color={tokens.textTertiary} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}
