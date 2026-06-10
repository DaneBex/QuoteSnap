import { ScrollView, View, Text, TouchableOpacity, Share, Platform } from "react-native";
import { Printer, Share2 } from "lucide-react-native";
import { formatCurrency, formatDate } from "@/lib/utils";
import { tokens } from "@/styles";
import type { SavedEstimate } from "@/types/estimate";

interface EstimatePreviewProps {
  estimate: SavedEstimate;
  businessName?: string;
  businessPhone?: string;
}

function Divider() {
  return <View className="h-px bg-app-border my-4" />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-xs font-bold text-app-text-tertiary uppercase tracking-widest mb-2">
        {title}
      </Text>
      {children}
    </View>
  );
}

export function EstimatePreview({
  estimate,
  businessName,
  businessPhone,
}: EstimatePreviewProps) {
  const customer = estimate.jobs?.customers;
  const lineItems = estimate.line_items ?? [];
  const subtotal = estimate.subtotal ?? 0;

  const handleShare = async () => {
    if (Platform.OS === "web") {
      window.print();
      return;
    }
    try {
      await Share.share({
        message: [
          businessName ? `${businessName} — Estimate` : "Estimate",
          customer ? `Customer: ${customer.name}` : "",
          estimate.job_summary ?? "",
          "",
          "Prepared on " + formatDate(estimate.created_at),
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch {
      // cancelled
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-app-surface"
      contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-start mb-6">
        <View>
          <Text className="text-2xl font-bold text-app-text-primary">
            {businessName ?? "Estimate"}
          </Text>
          {businessPhone && (
            <Text className="text-app-text-secondary mt-0.5">{businessPhone}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleShare}
          className="bg-app-accent rounded-xl px-4 py-2.5 flex-row items-center gap-2"
        >
          {Platform.OS === "web" ? (
            <Printer size={18} color={tokens.textInverse} />
          ) : (
            <Share2 size={18} color={tokens.textInverse} />
          )}
          <Text className="text-app-text-inverse font-semibold">
            {Platform.OS === "web" ? "Print / PDF" : "Share"}
          </Text>
        </TouchableOpacity>
      </View>

      <Divider />

      {/* Customer Info */}
      {customer && (
        <Section title="Prepared For">
          <Text className="text-app-text-primary font-semibold text-base">{customer.name}</Text>
          {customer.address && (
            <Text className="text-app-text-secondary">{customer.address}</Text>
          )}
          {customer.phone && (
            <Text className="text-app-text-secondary">{customer.phone}</Text>
          )}
          {customer.email && (
            <Text className="text-app-text-secondary">{customer.email}</Text>
          )}
        </Section>
      )}

      <View className="flex-row justify-between mb-6">
        <View>
          <Text className="text-xs text-app-text-tertiary uppercase tracking-wide">Job Type</Text>
          <Text className="text-app-text-primary font-medium mt-0.5">
            {estimate.jobs?.job_type ?? "—"}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-app-text-tertiary uppercase tracking-wide">Date</Text>
          <Text className="text-app-text-primary font-medium mt-0.5">
            {formatDate(estimate.created_at)}
          </Text>
        </View>
      </View>

      <Divider />

      {/* Summary */}
      {estimate.job_summary && (
        <Section title="Job Summary">
          <Text className="text-app-text-secondary leading-6">{estimate.job_summary}</Text>
        </Section>
      )}

      {/* Scope */}
      {estimate.scope_of_work && (
        <Section title="Scope of Work">
          <Text className="text-app-text-secondary leading-6">{estimate.scope_of_work}</Text>
        </Section>
      )}

      <Divider />

      {/* Line Items */}
      <Section title="Pricing Breakdown">
        {/* Header row */}
        <View className="flex-row pb-2 border-b border-app-border">
          <Text className="flex-1 text-xs font-bold text-app-text-secondary uppercase">Description</Text>
          <Text className="w-12 text-xs font-bold text-app-text-secondary uppercase text-right">Qty</Text>
          <Text className="w-20 text-xs font-bold text-app-text-secondary uppercase text-right">Price</Text>
          <Text className="w-20 text-xs font-bold text-app-text-secondary uppercase text-right">Total</Text>
        </View>

        {lineItems.map((item, i) => (
          <View key={i} className="flex-row py-3 border-b border-app-border">
            <View className="flex-1 pr-3">
              <Text className="text-app-text-primary font-medium">{item.description}</Text>
              <Text className="text-app-text-secondary text-xs">{item.unit}</Text>
            </View>
            <Text className="w-12 text-app-text-secondary text-right">{item.qty}</Text>
            <Text className="w-20 text-app-text-secondary text-right">
              {formatCurrency(item.unit_price)}
            </Text>
            <Text className="w-20 text-app-text-primary font-semibold text-right">
              {formatCurrency(item.total)}
            </Text>
          </View>
        ))}

        <View className="flex-row justify-between pt-4 mt-1">
          <Text className="font-bold text-app-text-primary text-base">Total Estimate</Text>
          <Text className="font-bold text-app-accent text-lg">
            {formatCurrency(subtotal)}
          </Text>
        </View>
      </Section>

      {/* Assumptions */}
      {estimate.assumptions?.length > 0 && (
        <>
          <Divider />
          <Section title="Assumptions & Notes">
            {estimate.assumptions.slice(0, 4).map((a, i) => (
              <Text key={i} className="text-app-text-secondary mb-1 leading-5">• {a}</Text>
            ))}
          </Section>
        </>
      )}

      {/* Customer Message */}
      {estimate.customer_message && (
        <>
          <Divider />
          <Section title="Message">
            <Text className="text-app-text-secondary leading-6 italic">
              {estimate.customer_message}
            </Text>
          </Section>
        </>
      )}

      {/* Signature */}
      <Divider />
      <View className="mt-4">
        <Text className="text-xs text-app-text-tertiary mb-6">
          This estimate is subject to change upon on-site verification. Final price
          confirmed before work begins.
        </Text>
        <View className="flex-row gap-12">
          <View className="flex-1">
            <View className="border-b border-app-border-strong mb-1 pb-6" />
            <Text className="text-xs text-app-text-secondary">Contractor Signature</Text>
          </View>
          <View className="flex-1">
            <View className="border-b border-app-border-strong mb-1 pb-6" />
            <Text className="text-xs text-app-text-secondary">Customer Signature / Date</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
