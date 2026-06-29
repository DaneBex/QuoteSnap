import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { tokens } from "@/styles";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const errorCode = searchParams.get("error_code") ?? hashParams.get("error");
      if (errorCode) {
        const errorDescription = searchParams.get("error_description") ?? hashParams.get("error_description") ?? "";
        console.error("[auth/callback] OAuth error:", { errorCode, errorDescription });
        setError(`Auth error: ${errorCode}${errorDescription ? ` — ${errorDescription}` : ""}`);
        setTimeout(() => router.replace("/(auth)/login"), 5000);
        return;
      }

      const code = searchParams.get("code");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error("[auth/callback] exchangeCodeForSession error:", error);
          setError(`Sign-in failed: ${error.message}`);
          setTimeout(() => router.replace("/(auth)/login"), 5000);
          return;
        }
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setError("Sign-in failed. Please try again.");
          setTimeout(() => router.replace("/(auth)/login"), 3000);
          return;
        }
      } else {
        router.replace("/(auth)/login");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/(app)/dashboard");
      } else {
        router.replace("/(auth)/login");
      }
    }

    handleCallback();
  }, []);

  console.log("[auth/callback] Rendering callback screen", { error });

  if (error) {
    return (
      <View className="flex-1 bg-app-surface items-center justify-center px-6">
        <Text className="text-4xl mb-4">⚠️</Text>
        <Text className="text-lg font-semibold text-app-text-primary text-center mb-2">
          Link expired
        </Text>
        <Text className="text-app-text-secondary text-center">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-app-surface items-center justify-center">
      <ActivityIndicator size="large" color={tokens.accent} />
      <Text className="text-app-text-secondary mt-4">Signing you in…</Text>
    </View>
  );
}
