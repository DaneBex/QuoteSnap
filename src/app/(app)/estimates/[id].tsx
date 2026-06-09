import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
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

  const handleDelete = () => {
    Alert.alert(
      "Delete estimate?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await supabase.from("estimates").delete().eq("id", id);
            router.replace("/(app)/dashboard");
          },
        },
      ]
    );
  };

  const customer = estimate?.jobs?.customers;
  const title = customer?.name
    ? `${customer.name} — ${estimate?.jobs?.job_type}`
    : estimate?.jobs?.job_type ?? "Estimate";

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
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
              <Eye size={22} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} className="ml-1">
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        }
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : estimate ? (
        <>
          {saved && (
            <View className="bg-green-50 border-b border-green-100 px-4 py-2">
              <Text className="text-green-700 font-medium text-sm text-center">
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
          <Text className="text-gray-500">Estimate not found.</Text>
        </View>
      )}
    </View>
  );
}
