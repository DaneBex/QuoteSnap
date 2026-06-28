import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Linking,
} from "react-native";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus, Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EstimateCard } from "@/components/dashboard/EstimateCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { supabase } from "@/lib/supabase";
import { hasDemoBeenSeen } from "@/lib/demo";
import { useDemoStore } from "@/stores/demoStore";
import { useWizardStore } from "@/stores/wizardStore";
import { tokens } from "@/styles";
import type { SavedEstimate } from "@/types/estimate";

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const resetWizard = useWizardStore((s) => s.reset);
  const { showWelcome, setDemoEstimateId, phase, step } = useDemoStore();
  const [estimates, setEstimates] = useState<SavedEstimate[]>([]);
  const [totalCreated, setTotalCreated] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEstimates = useCallback(async () => {
    const [{ data }, { data: userRow }] = await Promise.all([
      supabase
        .from("estimates")
        .select(`*, jobs(id, job_type, notes, customers(id, name, phone, email, address))`)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("users")
        .select("total_estimates_created")
        .single(),
    ]);

    const rows = (data as SavedEstimate[]) ?? [];
    setEstimates(rows);
    setDemoEstimateId(rows[0]?.id ?? null);
    setTotalCreated((userRow as { total_estimates_created: number } | null)?.total_estimates_created ?? 0);
  }, [setDemoEstimateId]);

  useEffect(() => {
    const init = async () => {
      await fetchEstimates();
      setLoading(false);
      const seen = await hasDemoBeenSeen();
      if (!seen) showWelcome();
      hasInitialized.current = true;
    };
    init();
  }, [fetchEstimates, showWelcome]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEstimates();
    setRefreshing(false);
  }, [fetchEstimates]);

  const hasInitialized = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasInitialized.current) return;
      fetchEstimates();
    }, [fetchEstimates])
  );

  const isDemoFab = phase === "walkthrough" && step === "dashboard";
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isDemoFab) {
      pulseAnim.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isDemoFab]);

  const BETA_LIMIT = 3;
  const betaUsed = totalCreated;
  const atBetaLimit = betaUsed >= BETA_LIMIT;

  const handleNewEstimate = () => {
    resetWizard();
    router.push("/(app)/estimates/new");
  };

  return (
    <View className="flex-1 bg-app-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-app-surface px-4 py-4 border-b border-app-border flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-app-text-primary">QuoteSnap</Text>
          <Text className="text-sm text-app-text-secondary">Your estimates</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(app)/settings")}
          className="w-10 h-10 items-center justify-center"
          disabled={isDemoFab}
        >
          <Settings size={24} color={tokens.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      ) : estimates.length === 0 ? (
        <EmptyState onRunDemo={showWelcome} />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text className="text-sm font-semibold text-app-text-tertiary uppercase tracking-wide mb-3">
            Recent
          </Text>
          <View pointerEvents={isDemoFab ? "none" : "auto"}>
            {estimates.map((estimate) => (
              <EstimateCard key={estimate.id} estimate={estimate} />
            ))}
          </View>
        </ScrollView>
      )}

      {/* New Estimate FAB */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 bg-transparent"
        style={{ paddingBottom: Math.max(insets.bottom + 8, 16) }}
      >
        {/* Beta usage counter */}
        {!loading && (
          <Text className="text-xs text-app-text-tertiary text-center mb-2">
            Beta estimates used: {Math.min(betaUsed, BETA_LIMIT)} / {BETA_LIMIT}
          </Text>
        )}

        {atBetaLimit ? (
          <View className="bg-app-surface border border-app-border rounded-2xl p-4">
            <Text className="text-app-text-primary font-semibold text-base mb-1">
              Beta limit reached
            </Text>
            <Text className="text-app-text-secondary text-sm leading-5 mb-3">
              You've used your 3 free beta estimates. I'm keeping the beta small while collecting contractor feedback. If QuoteSnap is useful and you want more access, send me a quick note and I'll unlock more estimates.
            </Text>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  "mailto:danebecker790@gmail.com?subject=QuoteSnap%20Beta%20Access%20Request"
                )
              }
              className="bg-stone-700 rounded-xl py-3 items-center"
              activeOpacity={0.85}
            >
              <Text className="text-white font-semibold text-base">
                Request More Beta Access
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ position: "relative" }}>
            {isDemoFab && (
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: 20,
                    borderWidth: 3,
                    borderColor: "white",
                    opacity: pulseAnim,
                    top: -3,
                    left: -3,
                    right: -3,
                    bottom: -3,
                    zIndex: 10,
                  },
                ]}
              />
            )}
            <TouchableOpacity
              onPress={handleNewEstimate}
              className="bg-app-accent rounded-2xl py-4 flex-row items-center justify-center gap-2 shadow-lg"
              activeOpacity={0.85}
            >
              <Plus size={24} color={tokens.textInverse} />
              <Text className="text-app-text-inverse font-bold text-lg">New Estimate</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
