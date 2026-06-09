import { View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomCTAProps {
  children: React.ReactNode;
}

export function BottomCTA({ children }: BottomCTAProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3"
      style={{ paddingBottom: Math.max(insets.bottom, 16) }}
    >
      {children}
    </View>
  );
}
