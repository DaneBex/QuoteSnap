import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { CheckCircle } from "lucide-react-native";
import { BottomCTA } from "@/components/layout/BottomCTA";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useWizardStore } from "@/stores/wizardStore";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

export function Step6Review() {
  const router = useRouter();
  const {
    jobType,
    customer,
    notes,
    photos,
    generatedEstimate,
    reset,
  } = useWizardStore();
  const [saving, setSaving] = useState(false);

  if (!generatedEstimate) return null;

  const subtotal = generatedEstimate.lineItems.reduce((sum, li) => sum + li.total, 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Upsert customer
      let customerId: string | null = null;
      if (customer.name) {
        const { data: cust, error: custErr } = await supabase
          .from("customers")
          .insert({
            user_id: user.id,
            name: customer.name,
            phone: customer.phone || null,
            email: customer.email || null,
            address: customer.address || null,
          })
          .select("id")
          .single();
        if (custErr) throw custErr;
        customerId = cust.id;
      }

      // 2. Create job
      const { data: job, error: jobErr } = await supabase
        .from("jobs")
        .insert({
          user_id: user.id,
          customer_id: customerId,
          job_type: jobType,
          notes,
          status: "draft",
        })
        .select("id")
        .single();
      if (jobErr) throw jobErr;

      // 3. Link photos to job
      if (photos.some((p) => p.storageKey)) {
        await supabase.from("job_photos").insert(
          photos
            .filter((p) => p.storageKey)
            .map((p) => ({
              job_id: job.id,
              user_id: user.id,
              storage_path: p.storageKey!,
            }))
        );
      }

      // 4. Create estimate
      const { data: estimate, error: estErr } = await supabase
        .from("estimates")
        .insert({
          job_id: job.id,
          user_id: user.id,
          ai_payload: generatedEstimate,
          job_summary: generatedEstimate.jobSummary,
          scope_of_work: generatedEstimate.scopeOfWork,
          line_items: generatedEstimate.lineItems,
          materials_checklist: generatedEstimate.materialsChecklist,
          missing_questions: generatedEstimate.missingQuestions,
          assumptions: generatedEstimate.assumptions,
          optional_upsells: generatedEstimate.optionalUpsells,
          customer_message: generatedEstimate.customerMessage,
          subtotal,
          total: subtotal,
          status: "draft",
        })
        .select("id")
        .single();
      if (estErr) throw estErr;

      reset();
      router.replace(`/(app)/estimates/${estimate.id}`);
    } catch (err) {
      Alert.alert(
        "Save failed",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
    >
      <View className="flex-row items-center gap-2 mb-4">
        <CheckCircle size={24} color="#16a34a" />
        <Text className="text-2xl font-bold text-gray-900">Estimate ready</Text>
      </View>
      <Text className="text-gray-500 mb-6">
        Review the AI-generated estimate below. You can edit everything after saving.
      </Text>

      <Card className="mb-4">
        <Text className="font-bold text-gray-900 mb-2">Job Summary</Text>
        <Text className="text-gray-700 leading-6">{generatedEstimate.jobSummary}</Text>
      </Card>

      <Card className="mb-4">
        <Text className="font-bold text-gray-900 mb-2">Scope of Work</Text>
        <Text className="text-gray-700 leading-6">{generatedEstimate.scopeOfWork}</Text>
      </Card>

      <Card className="mb-4">
        <Text className="font-bold text-gray-900 mb-3">Line Items</Text>
        {generatedEstimate.lineItems.map((item, i) => (
          <View key={i} className="flex-row justify-between py-2 border-b border-gray-100 last:border-0">
            <View className="flex-1 pr-4">
              <Text className="text-gray-800 font-medium">{item.description}</Text>
              <Text className="text-gray-500 text-sm">
                {item.qty} {item.unit} × {formatCurrency(item.unit_price)}
              </Text>
            </View>
            <Text className="font-semibold text-gray-900">
              {formatCurrency(item.total)}
            </Text>
          </View>
        ))}
        <View className="flex-row justify-between mt-3 pt-3 border-t-2 border-gray-200">
          <Text className="font-bold text-gray-900 text-base">Subtotal</Text>
          <Text className="font-bold text-blue-600 text-base">{formatCurrency(subtotal)}</Text>
        </View>
      </Card>

      {generatedEstimate.missingQuestions.length > 0 && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <Text className="font-bold text-amber-800 mb-2">Questions to Clarify</Text>
          {generatedEstimate.missingQuestions.map((q, i) => (
            <Text key={i} className="text-amber-700 mb-1">• {q}</Text>
          ))}
        </Card>
      )}

      <BottomCTA>
        <Button
          onPress={handleSave}
          loading={saving}
          size="lg"
          className="w-full"
        >
          Save Estimate
        </Button>
      </BottomCTA>
    </ScrollView>
  );
}
