import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { tokens } from "@/styles";
import { useDemoStore, type WalkthroughStep } from "@/stores/demoStore";
import { useWizardStore } from "@/stores/wizardStore";
import { markDemoSeen } from "@/lib/demo";

// ─── Step data ───────────────────────────────────────────────────────────────

const STEP_ORDER: WalkthroughStep[] = [
  "dashboard",
  "newEstimate",
  "customerInfo",
  "photosNotes",
  "aiDraft",
  "reviewDraft",
  "answerQuestions",
  "editor",
  "confirmPrices",
  "preview",
  "finish",
];

const STEP_CONTENT: Record<
  WalkthroughStep,
  { title: string; body: string; action?: string }
> = {
  dashboard: {
    title: "Dashboard",
    body: "Your saved estimates live here.",
    action: "Tap New Estimate below to begin",
  },
  newEstimate: {
    title: "Choose a Job Type",
    body: "Start by selecting what kind of job this is.",
    action: "Select a job type to continue",
  },
  customerInfo: {
    title: "Customer Info",
    body: "Add your customer's name, address, and contact details. Only the name is required.",
    action: "Fill in the details, then tap Continue",
  },
  photosNotes: {
    title: "Add Photos & Notes",
    body: "Add jobsite photos and rough notes — QuoteSnap turns them into a professional estimate.",
    action: "Fill in the details, then tap Generate",
  },
  aiDraft: {
    title: "Generating Estimate",
    body: "AI is drafting your estimate. If details are missing, it will ask follow-up questions.",
  },
  reviewDraft: {
    title: "Review the Draft",
    body: "The AI has generated a draft estimate. If questions are shown, answer them to get full pricing — or save the scope draft and come back later.",
    action: "Answer questions or save the draft",
  },
  answerQuestions: {
    title: "Answer Follow-Up Questions",
    body: "These details let the AI price the job accurately. Fill in your answers and tap Update Estimate to get a complete estimate.",
    action: "Fill in answers, then tap Update Estimate",
  },
  editor: {
    title: "Review Your Draft",
    body: "Edit the summary, scope, line items, materials, and customer message here.",
    action: "Review the estimate draft",
  },
  confirmPrices: {
    title: "Confirm Prices",
    body: "AI drafts pricing but you have the final say before the estimate is Ready to Send.",
    action: "Tap Confirm Prices to finalize",
  },
  preview: {
    title: "Customer Preview",
    body: "This is the customer-facing estimate — scope, pricing, terms, and signature lines.",
    action: "Scroll through the preview",
  },
  finish: {
    title: "You're Ready!",
    body: "Create a real estimate and preview the PDF before sending to your first customer.",
  },
};

