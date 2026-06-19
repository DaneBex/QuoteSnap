import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Eye, Pencil, Trash2 } from "lucide-react-native";
import { EstimateEditor } from "@/components/estimate-editor/EstimateEditor";
import { supabase } from "@/lib/supabase";
import { getStatusColor, getStatusLabel, getEffectiveStatusKey } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { tokens } from "@/styles";
import { useDemoStore } from "@/stores/demoStore";
import type { SavedEstimate } from "@/types/estimate";

export default function EstimateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [estimate, setEstimate] = useState<SavedEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [missingQuestionsCount, setMissingQuestionsCount] = useState(0);
  const [customTitle, setCustomTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const titleInputRef = useRef<TextInput>(null);
  const { phase, step, setStep } = useDemoStore();

  useEffect(() => {
    if (!id) return;
    supabase
      .from("estimates")
      .select("*, jobs(id, job_type, notes, customers(id, name, phone, email, address))")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        const est = data as SavedEstimate;
        setEstimate(est);
        setCustomTitle(est?.title ?? "");
        setMissingQuestionsCount((est?.missing_questions ?? []).length);
        setLoading(false);
      });
  }, [id]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/dashboard");
    }
  };

  const handleDelete = async () => {
    if (Platform.OS === "web") {
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

  const saveTitleChange = async (value: string) => {
    const trimmed = value.trim();
    setCustomTitle(trimmed);
    setEditingTitle(false);
    await supabase
      .from("estimates")
      .update({ title: trimmed || null })
      .eq("id", id);
    setEstimate((prev) => (prev ? { ...prev, title: trimmed || null } : null));
  };

  const customer = estimate?.jobs?.customers;
  const derivedTitle = customer?.name
    ? `${customer.name} — ${estimate?.jobs?.job_type}`
    : estimate?.jobs?.job_type ?? "Estimate";
  const displayTitle = customTitle.trim() || derivedTitle;

  return (
    <View className="flex-1 bg-app-background" style={{ paddingTop: insets.top }}>
      {/* Custom header with inline-editable title */}
      <View className="bg-app-surface px-4 py-4 border-b border-app-border flex-row items-center">
        <TouchableOpacity
          onPress={handleBack}
          className="mr-3 -ml-1 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={tokens.textSecondary} />
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center gap-1.5" style={{ minWidth: 0 }}>
          {editingTitle ? (
            <TextInput
              ref={titleInputRef}
              autoFocus
              value={customTitle}
              onChangeText={setCustomTitle}
              onBlur={() => saveTitleChange(customTitle)}
              onSubmitEditing={() => saveTitleChange(customTitle)}
              returnKeyType="done"
              className="text-lg font-bold text-app-text-primary"
              style={{ flex: 1, minWidth: 0, padding: 0 }}
              selectTextOnFocus
            />
          ) : (
            <>
              <Text
                className="text-lg font-bold text-app-text-primary flex-shrink"
                numberOfLines={1}
              >
                {displayTitle}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCustomTitle(customTitle || "");
                  setEditingTitle(true);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Pencil size={15} color={tokens.textTertiary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View className="flex-row items-center gap-2 ml-2" style={{ flexShrink: 0 }}>
          {estimate && (() => {
            const hasZeroPrices = (estimate.line_items ?? []).some(
              (li) => li.description && (Number(li.unit_price) || 0) === 0
            );
            const effectiveKey = getEffectiveStatusKey(
              estimate.status,
              estimate.prices_confirmed,
              estimate.subtotal ?? 0,
              missingQuestionsCount,
              hasZeroPrices
            );
            return (
              <Badge
                label={getStatusLabel(effectiveKey)}
                className={getStatusColor(effectiveKey)}
              />
            );
          })()}
          <TouchableOpacity onPress={() => router.push(`/(app)/estimates/${id}/preview`)}>
            <Eye size={22} color={tokens.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} className="ml-1">
            <Trash2 size={20} color={tokens.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      ) : estimate ? (
        <>
          <EstimateEditor
            estimateId={estimate.id}
            pricesConfirmed={estimate.prices_confirmed}
            defaultValues={{
              jobSummary: estimate.job_summary ?? "",
              scopeOfWork: estimate.scope_of_work ?? "",
              lineItems: estimate.line_items ?? [],
              materialsChecklist: estimate.materials_checklist ?? [],
              materialsChecked: estimate.materials_checked ?? [],
              missingQuestions: estimate.missing_questions ?? [],
              optionalQuestions: estimate.optional_questions ?? [],
              clarifyingAnswers: estimate.clarifying_answers ?? [],
              clarificationRound: estimate.clarification_round ?? 0,
              assumptions: estimate.assumptions ?? [],
              optionalUpsells: estimate.optional_upsells ?? [],
              customerMessage: estimate.customer_message ?? "",
              subtotal: estimate.subtotal ?? 0,
              total: estimate.total ?? 0,
            }}
            customer={estimate.jobs?.customers}
            job={estimate.jobs}
            onSaved={async () => {
              const { data } = await supabase
                .from("estimates")
                .select("*, jobs(id, job_type, notes, customers(id, name, phone, email, address))")
                .eq("id", id)
                .single();
              if (data) {
                setEstimate(data as SavedEstimate);
                setMissingQuestionsCount((data as SavedEstimate).missing_questions?.length ?? 0);
              }
            }}
            onPricesConfirmedChange={(confirmed, confirmedAt) => {
              setEstimate(prev => prev ? {
                ...prev,
                prices_confirmed: confirmed,
                prices_confirmed_at: confirmedAt ?? prev.prices_confirmed_at ?? null,
                status: confirmed ? "ready" : prev.status,
              } : null);
              if (confirmed && phase === "walkthrough" && step === "confirmPrices") {
                setStep("preview");
                router.push(`/(app)/estimates/${id}/preview`);
              }
            }}
            onMissingQuestionsChange={setMissingQuestionsCount}
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
