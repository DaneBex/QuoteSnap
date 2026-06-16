import { View } from "react-native";
import { StepIndicator } from "@/components/layout/StepIndicator";
import { Step1JobType } from "./Step1JobType";
import { Step2Customer } from "./Step2Customer";
import { Step3Photos } from "./Step3Photos";
import { Step4Notes } from "./Step4Notes";
import { Step5Generating } from "./Step5Generating";
import { Step6Review } from "./Step6Review";
import { Step7AnswerQuestions } from "./Step7AnswerQuestions";
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
  const isGenerating = useWizardStore((s) => s.isGenerating);
  const setStep = useWizardStore((s) => s.setStep);

  const showBack = currentStep >= 2 && currentStep <= 6 && !(currentStep === 5 && isGenerating);

  const handleBack = () => {
    if (currentStep === 6 || currentStep === 5) {
      setStep(4);
    } else {
      setStep(currentStep - 1);
    }
  };

  return (
    <View className="flex-1 bg-app-background">
      {currentStep <= 6 && (
        <StepIndicator
          total={STEP_LABELS.length}
          current={currentStep}
          labels={STEP_LABELS}
          onBack={showBack ? handleBack : undefined}
        />
      )}
      {currentStep === 1 && <Step1JobType />}
      {currentStep === 2 && <Step2Customer />}
      {currentStep === 3 && <Step3Photos />}
      {currentStep === 4 && <Step4Notes />}
      {currentStep === 5 && <Step5Generating />}
      {currentStep === 6 && <Step6Review />}
      {currentStep === 7 && <Step7AnswerQuestions />}
    </View>
  );
}
