import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { Plus, Settings } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EstimateCard } from "@/components/dashboard/EstimateCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { supabase } from "@/lib/supabase";
import { useWizardStore } from "@/stores/wizardStore";
import type { SavedEstimate } from "@/types/estimate";

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const resetWizard = useWizardStore((s) => s.reset);
  const [estimates, setEstimates] = useState<SavedEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEstimates = useCallback(async () => {
    const { data } = await supabase
      .from("estimates")
      .select(
        `*, jobs(id, job_type, notes, customers(id, name, phone, email, address))`
      )
      .order("created_at", { ascending: false })
      .limit(50);

    setEstimates((data as SavedEstimate[]) ?? []);
  }, []);

  useEffect(() => {
    fetchEstimates().finally(() => setLoading(false));
  }, [fetchEstimates]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEstimates();
    setRefreshing(false);
  }, [fetchEstimates]);

  const handleNewEstimate = () => {
    resetWizard();
    router.push("/(app)/estimates/new");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-gray-900">QuoteSnap</Text>
          <Text className="text-sm text-gray-500">Your estimates</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(app)/settings")}
          className="w-10 h-10 items-center justify-center"
        >
          <Settings size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : estimates.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Recent
          </Text>
          {estimates.map((estimate) => (
            <EstimateCard key={estimate.id} estimate={estimate} />
          ))}
        </ScrollView>
      )}

      {/* New Estimate FAB */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pb-4 bg-transparent"
        style={{ paddingBottom: Math.max(insets.bottom + 8, 16) }}
      >
        <TouchableOpacity
          onPress={handleNewEstimate}
          className="bg-blue-600 rounded-2xl py-4 flex-row items-center justify-center gap-2 shadow-lg"
          activeOpacity={0.85}
        >
          <Plus size={24} color="#fff" />
          <Text className="text-white font-bold text-lg">New Estimate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
