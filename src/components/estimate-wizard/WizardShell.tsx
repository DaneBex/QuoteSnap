import { View } from "react-native";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { Step1JobType } from "./Step1JobType";
import { Step2Customer } from "./Step2Customer";
import { Step3Photos } from "./Step3Photos";
import { Step4Notes } from "./Step4Notes";
import { Step5Generating } from "./Step5Generating";
import { Step6Review } from "./Step6Review";
import { useWizardStore } from "@/stores/wizardStore";

const STEP_LABELS = [
  "Job Type",
  "Customer",
  "Photos",
  "Notes",
  "Generating",
  "Review",
];

export function WizardShell() {
  const currentStep = useWizardStore((s) => s.currentStep);

  return (
    <View className="flex-1 bg-app-background">
      <StepIndicator
        total={STEP_LABELS.length}
        current={currentStep}
        labels={STEP_LABELS}
      />
      {currentStep === 1 && <Step1JobType />}
      {currentStep === 2 && <Step2Customer />}
      {currentStep === 3 && <Step3Photos />}
      {currentStep === 4 && <Step4Notes />}
      {currentStep === 5 && <Step5Generating />}
      {currentStep === 6 && <Step6Review />}
    </View>
  );
}
