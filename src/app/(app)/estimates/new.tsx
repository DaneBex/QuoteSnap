import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { X } from "lucide-react-native";
import { WizardShell } from "@/components/estimate-wizard/WizardShell";
import { useWizardStore } from "@/stores/wizardStore";
import { useDemoStore } from "@/stores/demoStore";
import { tokens } from "@/styles";

export default function NewEstimateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reset = useWizardStore((s) => s.reset);
  const { phase, close: closeDemo } = useDemoStore();

  const handleClose = () => {
    reset();
    if (phase !== "idle") closeDemo();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(app)/dashboard");
    }
  };

  return (
    <View className="flex-1 bg-app-background" style={{ paddingTop: insets.top }}>
      {/* Close button */}
      <View className="absolute top-0 right-0 z-10" style={{ top: insets.top + 8 }}>
        <TouchableOpacity
          onPress={handleClose}
          className="w-10 h-10 items-center justify-center mr-3"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={22} color={tokens.textSecondary} />
        </TouchableOpacity>
      </View>
      <WizardShell />
    </View>
  );
}
