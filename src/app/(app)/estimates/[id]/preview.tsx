import {
  View,
  ActivityIndicator,
  Text,
  Platform,
  TouchableOpacity,
  Share,
} from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Printer, Share2 } from "lucide-react-native";
import { PageHeader } from "@/components/layout/PageHeader";
import { EstimatePreview } from "@/components/preview/EstimatePreview";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { tokens } from "@/styles";
import type { SavedEstimate, JobPhoto } from "@/types/estimate";

interface BusinessInfo {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  license_number: string | null;
  default_terms: string | null;
}

export default function PreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [estimate, setEstimate] = useState<SavedEstimate | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  // Inject print CSS on web
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const el = document.createElement("style");
    el.id = "qs-preview-print";
    el.textContent = `
      @media print {
        html, body {
          height: auto !important;
          overflow: visible !important;
          background: white !important;
        }
        #qs-app-header { display: none !important; }
        #qs-preview-page,
        #qs-preview-page > div {
          height: auto !important;
          overflow: visible !important;
          flex: none !important;
        }
        #qs-estimate-scroll,
        #qs-estimate-scroll > * {
          height: auto !important;
          overflow: visible !important;
          flex: none !important;
        }
      }
    `;
    document.head.appendChild(el);
    return () => document.getElementById("qs-preview-print")?.remove();
  }, []);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      const [estimateRes, businessRes] = await Promise.all([
        supabase
          .from("estimates")
          .select("*, jobs(id, job_type, notes, customers(id, name, phone, email, address))")
          .eq("id", id)
          .single(),
        supabase
          .from("businesses")
          .select("name, phone, email, address, logo_url, license_number, default_terms")
          .eq("user_id", user?.id ?? "")
          .limit(1)
          .maybeSingle(),
      ]);

      const estimateData = estimateRes.data as SavedEstimate;
      setEstimate(estimateData);
      setBusiness(businessRes.data as BusinessInfo);

      if (estimateData?.job_id) {
        const { data: photoData } = await supabase
          .from("job_photos")
          .select("*")
          .eq("job_id", estimateData.job_id)
          .eq("include_in_customer_estimate", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true });

        if (photoData?.length) {
          const withUrls = await Promise.all(
            photoData.map(async (p) => {
              const { data: urlData } = await supabase.storage
                .from("job-photos")
                .createSignedUrl(p.storage_path, 3600);
              return { ...p, signedUrl: urlData?.signedUrl ?? undefined };
            })
          );
          setPhotos(withUrls);
        }
      }

      setLoading(false);
    };
    load();
  }, [id]);

  const handleShare = async () => {
    if (Platform.OS === "web") {
      window.print();
      return;
    }
    try {
      await Share.share({
        message: [
          business?.name ? `${business.name} — Estimate` : "Estimate",
          estimate?.jobs?.customers?.name
            ? `Customer: ${estimate.jobs.customers.name}`
            : "",
          estimate?.job_summary ?? "",
          "",
          estimate ? "Prepared on " + formatDate(estimate.created_at) : "",
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch {
      // cancelled
    }
  };

  return (
    <View nativeID="qs-preview-page" className="flex-1 bg-app-surface" style={{ paddingTop: insets.top }}>
      <View nativeID="qs-app-header">
        <PageHeader
          title="Estimate Preview"
          showBack
          right={
            estimate ? (
              <TouchableOpacity
                onPress={handleShare}
                className="bg-app-accent rounded-xl px-3 py-2 flex-row items-center gap-1.5"
              >
                {Platform.OS === "web" ? (
                  <Printer size={15} color={tokens.textInverse} />
                ) : (
                  <Share2 size={15} color={tokens.textInverse} />
                )}
                <Text className="text-app-text-inverse font-semibold text-sm">
                  {Platform.OS === "web" ? "Print / PDF" : "Share"}
                </Text>
              </TouchableOpacity>
            ) : undefined
          }
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={tokens.accent} />
        </View>
      ) : estimate ? (
        <EstimatePreview
          estimate={estimate}
          businessName={business?.name}
          businessPhone={business?.phone ?? undefined}
          businessEmail={business?.email ?? undefined}
          businessAddress={business?.address ?? undefined}
          businessLogoUrl={business?.logo_url ?? undefined}
          businessLicense={business?.license_number ?? undefined}
          businessTerms={business?.default_terms ?? undefined}
          photos={photos}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-app-text-secondary">Estimate not found.</Text>
        </View>
      )}
    </View>
  );
}
