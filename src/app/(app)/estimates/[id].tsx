import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Eye, Trash2 } from "lucide-react-native";
import { PageHeader } from "@/components/layout/PageHeader";
import { EstimateEditor } from "@/components/estimate-editor/EstimateEditor";
import { supabase } from "@/lib/supabase";
import { getStatusColor, getStatusLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { tokens } from "@/styles";
import type { SavedEstimate } from "@/types/estimate";

export default function EstimateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [estimate, setEstimate] = useState<SavedEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("estimates")
      .select("*, jobs(id, job_type, notes, customers(id, name, phone, email, address))")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setEstimate(data as SavedEstimate);
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (Platform.OS === "web") {
      // Alert.alert callbacks are unreliable on web — use window.confirm directly
      if (!window.confirm("Delete estimate?\n\nThis cannot be undone.")) return;
      const { error } = await supabase.from("estimates").delete().eq("id", id);
      if (error) {
        window.alert("Could not delete estimate. Please try again.");
        return;
      }
      router.replace("/(app)/dashboard");
    } else {
      Alert.alert("Delete estimate?", "This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("estimates").delete().eq("id", id);
            if (!error) router.replace("/(app)/dashboard");
          },
        },
      ]);
    }
  };

  const customer = estimate?.jobs?.customers;
  const title = customer?.name
    ? `${customer.name} — ${estimate?.jobs?.job_type}`
    : estimate?.jobs?.job_type ?? "Estimate";

  return (
    <View className="flex-1 bg-app-background" style={{ paddingTop: insets.top }}>
      <PageHeader
        title={title}
        showBack
        right={
          <View className="flex-row items-center gap-2">
            {estimate && (
              <Badge
                label={getStatusLabel(estimate.status)}
                className={getStatusColor(estimate.status)}
              />
            )}
            <TouchableOpacity onPress={() => router.push(`/(app)/estimates/${id}/preview`)}>
              <Eye size={22} color={tokens.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} className="ml-1">
              <Trash2 size={20} color={tokens.danger} />
            </TouchableOpacity>
          </View>
        }
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      ) : estimate ? (
        <>
          {saved && (
            <View className="bg-app-success-light border-b border-app-success-light px-4 py-2">
              <Text className="text-app-success font-medium text-sm text-center">
                ✓ Saved — status updated to "Ready to Send"
              </Text>
            </View>
          )}
          <EstimateEditor
            estimateId={estimate.id}
            defaultValues={{
              jobSummary: estimate.job_summary ?? "",
              scopeOfWork: estimate.scope_of_work ?? "",
              lineItems: estimate.line_items ?? [],
              materialsChecklist: estimate.materials_checklist ?? [],
              missingQuestions: estimate.missing_questions ?? [],
              assumptions: estimate.assumptions ?? [],
              optionalUpsells: estimate.optional_upsells ?? [],
              customerMessage: estimate.customer_message ?? "",
              subtotal: estimate.subtotal ?? 0,
              total: estimate.total ?? 0,
            }}
            onSaved={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 3000);
            }}
          />
        </>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-app-text-secondary">Estimate not found.</Text>
        </View>
      )}
    </View>
  );
}
