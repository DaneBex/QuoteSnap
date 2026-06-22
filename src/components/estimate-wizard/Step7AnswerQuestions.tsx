import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useWizardStore } from "@/stores/wizardStore";
import { tokens } from "@/styles";

export function Step7AnswerQuestions() {
  const insets = useSafeAreaInsets();
  const { generatedEstimate, setClarifyingAnswers, setDraftWithAssumptions, setStep } = useWizardStore();

  const questions = generatedEstimate?.missingQuestions ?? [];
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""));

  const handleRegenerate = () => {
    const pairs = questions
      .map((question, i) => ({ question, answer: answers[i].trim() }))
      .filter((pair) => pair.answer.length > 0);
    setClarifyingAnswers(pairs);
    setStep(5);
  };

  const handleDraftWithAssumptions = () => {
    const pairs = questions
      .map((question, i) => ({ question, answer: answers[i].trim() }))
      .filter((pair) => pair.answer.length > 0);
    if (pairs.length > 0) {
      setClarifyingAnswers(pairs);
    }
    setDraftWithAssumptions(true);
    setStep(5);
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => setStep(6)}
          className="flex-row items-center gap-1 mb-4"
        >
          <ChevronLeft size={18} color={tokens.textSecondary} />
          <Text className="text-app-text-secondary text-sm">Back to review</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-app-text-primary mb-1">
          Clarify Details
        </Text>
        <Text className="text-app-text-secondary mb-6 leading-5">
          Answer what you can to improve accuracy. Or skip ahead and let the app fill in reasonable assumptions.
        </Text>

        {questions.map((question, i) => (
          <Card key={i} className="mb-4">
            <Text className="text-app-text-primary font-medium mb-2 leading-5">
              {question}
            </Text>
            <TextInput
              value={answers[i]}
              onChangeText={(v) => {
                const updated = [...answers];
                updated[i] = v;
                setAnswers(updated);
              }}
              multiline
              placeholder="Your answer…"
              placeholderTextColor={tokens.textTertiary}
              className="bg-app-surface-alt border border-app-border rounded-xl px-4 py-3 text-base text-app-text-primary"
              style={{ minHeight: 64 }}
              textAlignVertical="top"
            />
          </Card>
        ))}
      </ScrollView>

      <View
        className="bg-app-surface border-t border-app-border px-4 pt-3 gap-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Button onPress={handleRegenerate} size="lg" className="w-full">
          Update Estimate
        </Button>
        <Button
          onPress={handleDraftWithAssumptions}
          size="lg"
          variant="secondary"
          className="w-full"
        >
          Create Draft With Assumptions
        </Button>
        <Button
          onPress={() => setStep(6)}
          size="lg"
          variant="ghost"
          className="w-full"
        >
          Skip — Keep Draft
        </Button>
      </View>
    </View>
  );
}
