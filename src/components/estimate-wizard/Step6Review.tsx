import {
  ScrollView,
  Text,
  View,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle, AlertTriangle } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useWizardStore } from "@/stores/wizardStore";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { tokens } from "@/styles";

export function Step6Review() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const isLowQuality = generatedEstimate.estimateQuality === "needs_detail";

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
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
      >
        {isLowQuality ? (
          <View className="flex-row items-center gap-2 mb-2">
            <AlertTriangle size={24} color={tokens.accent} />
            <Text className="text-2xl font-bold text-app-text-primary">More details needed</Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-2 mb-2">
            <CheckCircle size={24} color={tokens.success} />
            <Text className="text-2xl font-bold text-app-text-primary">Estimate ready</Text>
          </View>
        )}

        <Text className="text-app-text-secondary mb-6">
          {isLowQuality
            ? "I drafted the scope, but several details are missing before this is ready for pricing."
            : "Review the AI-generated estimate below. You can edit everything after saving."}
        </Text>

        {isLowQuality && generatedEstimate.missingQuestions.length > 0 && (
          <Card className="mb-4 border-amber-200 bg-amber-50">
            <Text className="font-bold text-amber-800 mb-2">Questions Before Pricing</Text>
            {generatedEstimate.missingQuestions.map((q, i) => (
              <Text key={i} className="text-amber-700 mb-1">• {q}</Text>
            ))}
          </Card>
        )}

        <Card className="mb-4">
          <Text className="font-bold text-app-text-primary mb-2">Job Summary</Text>
          <Text className="text-app-text-secondary leading-6">{generatedEstimate.jobSummary}</Text>
        </Card>

        <Card className="mb-4">
          <Text className="font-bold text-app-text-primary mb-2">Scope of Work</Text>
          <Text className="text-app-text-secondary leading-6">{generatedEstimate.scopeOfWork}</Text>
        </Card>

        <Card className="mb-4">
          <Text className="font-bold text-app-text-primary mb-3">Line Items</Text>
          {generatedEstimate.lineItems.map((item, i) => (
            <View key={i} className="flex-row justify-between py-2 border-b border-app-border last:border-0">
              <View className="flex-1 pr-4">
                <Text className="text-app-text-primary font-medium">{item.description}</Text>
                <Text className="text-app-text-secondary text-sm">
                  {item.qty} {item.unit} × {formatCurrency(item.unit_price)}
                </Text>
              </View>
              <Text className="font-semibold text-app-text-primary">
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
          <View className="flex-row justify-between mt-3 pt-3 border-t-2 border-app-border-strong">
            <Text className="font-bold text-app-text-primary text-base">Subtotal</Text>
            <Text className="font-bold text-app-accent text-base">{formatCurrency(subtotal)}</Text>
          </View>
        </Card>

        {!isLowQuality && generatedEstimate.missingQuestions.length > 0 && (
          <Card className="mb-4 border-amber-200 bg-amber-50">
            <Text className="font-bold text-amber-800 mb-2">Questions to Clarify</Text>
            {generatedEstimate.missingQuestions.map((q, i) => (
              <Text key={i} className="text-amber-700 mb-1">• {q}</Text>
            ))}
          </Card>
        )}
      </ScrollView>

      <View
        className="bg-app-surface border-t border-app-border px-4 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {isLowQuality ? (
          <View className="gap-3">
            <Button onPress={handleSave} loading={saving} size="lg" className="w-full">
              Answer Questions
            </Button>
            <Button
              onPress={handleSave}
              loading={saving}
              size="lg"
              variant="ghost"
              className="w-full"
            >
              Create Draft Anyway
            </Button>
          </View>
        ) : (
          <Button onPress={handleSave} loading={saving} size="lg" className="w-full">
            Save Estimate
          </Button>
        )}
      </View>
    </View>
  );
}
