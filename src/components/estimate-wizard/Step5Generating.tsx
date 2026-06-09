import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react-native";
import { useWizardStore } from "@/stores/wizardStore";
import { supabase } from "@/lib/supabase";
import { tokens } from "@/styles";
import type { EstimatePayload } from "@/types/estimate";

const MESSAGES = [
  "Reading your notes…",
  "Organizing the scope of work…",
  "Building line items…",
  "Writing the customer message…",
  "Almost done…",
];

export function Step5Generating() {
  const {
    jobType,
    customer,
    notes,
    photos,
    isGenerating,
    generationError,
    setIsGenerating,
    setGeneratedEstimate,
    setGenerationError,
    setStep,
  } = useWizardStore();

  const generate = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-estimate", {
        body: {
          jobType,
          customer,
          notes,
          photoDescriptions: photos
            .map((p) => p.description)
            .filter(Boolean),
        },
      });

      if (error) {
        // Try to surface the real error body from the edge function
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
      setGeneratedEstimate(payload);
      setStep(6);
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generate();
  }, []);

  if (generationError) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-16 h-16 bg-app-danger-light rounded-full items-center justify-center mb-4">
          <AlertCircle size={32} color={tokens.danger} />
        </View>
        <Text className="text-xl font-bold text-app-text-primary text-center mb-2">
          Generation failed
        </Text>
        <Text className="text-app-text-secondary text-center mb-8 leading-6">
          {generationError}
        </Text>
        <TouchableOpacity
          onPress={generate}
          className="bg-app-accent rounded-2xl px-8 py-4 flex-row items-center gap-2"
        >
          <RefreshCw size={20} color={tokens.textInverse} />
          <Text className="text-app-text-inverse font-bold text-base">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 bg-app-accent-light rounded-full items-center justify-center mb-6">
        <ActivityIndicator size="large" color={tokens.accent} />
      </View>
      <Text className="text-2xl font-bold text-app-text-primary text-center mb-3">
        Generating estimate…
      </Text>
      <Text className="text-app-text-secondary text-center leading-6">
        The AI is turning your notes into a professional proposal. This usually takes 10–20 seconds.
      </Text>
    </View>
  );
}
