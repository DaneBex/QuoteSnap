import { View, ActivityIndicator, Text } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageHeader } from "@/components/layout/PageHeader";
import { EstimatePreview } from "@/components/preview/EstimatePreview";
import { supabase } from "@/lib/supabase";
import { tokens } from "@/styles";
import type { SavedEstimate } from "@/types/estimate";

export default function PreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [estimate, setEstimate] = useState<SavedEstimate | null>(null);
  const [business, setBusiness] = useState<{ name: string; phone: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [estimateRes, businessRes] = await Promise.all([
        supabase
          .from("estimates")
          .select("*, jobs(id, job_type, notes, customers(id, name, phone, email, address))")
          .eq("id", id)
          .single(),
        supabase.from("businesses").select("name, phone").single(),
      ]);
      setEstimate(estimateRes.data as SavedEstimate);
      setBusiness(businessRes.data);
      setLoading(false);
    };
    load();
  }, [id]);

  return (
    <View className="flex-1 bg-app-surface" style={{ paddingTop: insets.top }}>
      <PageHeader title="Estimate Preview" showBack />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      ) : estimate ? (
        <EstimatePreview
          estimate={estimate}
          businessName={business?.name}
          businessPhone={business?.phone ?? undefined}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-app-text-secondary">Estimate not found.</Text>
        </View>
      )}
    </View>
  );
}
