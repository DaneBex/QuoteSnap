import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { supabase } from "@/lib/supabase";
import { View, ActivityIndicator } from "react-native";
import { tokens } from "@/styles";
import { OnboardingDemo } from "@/components/onboarding/OnboardingDemo";
import type { Session } from "@supabase/supabase-js";

export default function AppLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return; // still loading

    const inApp = segments[0] === "(app)";
    if (!session && inApp) {
      router.replace("/(auth)/login");
    }
  }, [session, segments]);

  if (session === undefined) {
    return (
      <View className="flex-1 bg-app-surface items-center justify-center">
        <ActivityIndicator size="large" color={tokens.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="estimates/new" />
        <Stack.Screen name="estimates/[id]" />
        <Stack.Screen name="estimates/[id]/preview" />
      </Stack>
      <OnboardingDemo />
    </View>
  );
}