function stepIndex(s: WalkthroughStep) {
  return STEP_ORDER.indexOf(s);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingDemo() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { phase, step, startWalkthrough, setStep, close } = useDemoStore();
  const wizardStep = useWizardStore((s) => s.currentStep);
  const generatedEstimate = useWizardStore((s) => s.generatedEstimate);
  const jobType = useWizardStore((s) => s.jobType);
  const customerName = useWizardStore((s) => s.customer.name);
  const photos = useWizardStore((s) => s.photos);
  const notes = useWizardStore((s) => s.notes);
  const { height } = useWindowDimensions();
  const isSmallScreen = height < 870;

  // ── Auto-advance: route changes ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "walkthrough") return;
    const curr = stepIndex(step);

    if (/\/estimates\/[^/]+\/preview/.test(pathname)) {
      if (curr < stepIndex("preview")) setStep("preview");
    } else if (/\/estimates\/[^/]+/.test(pathname) && !pathname.includes("/preview") && !pathname.includes("/new")) {
      if (curr < stepIndex("editor")) setStep("editor");
    } else if (pathname.includes("/estimates/new")) {
      if (curr < stepIndex("newEstimate")) setStep("newEstimate");
    }
  }, [pathname, phase]);

  // ── Auto-advance: wizard sub-steps ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== "walkthrough" || !pathname.includes("/estimates/new")) return;
    const curr = stepIndex(step);
    if (wizardStep >= 2 && curr < stepIndex("customerInfo")) setStep("customerInfo");
    if (wizardStep >= 3 && curr < stepIndex("photosNotes")) setStep("photosNotes");
    if (wizardStep >= 5 && curr < stepIndex("aiDraft")) setStep("aiDraft");
    if (wizardStep >= 6 && curr < stepIndex("reviewDraft")) setStep("reviewDraft");
    if (wizardStep >= 7 && curr < stepIndex("answerQuestions")) setStep("answerQuestions");
    // When user regenerates from step 7 back to step 5, advance the demo past answerQuestions
    if (wizardStep === 5 && step === "answerQuestions") setStep("aiDraft");
  }, [wizardStep, phase, pathname]);


  if (phase === "idle") return null;

  const handleSkip = () => {
    markDemoSeen();
    close();
  };

  const handleFinish = () => {
    markDemoSeen();
    close();
    router.push("/(app)/dashboard");
  };

  // ── Welcome screen ─────────────────────────────────────────────────────────

  if (phase === "welcome") {
    return (
      <View style={[StyleSheet.absoluteFill, styles.welcomeBackdrop]}>
        <View style={styles.welcomeCard} className="bg-app-surface rounded-2xl overflow-hidden">
          <View className="bg-app-accent h-1.5" />
          <View style={styles.welcomeInner}>
            <Text className="text-2xl font-bold text-app-text-primary mb-3">
              Welcome to QuoteSnap
            </Text>
            <Text className="text-base text-app-text-secondary leading-6 mb-5">
              QuoteSnap helps contractors turn job notes, photos, and pricing
              review into a professional customer estimate.
            </Text>
            <Text className="text-base font-semibold text-app-text-primary mb-6">
              Want a quick 60-second walkthrough?
            </Text>
            <Button onPress={startWalkthrough} size="lg" className="w-full mb-3">
              Start Demo
            </Button>
            <TouchableOpacity onPress={handleSkip} className="items-center py-3">
              <Text className="text-base text-app-text-secondary font-medium">
                Skip for now
              </Text>
            </TouchableOpacity>
            <Text className="text-xs text-app-text-tertiary text-center mt-4">
              You can replay this anytime from Settings.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── Walkthrough card ───────────────────────────────────────────────────────

  const idx = stepIndex(step);
  const isLast = step === "finish";
  const hasQuestions = (generatedEstimate?.missingQuestions?.length ?? 0) > 0;
  const content = step === "reviewDraft" && !hasQuestions
    ? { ...STEP_CONTENT.reviewDraft, action: "Save the draft" }
    : STEP_CONTENT[step];

  const isWizardFormStep = step === "newEstimate" || step === "customerInfo" || step === "photosNotes";
  const isInteracted =
    (step === "newEstimate"  && jobType !== "") ||
    (step === "customerInfo" && customerName !== "") ||
    (step === "photosNotes"  && (photos.length > 0 || notes !== ""));

  // Compact strip: full-screen content steps + customerInfo/photosNotes on small phones
  const isCompactStep = step === "reviewDraft" || step === "answerQuestions" ||
    (isSmallScreen && (step === "customerInfo" || step === "photosNotes"));

  const cardPositionStyle =
    step === "dashboard"
      ? { top: insets.top + 80, left: 16, right: 16 }
    : isCompactStep
      ? { top: insets.top, left: 16, right: 16 }
    : (isWizardFormStep && isInteracted)
      ? { top: insets.top + 60, left: 16, right: 16 }
    : { bottom: Math.max(insets.bottom + 12, 20), left: 16, right: 16 };

  // ── Compact card layout (no body text, same card shape) ───────────────────
  if (isCompactStep) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View
          style={[styles.walkthroughCard, cardPositionStyle]}
          className="bg-app-surface rounded-2xl border border-app-border overflow-hidden"
          pointerEvents="auto"
        >
          {/* Step counter + dots + close */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-1">
            <Text className="text-xs font-semibold text-app-text-tertiary uppercase tracking-wide">
              Step {idx + 1} of {STEP_ORDER.length}
            </Text>
            <TouchableOpacity onPress={handleSkip} className="p-1" hitSlop={8}>
              <X size={18} color={tokens.textTertiary} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center gap-1.5 px-5 pb-3">
            {STEP_ORDER.map((_, i) => (
              <View
                key={i}
                className="h-1.5 rounded-full"
                style={{
                  width: i === idx ? 20 : 6,
                  backgroundColor: i <= idx ? tokens.accent : tokens.border,
                }}
              />
            ))}
          </View>

          {/* Title + action hint — no body paragraph */}
          <View className="px-5 pb-4">
            <Text className="text-base font-bold text-app-text-primary mb-2">
              {content.title}
            </Text>
            {content.action && (
              <View className="flex-row items-center gap-2">
                <View
                  style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tokens.accent }}
                />
                <Text className="text-sm font-semibold text-app-accent">
                  {content.action}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ── Full card layout ───────────────────────────────────────────────────────
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View
        style={[styles.walkthroughCard, cardPositionStyle]}
        className="bg-app-surface rounded-2xl border border-app-border"
        pointerEvents="auto"
      >
        {/* Header: step counter + close */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-1">
          <Text className="text-xs font-semibold text-app-text-tertiary uppercase tracking-wide">
            Step {idx + 1} of {STEP_ORDER.length}
          </Text>
          <TouchableOpacity onPress={handleSkip} className="p-1" hitSlop={8}>
            <X size={18} color={tokens.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Progress dots — filled up to current step */}
        <View className="flex-row items-center gap-1.5 px-5 py-2">
          {STEP_ORDER.map((_, i) => (
            <View
              key={i}
              className="h-1.5 rounded-full"
              style={{
                width: i === idx ? 20 : 6,
                backgroundColor: i <= idx ? tokens.accent : tokens.border,
              }}
            />
          ))}
        </View>

        {/* Content */}
        <View className="px-5 pt-2 pb-5">
          <Text className="text-lg font-bold text-app-text-primary mb-1.5">
            {content.title}
          </Text>
          <Text className="text-sm text-app-text-secondary leading-6">
            {content.body}
          </Text>

          {/* Task instruction — what the user must do to advance */}
          {content.action && (
            <View className="flex-row items-center mt-3 gap-2">
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: tokens.accent,
                }}
              />
              <Text className="text-sm font-semibold text-app-accent">
                {content.action}
              </Text>
            </View>
          )}

          {/* Review steps get a manual advance button */}
          {step === "editor" && (
            <Button onPress={() => setStep("confirmPrices")} size="md" className="mt-4 w-full">
              I've reviewed
            </Button>
          )}
          {step === "preview" && (
            <Button onPress={() => setStep("finish")} size="md" className="mt-4 w-full">
              I've reviewed
            </Button>
          )}

          {/* Only the final step has a button */}
          {isLast && (
            <Button onPress={handleFinish} size="md" className="mt-4 w-full">
              Finish Demo
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeBackdrop: {
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  welcomeCard: {
    width: "100%",
    maxWidth: 420,
  },
  welcomeInner: {
    padding: 28,
  },
  walkthroughCard: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
});
