import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { BottomCTA } from "@/components/layout/BottomCTA";
import { Button } from "@/components/ui/Button";
import { useWizardStore } from "@/stores/wizardStore";
import { useDemoStore } from "@/stores/demoStore";
import { cn } from "@/lib/utils";

const JOB_TYPES = [
  { label: "Deck Repair", emoji: "🪵" },
  { label: "Fence Work", emoji: "🪨" },
  { label: "Painting", emoji: "🎨" },
  { label: "Drywall", emoji: "🧱" },
  { label: "Handyman", emoji: "🔧" },
  { label: "Landscaping", emoji: "🌿" },
  { label: "Pressure Washing", emoji: "💧" },
  { label: "Remodel", emoji: "🏠" },
  { label: "Describe My Own", emoji: "✏️" },
];

export function Step1JobType() {
  const { jobType, setJobType, setStep } = useWizardStore();
  const isDemoActive = useDemoStore((s) => s.phase === "walkthrough");
  const [customType, setCustomType] = useState(
    JOB_TYPES.some((t) => t.label === jobType) ? "" : jobType
  );
  const [showCustom, setShowCustom] = useState(
    jobType !== "" && !JOB_TYPES.some((t) => t.label === jobType)
  );

  const selected = showCustom ? customType : jobType;

  const handlePreset = (label: string) => {
    if (label === "Describe My Own") {
      setShowCustom(true);
      setJobType("");
    } else {
      setShowCustom(false);
      setCustomType("");
      setJobType(label);
    }
  };

  const canContinue = selected.trim().length > 0;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 100, ...(isDemoActive ? { flexGrow: 1, justifyContent: "flex-end" } : {}) }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-2xl font-bold text-app-text-primary mb-1">What's the job?</Text>
      <Text className="text-app-text-secondary mb-6">Pick a type or describe it yourself.</Text>

      <View className="flex-row flex-wrap gap-3 mb-6">
        {JOB_TYPES.map((type) => {
          const isSelected =
            type.label === "Describe My Own"
              ? showCustom
              : jobType === type.label && !showCustom;
          return (
            <TouchableOpacity
              key={type.label}
              onPress={() => handlePreset(type.label)}
              className={cn(
                "flex-row items-center px-4 py-3 rounded-2xl border-2",
                isSelected
                  ? "bg-app-accent border-app-accent"
                  : "bg-app-surface border-app-border"
              )}
              activeOpacity={0.7}
            >
              <Text className="text-lg mr-1.5">{type.emoji}</Text>
              <Text
                className={cn(
                  "font-semibold text-base",
                  isSelected ? "text-app-text-inverse" : "text-app-text-secondary"
                )}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showCustom && (
        <Input
          label="Describe the job"
          placeholder="e.g. Basement stair repair, garage drywall patch, fence gate replacement"
          value={customType}
          onChangeText={(t) => {
            setCustomType(t);
            setJobType(t);
          }}
          autoFocus
        />
      )}

      <BottomCTA>
        <Button
          onPress={() => setStep(2)}
          disabled={!canContinue}
          size="lg"
          className="w-full"
        >
          Continue
        </Button>
      </BottomCTA>
    </ScrollView>
  );
}
