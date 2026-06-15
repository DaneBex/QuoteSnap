import {
  ScrollView,
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  Pressable,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Copy, MessageSquare, Mail, MessageCircle, ChevronDown, ChevronUp, Check } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { BottomCTA } from "@/components/layout/BottomCTA";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { LineItemsTable } from "./LineItemsTable";
import { JobPhotosSection } from "./JobPhotosSection";
import { supabase } from "@/lib/supabase";
import { tokens } from "@/styles";
import { computeEstimateStatus, formatCurrency, parseAmount } from "@/lib/utils";
import type { ClarifyingAnswer, EstimatePayload, LineItem } from "@/types/estimate";

interface CustomerInfo {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface JobInfo {
  id?: string | null;
  job_type?: string | null;
  notes?: string | null;
}

interface EstimateEditorProps {
  estimateId: string;
  defaultValues: EstimatePayload & {
    subtotal?: number;
    total?: number;
    materialsChecked?: boolean[];
    clarifyingAnswers?: ClarifyingAnswer[];
    clarificationRound?: number;
  };
  customer?: CustomerInfo | null;
  job?: JobInfo | null;
  onSaved?: (status: import("@/types/estimate").EstimateStatus) => void;
  pricesConfirmed?: boolean;
  onPricesConfirmedChange?: (confirmed: boolean, confirmedAt?: string) => void;
  onMissingQuestionsChange?: (count: number) => void;
}

function computePricingHash(items: LineItem[]): string {
  return JSON.stringify(items.map(li => ({ qty: li.qty, unit_price: li.unit_price })));
}

const CONFIRMED_TOTAL_RE = /\n*The estimated total for this scope is \$[\d,]+\.\d{2}\.\n*/g;

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
  const [itemHeights, setItemHeights] = useState<Record<number, number>>({});

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
          scrollEnabled={false}
          onContentSizeChange={(e) =>
            setItemHeights((prev) => ({
              ...prev,
              [i]: Math.max(40, e.nativeEvent.contentSize.height),
            }))
          }
          placeholder={placeholder}
          placeholderTextColor={tokens.textTertiary}
          className="bg-app-surface border border-app-border rounded-xl px-4 py-3 text-base text-app-text-primary mb-2"
          style={{
            minHeight: 40,
            height: itemHeights[i] ?? 40,
            textAlignVertical: "top",
            ...(Platform.OS === "web" ? { overflow: "hidden" } : {}),
          }}
        />
      ))}
    </View>
  );
}

function MaterialsChecklist({
  items,
  onChange,
  checked,
  onCheckedChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  checked: boolean[];
  onCheckedChange: (checked: boolean[]) => void;
}) {
  const toggle = (i: number) =>
    onCheckedChange(checked.map((v, idx) => (idx === i ? !v : v)));

  const [itemHeights, setItemHeights] = useState<Record<number, number>>({});

  return (
    <View className="mb-6">
      <Text className="text-lg font-bold text-app-text-primary mb-3">Materials Checklist</Text>
      {items.map((item, i) => (
        <View key={i} className="bg-app-surface border border-app-border rounded-xl px-4 py-3 flex-row items-start gap-3 mb-2">
          <Pressable
            onPress={() => toggle(i)}
            style={{ width: 24, height: 24, marginTop: 2 }}
            className={`rounded-md border-2 items-center justify-center flex-shrink-0 ${
              checked[i]
                ? "bg-app-accent border-app-accent"
                : "bg-white border-app-border"
            }`}
          >
            {checked[i] ? <Check size={14} color="#ffffff" /> : null}
          </Pressable>
          <TextInput
            value={item}
            onChangeText={(v) => {
              const updated = [...items];
              updated[i] = v;
              onChange(updated);
            }}
            multiline
            scrollEnabled={false}
            onContentSizeChange={(e) =>
              setItemHeights((prev) => ({
                ...prev,
                [i]: Math.max(28, e.nativeEvent.contentSize.height),
              }))
            }
            placeholder="Material item"
            placeholderTextColor={tokens.textTertiary}
            className="flex-1 text-base text-app-text-primary"
            style={{
              minHeight: 28,
              height: itemHeights[i] ?? 28,
              lineHeight: 22,
              paddingVertical: 0,
              paddingTop: 0,
              paddingBottom: 0,
              textAlignVertical: "top",
              ...(checked[i] ? { opacity: 0.45 } : {}),
              ...(Platform.OS === "web" ? { overflow: "hidden" } : {}),
            }}
          />
        </View>
      ))}
    </View>
  );
}

