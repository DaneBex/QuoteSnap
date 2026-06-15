import { useEffect, useRef, useState } from "react";
import { Animated, View, Text } from "react-native";

interface ToastProps {
  visible: boolean;
  type?: "success" | "error";
  message: string;
}

export function Toast({ visible, type = "success", message }: ToastProps) {
  const [mounted, setMounted] = useState(visible);
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(visible ? 0 : 8)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 8, duration: 150, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  const isSuccess = type === "success";

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }} className="mb-2">
      <View
        className={
          isSuccess
            ? "bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex-row items-center gap-2"
            : "bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex-row items-center gap-2"
        }
      >
        <Text className={isSuccess ? "text-green-600 font-semibold text-base" : "text-red-600 font-semibold text-base"}>
          {isSuccess ? "✓" : "✕"}
        </Text>
        <Text className={isSuccess ? "text-green-700 font-medium text-sm flex-1" : "text-red-700 font-medium text-sm flex-1"}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
