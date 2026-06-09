import {
  ScrollView,
  View,
  Text,
  TextInput,
  Alert,
} from "react-native";
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { BottomCTA } from "@/components/layout/BottomCTA";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LineItemsTable } from "./LineItemsTable";
import { supabase } from "@/lib/supabase";
import { tokens } from "@/styles";
import type { EstimatePayload } from "@/types/estimate";

interface EstimateEditorProps {
  estimateId: string;
  defaultValues: EstimatePayload & { subtotal?: number; total?: number };
  onSaved?: () => void;
}

function EditableList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <View className="mb-6">
      <Text className="text-lg font-bold text-app-text-primary mb-3">{label}</Text>
      {items.map((item, i) => (
        <TextInput
          key={i}
          value={item}
          onChangeText={(v) => {
            const updated = [...items];
            updated[i] = v;
            onChange(updated);
          }}
          multiline
          placeholder={placeholder}
          placeholderTextColor={tokens.textTertiary}
          className="bg-app-surface border border-app-border rounded-xl px-4 py-3 text-base text-app-text-primary mb-2"
        />
      ))}
    </View>
  );
}

export function EstimateEditor({
  estimateId,
  defaultValues,
  onSaved,
}: EstimateEditorProps) {
  const [saving, setSaving] = useState(false);

  const methods = useForm<EstimatePayload>({
    defaultValues: {
      jobSummary: defaultValues.jobSummary ?? "",
      scopeOfWork: defaultValues.scopeOfWork ?? "",
      lineItems: defaultValues.lineItems ?? [],
      materialsChecklist: defaultValues.materialsChecklist ?? [],
      missingQuestions: defaultValues.missingQuestions ?? [],
      assumptions: defaultValues.assumptions ?? [],
      optionalUpsells: defaultValues.optionalUpsells ?? [],
      customerMessage: defaultValues.customerMessage ?? "",
    },
  });

  const { watch, setValue, handleSubmit } = methods;
  const materialsChecklist = watch("materialsChecklist");
  const assumptions = watch("assumptions");
  const missingQuestions = watch("missingQuestions");

  const onSubmit = async (data: EstimatePayload) => {
    setSaving(true);
    try {
      const subtotal = data.lineItems.reduce((sum, li) => sum + (li.total || 0), 0);
      const { error } = await supabase
        .from("estimates")
        .update({
          job_summary: data.jobSummary,
          scope_of_work: data.scopeOfWork,
          line_items: data.lineItems,
          materials_checklist: data.materialsChecklist,
          missing_questions: data.missingQuestions,
          assumptions: data.assumptions,
          optional_upsells: data.optionalUpsells,
          customer_message: data.customerMessage,
          subtotal,
          total: subtotal,
          status: "ready",
          updated_at: new Date().toISOString(),
        })
        .eq("id", estimateId);

      if (error) throw error;
      onSaved?.();
    } catch (err) {
      Alert.alert("Save failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Job Summary */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-app-text-primary mb-2">Job Summary</Text>
          <TextInput
            value={watch("jobSummary")}
            onChangeText={(v) => setValue("jobSummary", v)}
            multiline
            placeholder="Brief job description"
            placeholderTextColor={tokens.textTertiary}
            className="bg-app-surface border border-app-border rounded-2xl px-4 py-3 text-base text-app-text-primary"
            style={{ minHeight: 80 }}
            textAlignVertical="top"
          />
        </View>

        {/* Scope of Work */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-app-text-primary mb-2">Scope of Work</Text>
          <TextInput
            value={watch("scopeOfWork")}
            onChangeText={(v) => setValue("scopeOfWork", v)}
            multiline
            placeholder="• Item 1&#10;• Item 2"
            placeholderTextColor={tokens.textTertiary}
            className="bg-app-surface border border-app-border rounded-2xl px-4 py-3 text-base text-app-text-primary"
            style={{ minHeight: 120 }}
            textAlignVertical="top"
          />
        </View>

        {/* Line Items */}
        <LineItemsTable />

        {/* Materials */}
        <EditableList
          label="Materials Checklist"
          items={materialsChecklist}
          onChange={(v) => setValue("materialsChecklist", v)}
          placeholder="Material item"
        />

        {/* Clarifying Questions */}
        {missingQuestions.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <Text className="font-bold text-amber-800 mb-2">
              Clarify with Customer
            </Text>
            {missingQuestions.map((q, i) => (
              <Text key={i} className="text-amber-700 mb-1 leading-5">• {q}</Text>
            ))}
          </Card>
        )}

        {/* Assumptions */}
        <EditableList
          label="Assumptions"
          items={assumptions}
          onChange={(v) => setValue("assumptions", v)}
          placeholder="Assumes…"
        />

        {/* Customer Message */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-app-text-primary mb-2">
            Customer Message
          </Text>
          <TextInput
            value={watch("customerMessage")}
            onChangeText={(v) => setValue("customerMessage", v)}
            multiline
            placeholder="Professional message to include with the estimate"
            placeholderTextColor={tokens.textTertiary}
            className="bg-app-surface border border-app-border rounded-2xl px-4 py-3 text-base text-app-text-primary"
            style={{ minHeight: 120 }}
            textAlignVertical="top"
          />
        </View>

        <BottomCTA>
          <Button
            onPress={handleSubmit(onSubmit)}
            loading={saving}
            size="lg"
            className="w-full"
          >
            Save Changes
          </Button>
        </BottomCTA>
      </ScrollView>
    </FormProvider>
  );
}