function buildSmsBody(customerName: string, jobType: string, questions: string[]) {
  const name = customerName ? `Hi ${customerName}` : "Hi";
  const qs = questions.map((q) => `• ${q}`).join("\n");
  return `${name}, I have a few questions before I can give you an accurate price for your ${jobType || "job"}:\n\n${qs}`;
}

function QuestionsCard({
  questions,
  hasPricing,
  customer,
  job,
  answers,
  onAnswersChange,
  regenerating,
  onUpdateEstimate,
}: {
  questions: string[];
  hasPricing: boolean;
  customer?: CustomerInfo | null;
  job?: JobInfo | null;
  answers: string[];
  onAnswersChange: (answers: string[]) => void;
  regenerating: boolean;
  onUpdateEstimate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(questions.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleText = () => {
    if (!customer?.phone) return;
    const body = buildSmsBody(customer.name ?? "", job?.job_type ?? "", questions);
    Linking.openURL(
      `sms:${customer.phone}${Platform.OS === "ios" ? "&" : "?"}body=${encodeURIComponent(body)}`
    );
  };

  const handleEmail = () => {
    if (!customer?.email) return;
    const subject = encodeURIComponent(`Questions about your ${job?.job_type ?? "estimate"}`);
    const body = encodeURIComponent(buildSmsBody(customer.name ?? "", job?.job_type ?? "", questions));
    Linking.openURL(`mailto:${customer.email}?subject=${subject}&body=${body}`);
  };

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50">
      <Text className="font-bold text-amber-800 mb-2">
        {hasPricing ? "Final Details to Confirm" : "Clarify with Customer"}
      </Text>
      {questions.map((q, i) => (
        <Text key={i} className="text-stone-700 mb-1 leading-5">• {q}</Text>
      ))}

      <View className="flex-row flex-wrap gap-2 mt-3 pt-3 border-t border-amber-200">
        <TouchableOpacity
          onPress={handleCopy}
          className="flex-row items-center gap-1.5 bg-white border border-amber-200 rounded-lg px-3 py-1.5"
        >
          <Copy size={14} color={tokens.accent} />
          <Text className="text-xs font-medium text-app-text-primary">
            {copied ? "Copied!" : "Copy"}
          </Text>
        </TouchableOpacity>

        {customer?.phone ? (
          <TouchableOpacity
            onPress={handleText}
            className="flex-row items-center gap-1.5 bg-white border border-amber-200 rounded-lg px-3 py-1.5"
          >
            <MessageSquare size={14} color={tokens.accent} />
            <Text className="text-xs font-medium text-app-text-primary">Text Customer</Text>
          </TouchableOpacity>
        ) : null}

        {customer?.email ? (
          <TouchableOpacity
            onPress={handleEmail}
            className="flex-row items-center gap-1.5 bg-white border border-amber-200 rounded-lg px-3 py-1.5"
          >
            <Mail size={14} color={tokens.accent} />
            <Text className="text-xs font-medium text-app-text-primary">Email Customer</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={() => setShowAnswers((v) => !v)}
          className="flex-row items-center gap-1.5 bg-app-accent rounded-lg px-3 py-1.5"
        >
          <MessageCircle size={14} color={tokens.textInverse} />
          <Text className="text-xs font-medium text-app-text-inverse">
            {showAnswers ? "Hide Questions" : "Answer Questions"}
          </Text>
          {showAnswers
            ? <ChevronUp size={12} color={tokens.textInverse} />
            : <ChevronDown size={12} color={tokens.textInverse} />}
        </TouchableOpacity>
      </View>

      {showAnswers && (
        <View className="mt-4 gap-3">
          <Text className="text-xs text-app-text-secondary leading-4">
            Answer what you can. Unanswered questions will be skipped.
          </Text>
          {questions.map((question, i) => (
            <View key={i}>
              <Text className="text-sm font-medium text-stone-700 mb-1 leading-5">{question}</Text>
              <TextInput
                value={answers[i] ?? ""}
                onChangeText={(v) => {
                  const updated = [...answers];
                  updated[i] = v;
                  onAnswersChange(updated);
                }}
                multiline
                placeholder="Your answer…"
                placeholderTextColor={tokens.textTertiary}
                className="bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm text-app-text-primary"
                style={{ minHeight: 56, ...(Platform.OS === "web" && { overflow: "hidden" }) }}
                textAlignVertical="top"
              />
            </View>
          ))}

          <TouchableOpacity
            onPress={onUpdateEstimate}
            disabled={regenerating}
            className="bg-app-accent rounded-xl py-3 items-center flex-row justify-center gap-2"
          >
            {regenerating
              ? <ActivityIndicator size="small" color={tokens.textInverse} />
              : null}
            <Text className="text-app-text-inverse font-bold text-sm">
              {regenerating ? "Updating…" : "Update Estimate"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

function OptionalQuestionsCard({
  questions,
}: {
  questions: string[];
}) {
  return (
    <Card className="mb-6 border-stone-200 bg-stone-50">
      <Text className="font-bold text-stone-700 mb-2">Final Details to Confirm</Text>
      <Text className="text-xs text-app-text-secondary mb-2 leading-4">
        Pricing is ready — confirm these details before sending.
      </Text>
      {questions.map((q, i) => (
        <Text key={i} className="text-stone-600 mb-1 leading-5 text-sm">• {q}</Text>
      ))}
    </Card>
  );
}

function initAnswers(
  questions: string[],
  saved: ClarifyingAnswer[]
): string[] {
  return questions.map((q) => saved.find((a) => a.question === q)?.answer ?? "");
}

export function EstimateEditor({
  estimateId,
  defaultValues,
  customer,
  job,
  onSaved,
  pricesConfirmed: initialPricesConfirmed,
  onPricesConfirmedChange,
  onMissingQuestionsChange,
}: EstimateEditorProps) {
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveResultRef = useRef<"success" | "error">("success");
  if (saveResult !== null) lastSaveResultRef.current = saveResult;
  const [regenerating, setRegenerating] = useState(false);
  const [summaryHeight, setSummaryHeight] = useState(80);
  const [scopeHeight, setScopeHeight] = useState(120);
  const [messageHeight, setMessageHeight] = useState(120);

  const [materialsChecked, setMaterialsChecked] = useState<boolean[]>(() => {
    const saved = defaultValues.materialsChecked ?? [];
    return (defaultValues.materialsChecklist ?? []).map((_, i) => saved[i] ?? false);
  });

  const [answers, setAnswers] = useState<string[]>(() =>
    initAnswers(
      defaultValues.missingQuestions ?? [],
      defaultValues.clarifyingAnswers ?? []
    )
  );

  const [optionalQuestions, setOptionalQuestions] = useState<string[]>(
    () => defaultValues.optionalQuestions ?? []
  );

  const [pricesConfirmed, setPricesConfirmed] = useState(initialPricesConfirmed ?? false);
  const confirmedPricingHashRef = useRef<string | null>(
    initialPricesConfirmed ? computePricingHash(defaultValues.lineItems ?? []) : null
  );

  const [resolvedAnswerHistory, setResolvedAnswerHistory] = useState<ClarifyingAnswer[]>(
    () => defaultValues.clarifyingAnswers ?? []
  );

  const [clarificationRound, setClarificationRound] = useState<number>(
    () => defaultValues.clarificationRound ?? 0
  );

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

  const { watch, setValue, handleSubmit, reset, getValues } = methods;
  const materialsChecklist = watch("materialsChecklist");
  const assumptions = watch("assumptions");
  const missingQuestions = watch("missingQuestions");
  const lineItems = watch("lineItems");
  const currentSubtotal = (lineItems ?? []).reduce(
    (sum, li) => sum + parseAmount(li.qty) * parseAmount(li.unit_price), 0
  );

  useEffect(() => {
    if (!pricesConfirmed || !confirmedPricingHashRef.current) return;
    if (computePricingHash(lineItems ?? []) !== confirmedPricingHashRef.current) {
      setPricesConfirmed(false);
      onPricesConfirmedChange?.(false);

      const currentMsg = getValues("customerMessage") ?? "";
      const cleanedMsg = currentMsg.replace(CONFIRMED_TOTAL_RE, "").trimEnd();
      if (cleanedMsg !== currentMsg) {
        setValue("customerMessage", cleanedMsg);
      }

      supabase.from("estimates")
        .update({
          prices_confirmed: false,
          prices_confirmed_at: null,
          ...(cleanedMsg !== currentMsg ? { customer_message: cleanedMsg } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", estimateId);
    }
  }, [lineItems, pricesConfirmed]);

  const applyRegeneratedPayload = (payload: EstimatePayload) => {
    reset({
      jobSummary: payload.jobSummary ?? "",
      scopeOfWork: payload.scopeOfWork ?? "",
      lineItems: payload.lineItems ?? [],
      materialsChecklist: payload.materialsChecklist ?? [],
      missingQuestions: payload.missingQuestions ?? [],
      optionalQuestions: payload.optionalQuestions ?? [],
      assumptions: payload.assumptions ?? [],
      optionalUpsells: payload.optionalUpsells ?? [],
      customerMessage: payload.customerMessage ?? "",
    });
    const newQuestions = payload.missingQuestions ?? [];
    // preserve answers for questions that survived the regeneration
    setAnswers(initAnswers(newQuestions, missingQuestions.map((q, i) => ({ question: q, answer: answers[i] ?? "" }))));
    setMaterialsChecked((payload.materialsChecklist ?? []).map(() => false));
    setOptionalQuestions(payload.optionalQuestions ?? []);
    onMissingQuestionsChange?.((payload.missingQuestions ?? []).length);
  };

  const confirmPrices = () => {
    if ((missingQuestions ?? []).length > 0) {
      const title = "Answer required details first";
      const body = "A few details may affect the estimate price. Answer those before confirming prices.";
      if (Platform.OS === "web") {
        window.alert(`${title}\n\n${body}`);
      } else {
        Alert.alert(title, body, [
          { text: "Cancel", style: "cancel" },
          { text: "Answer Questions", style: "default" },
        ]);
      }
      return;
    }
    const msg = "This marks the current line item prices as reviewed. You can still edit them later, but changing prices will require reconfirmation.";
    if (Platform.OS === "web") {
      if (!window.confirm(`Confirm prices?\n\n${msg}`)) return;
      doConfirmPrices();
    } else {
      Alert.alert("Confirm prices?", msg, [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm Prices", onPress: doConfirmPrices },
      ]);
    }
  };

  const doConfirmPrices = async () => {
    const confirmedAt = new Date().toISOString();
    confirmedPricingHashRef.current = computePricingHash(lineItems ?? []);
    setPricesConfirmed(true);
    onPricesConfirmedChange?.(true, confirmedAt);

    const formattedTotal = formatCurrency(currentSubtotal);
    const totalSentence = `The estimated total for this scope is ${formattedTotal}.`;
    const currentMsg = getValues("customerMessage") ?? "";
    const baseMsg = currentMsg.replace(CONFIRMED_TOTAL_RE, "").trimEnd();
    const updatedMsg = baseMsg ? `${baseMsg}\n\n${totalSentence}` : totalSentence;
    setValue("customerMessage", updatedMsg);

    await supabase.from("estimates").update({
      prices_confirmed: true,
      prices_confirmed_at: confirmedAt,
      customer_message: updatedMsg,
      status: "ready",
      updated_at: confirmedAt,
    }).eq("id", estimateId);
  };

  const handleRegenerate = async () => {
    const currentValues = getValues();
    const pairs: ClarifyingAnswer[] = missingQuestions
      .map((question, i) => ({ question, answer: answers[i]?.trim() ?? "" }))
      .filter((pair) => pair.answer.length > 0);

    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-estimate", {
        body: {
          jobType: job?.job_type ?? "",
          customer: {
            name: customer?.name ?? "",
            phone: customer?.phone ?? "",
            email: customer?.email ?? "",
          },
          notes: job?.notes ?? "",
          photoDescriptions: [],
          clarifyingAnswers: pairs.length > 0 ? pairs : undefined,
          previousAnswers: resolvedAnswerHistory,
          clarificationRound: clarificationRound,
          currentEstimate: {
            lineItems: currentValues.lineItems,
            jobSummary: currentValues.jobSummary,
            scopeOfWork: currentValues.scopeOfWork,
            missingQuestions: missingQuestions,
            assumptions: currentValues.assumptions,
            materialsChecklist: currentValues.materialsChecklist,
          },
        },
      });

      if (error) {
        let msg = error.message;
        try {
          const context = (error as unknown as { context?: Response }).context;
          if (context) {
            const body = await context.json();
            if (body?.error) msg = body.error;
          }
        } catch {}
        throw new Error(msg);
      }

      const payload = data as EstimatePayload;
      const subtotal = payload.lineItems.reduce(
        (sum, li) => sum + parseAmount(li.qty) * parseAmount(li.unit_price), 0
      );

      const newMissingQuestions = payload.missingQuestions ?? [];
      const resolvedThisRound: ClarifyingAnswer[] = pairs.filter(
        (pair) => !newMissingQuestions.some((q) => q === pair.question)
      );
      const mergedAnswers: ClarifyingAnswer[] = [
        ...resolvedAnswerHistory.filter((a) => !resolvedThisRound.some((r) => r.question === a.question)),
        ...resolvedThisRound,
      ];

      const regeneratePayload = {
        job_summary: payload.jobSummary,
        scope_of_work: payload.scopeOfWork,
        line_items: payload.lineItems,
        materials_checklist: payload.materialsChecklist,
        materials_checked: [],
        missing_questions: payload.missingQuestions,
        optional_questions: payload.optionalQuestions ?? [],
        clarifying_answers: mergedAnswers,
        assumptions: payload.assumptions,
        optional_upsells: payload.optionalUpsells,
        customer_message: payload.customerMessage,
        subtotal,
        total: subtotal,
        prices_confirmed: false,
        clarification_round: clarificationRound + 1,
        updated_at: new Date().toISOString(),
      };
      if (__DEV__) console.log("[EstimateEditor] Regenerate PATCH payload:", regeneratePayload);

      const { error: updateErr } = await supabase
        .from("estimates")
        .update(regeneratePayload)
        .eq("id", estimateId);

      if (updateErr) throw updateErr;

      setResolvedAnswerHistory(mergedAnswers);
      setClarificationRound(clarificationRound + 1);
      applyRegeneratedPayload(payload);
      setPricesConfirmed(false);
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Please try again.";
      Alert.alert("Update failed", msg);
    } finally {
      setRegenerating(false);
    }
  };

  const onSubmit = async (data: EstimatePayload) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveResult(null);
    setSaving(true);
    try {
      const subtotal = data.lineItems.reduce(
        (sum, li) => sum + parseAmount(li.qty) * parseAmount(li.unit_price), 0
      );
      const newStatus = computeEstimateStatus(data.lineItems, subtotal, missingQuestions.length, optionalQuestions.length);
      const clarifyingAnswerPairs: ClarifyingAnswer[] = missingQuestions
        .map((q, i) => ({ question: q, answer: answers[i] ?? "" }))
        .filter((pair) => pair.answer.length > 0);

      const savePayload = {
        job_summary: data.jobSummary,
        scope_of_work: data.scopeOfWork,
        line_items: data.lineItems,
        materials_checklist: data.materialsChecklist,
        materials_checked: materialsChecked,
        missing_questions: data.missingQuestions,
        optional_questions: optionalQuestions,
        clarifying_answers: resolvedAnswerHistory,
        assumptions: data.assumptions,
        optional_upsells: data.optionalUpsells,
        customer_message: data.customerMessage,
        subtotal,
        total: subtotal,
        status: newStatus,
        prices_confirmed: pricesConfirmed,
        prices_confirmed_at: pricesConfirmed ? new Date().toISOString() : null,
        clarification_round: clarificationRound,
        updated_at: new Date().toISOString(),
      };
      if (__DEV__) console.log("[EstimateEditor] Save PATCH payload:", savePayload);

      const { error } = await supabase
        .from("estimates")
        .update(savePayload)
        .eq("id", estimateId);

      if (error) throw error;
      onSaved?.(newStatus);
      setSaveResult("success");
      saveTimerRef.current = setTimeout(() => setSaveResult(null), 2000);
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Try again.";
      setSaveResult("error");
      setSaveErrorMsg(msg);
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
            scrollEnabled={false}
            onContentSizeChange={(e) =>
              setSummaryHeight(Math.max(80, e.nativeEvent.contentSize.height))
            }
            placeholder="Brief job description"
            placeholderTextColor={tokens.textTertiary}
            className="bg-app-surface border border-app-border rounded-2xl px-4 py-3 text-base text-app-text-primary"
            style={{ minHeight: 80, height: summaryHeight, ...(Platform.OS === "web" && { overflow: "hidden" }) }}
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
            scrollEnabled={false}
            onContentSizeChange={(e) =>
              setScopeHeight(Math.max(120, e.nativeEvent.contentSize.height))
            }
            placeholder="• Item 1&#10;• Item 2"
            placeholderTextColor={tokens.textTertiary}
            className="bg-app-surface border border-app-border rounded-2xl px-4 py-3 text-base text-app-text-primary"
            style={{ minHeight: 120, height: scopeHeight, ...(Platform.OS === "web" && { overflow: "hidden" }) }}
            textAlignVertical="top"
          />
        </View>

        {/* Line Items */}
        {currentSubtotal > 0 && (
          !pricesConfirmed ? (
            <View className="flex-row items-center justify-between gap-2 mb-3 px-1">
              <View className="flex-row items-center gap-2 flex-1">
                <View className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                <Text className="text-xs text-sky-700 flex-1 leading-4">
                  Draft pricing — review before sending.
                </Text>
              </View>
              <TouchableOpacity
                onPress={confirmPrices}
                className="bg-sky-100 border border-sky-200 rounded-lg px-3 py-1.5"
              >
                <Text className="text-xs font-semibold text-sky-700">Confirm Prices</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-center gap-2 mb-3 px-1">
              <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <Text className="text-xs text-green-700 leading-4">Prices confirmed.</Text>
            </View>
          )
        )}
        <LineItemsTable />

        {/* Materials */}
        <MaterialsChecklist
          items={materialsChecklist}
          onChange={(v) => setValue("materialsChecklist", v)}
          checked={materialsChecked}
          onCheckedChange={setMaterialsChecked}
        />

        {/* Job Photos */}
        {job?.id && <JobPhotosSection jobId={job.id} />}

        {/* Clarifying Questions — critical blockers */}
        {missingQuestions.length > 0 && (
          <QuestionsCard
            questions={missingQuestions}
            hasPricing={currentSubtotal > 0}
            customer={customer}
            job={job}
            answers={answers}
            onAnswersChange={setAnswers}
            regenerating={regenerating}
            onUpdateEstimate={handleRegenerate}
          />
        )}

        {/* Optional Details — helpful but not required */}
        {optionalQuestions.length > 0 && (
          <OptionalQuestionsCard questions={optionalQuestions} />
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
          {!pricesConfirmed && currentSubtotal > 0 && (
            <Text className="text-xs text-sky-600 mb-2 leading-4">
              Prices not yet confirmed — avoid referencing specific totals until confirmed.
            </Text>
          )}
          <TextInput
            value={watch("customerMessage")}
            onChangeText={(v) => setValue("customerMessage", v)}
            multiline
            scrollEnabled={false}
            onContentSizeChange={(e) =>
              setMessageHeight(Math.max(120, e.nativeEvent.contentSize.height))
            }
            placeholder="Professional message to include with the estimate"
            placeholderTextColor={tokens.textTertiary}
            className="bg-app-surface border border-app-border rounded-2xl px-4 py-3 text-base text-app-text-primary"
            style={{ minHeight: 120, height: messageHeight, ...(Platform.OS === "web" && { overflow: "hidden" }) }}
            textAlignVertical="top"
          />
        </View>

        <BottomCTA>
          <Toast
            visible={saveResult !== null}
            type={lastSaveResultRef.current}
            message={
              lastSaveResultRef.current === "success"
                ? "Changes saved"
                : saveErrorMsg || "Could not save changes. Please try again."
            }
          />
          <Button
            onPress={handleSubmit(onSubmit)}
            loading={saving}
            size="lg"
            className="w-full"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </BottomCTA>
      </ScrollView>
    </FormProvider>
  );
}
