import {
  ScrollView,
  View,
  Text,
  Image,
  Platform,
  useWindowDimensions,
} from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { formatCurrency, formatDate, getEffectiveStatusKey } from "@/lib/utils";
import { tokens } from "@/styles";
import type { SavedEstimate, JobPhoto } from "@/types/estimate";

const DEFAULT_TERMS =
  "This estimate is based on the scope described above and is subject to change if site conditions, material selections, or project scope change. Any additional work will be discussed and approved before proceeding.";

interface EstimatePreviewProps {
  estimate: SavedEstimate;
  businessName?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  businessLogoUrl?: string;
  businessLicense?: string;
  businessTerms?: string;
  photos?: JobPhoto[];
}

function cleanBulletText(text: string): string {
  return text.replace(/^[\s•\-\*]+/, "").trim();
}

function hasValue(value?: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function Divider() {
  return <View className="h-px bg-app-border my-5" />;
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

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-4" style={{ minWidth: 140, flex: 1 }}>
      <Text className="text-xs text-app-text-tertiary uppercase tracking-wide mb-0.5">{label}</Text>
      <Text className="text-app-text-primary font-medium text-sm">{value}</Text>
    </View>
  );
}

export function EstimatePreview({
  estimate,
  businessName,
  businessPhone,
  businessEmail,
  businessAddress,
  businessLogoUrl,
  businessLicense,
  businessTerms,
  photos = [],
}: EstimatePreviewProps) {
  const { width } = useWindowDimensions();
  const customer = estimate.jobs?.customers;
  const lineItems = estimate.line_items ?? [];
  const subtotal = estimate.subtotal ?? 0;

  const effectiveStatus = getEffectiveStatusKey(
    estimate.status,
    estimate.prices_confirmed,
    subtotal,
    estimate.missing_questions?.length ?? 0,
    lineItems.some((li) => (Number(li.unit_price) || 0) === 0)
  );
  const isReady = effectiveStatus === "ready" || effectiveStatus === "sent";

  const draftMessage: Record<string, string> = {
    pricing_needed: "Pricing incomplete — contractor must add prices before sending.",
    needs_details: "Details needed — this estimate is not ready to send.",
    review_pricing: "Draft pricing — contractor must confirm prices before sending.",
  };

  const contactParts = ([businessPhone, businessEmail] as (string | undefined)[]).filter(hasValue);

  const scopeLines =
    estimate.scope_of_work
      ?.split("\n")
      .map((l) => l.trim())
      .filter(Boolean) ?? [];

  const customerPhotos = photos.filter((p) => p.signedUrl);
  const isWide = width > 600;

  const hasBusinessInfo = hasValue(businessName) || hasValue(businessPhone) || hasValue(businessEmail) || hasValue(businessAddress);

  return (
    <ScrollView
      nativeID="qs-estimate-scroll"
      className="flex-1 bg-stone-100"
      contentContainerStyle={{ padding: isWide ? 32 : 16, paddingBottom: 80 }}
    >
      {/* Draft warning banner */}
      {!isReady && (
        <View className="flex-row items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
          <AlertTriangle size={16} color={tokens.accent} />
          <Text className="text-sm text-amber-700 font-medium flex-1">
            {draftMessage[effectiveStatus] ?? "This estimate is a draft and is not ready to send."}
          </Text>
        </View>
      )}

      {/* Main document card */}
      <View
        className="bg-white rounded-2xl overflow-hidden"
        style={{ shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 2 } }}
      >
        {/* Document header */}
        <View className="px-6 pt-6 pb-4">
          {/* Business branding row */}
          {hasBusinessInfo ? (
            <View className="flex-row items-start gap-4 mb-5">
              {businessLogoUrl && (
                <Image
                  source={{ uri: businessLogoUrl }}
                  style={{ width: 64, height: 64, borderRadius: 8 }}
                  resizeMode="contain"
                />
              )}
              <View className="flex-1">
                {hasValue(businessName) && (
                  <Text className="text-xl font-bold text-app-text-primary">
                    {businessName}
                  </Text>
                )}
                {contactParts.length > 0 && (
                  <Text className="text-sm text-app-text-secondary mt-0.5">
                    {contactParts.join("  ·  ")}
                  </Text>
                )}
                {hasValue(businessAddress) && (
                  <Text className="text-sm text-app-text-secondary mt-0.5">{businessAddress}</Text>
                )}
                {hasValue(businessLicense) && (
                  <Text className="text-xs text-app-text-tertiary mt-1">
                    License: {businessLicense}
                  </Text>
                )}
              </View>
            </View>
          ) : null}

          {/* ESTIMATE title — top border only when business info is present above */}
          <View
            className={`${hasBusinessInfo ? "border-t " : ""}border-b border-app-border py-3 mb-5`}
          >
            <Text className="text-center text-xs font-bold text-app-text-tertiary uppercase tracking-[0.2em]">
              Estimate
            </Text>
          </View>

          {/* Metadata grid */}
          <View className="flex-row flex-wrap gap-x-6">
            {customer && <MetaField label="Prepared For" value={customer.name} />}
            <MetaField label="Date" value={formatDate(estimate.created_at)} />
            {estimate.jobs?.job_type && (
              <MetaField label="Job Type" value={estimate.jobs.job_type} />
            )}
            {customer?.address && (
              <MetaField label="Job Site" value={customer.address} />
            )}
          </View>

          {/* Customer contact */}
          {customer && (customer.phone || customer.email) && (
            <View className="flex-row flex-wrap gap-x-4 mb-1 -mt-1">
              {customer.phone && (
                <Text className="text-xs text-app-text-tertiary">{customer.phone}</Text>
              )}
              {customer.email && (
                <Text className="text-xs text-app-text-tertiary">{customer.email}</Text>
              )}
            </View>
          )}
        </View>

        <View className="h-px bg-app-border mx-6" />

        {/* Body sections */}
        <View className="px-6 pt-5 pb-6">

          {/* Job Summary */}
          {estimate.job_summary && (
            <Section title="Job Summary">
              <Text className="text-app-text-secondary leading-6 text-sm">
                {estimate.job_summary}
              </Text>
            </Section>
          )}

          {/* Scope of Work */}
          {scopeLines.length > 0 && (
            <Section title="Scope of Work">
              {scopeLines.length > 1 ? (
                scopeLines.map((line, i) => (
                  <Text key={i} className="text-app-text-secondary text-sm leading-6">
                    {"• "}{cleanBulletText(line)}
                  </Text>
                ))
              ) : (
                <Text className="text-app-text-secondary text-sm leading-6">
                  {cleanBulletText(scopeLines[0])}
                </Text>
              )}
            </Section>
          )}

          <Divider />

          {/* Pricing Breakdown */}
          <Section title="Pricing Breakdown">
            {isWide ? (
              <>
                {/* Table header — desktop/print only */}
                <View className="flex-row pb-2 border-b border-app-border">
                  <Text className="flex-1 text-xs font-bold text-app-text-secondary uppercase">
                    Description
                  </Text>
                  <Text className="w-10 text-xs font-bold text-app-text-secondary uppercase text-right">
                    Qty
                  </Text>
                  <Text className="w-16 text-xs font-bold text-app-text-secondary uppercase text-right">
                    Unit
                  </Text>
                  <Text className="w-20 text-xs font-bold text-app-text-secondary uppercase text-right">
                    Unit Price
                  </Text>
                  <Text className="w-20 text-xs font-bold text-app-text-secondary uppercase text-right">
                    Total
                  </Text>
                </View>

                {lineItems.map((item, i) => (
                  <View key={i} className="flex-row py-3 border-b border-app-border">
                    <Text className="flex-1 pr-3 text-app-text-primary text-sm font-medium">
                      {item.description}
                    </Text>
                    <Text className="w-10 text-app-text-secondary text-sm text-right">
                      {item.qty}
                    </Text>
                    <Text className="w-16 text-app-text-secondary text-sm text-right">
                      {item.unit}
                    </Text>
                    <Text className="w-20 text-app-text-secondary text-sm text-right">
                      {formatCurrency(item.unit_price)}
                    </Text>
                    <Text className="w-20 text-app-text-primary text-sm font-semibold text-right">
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <>
                {/* Mobile cards */}
                {lineItems.map((item, i) => (
                  <View key={i} className="py-3 border-b border-app-border">
                    <Text className="text-app-text-primary text-sm font-medium mb-1.5">
                      {item.description}
                    </Text>
                    <View className="flex-row justify-between items-start">
                      <View>
                        <Text className="text-xs text-app-text-tertiary">
                          Qty: {item.qty}{"  "}{item.unit}
                        </Text>
                        <Text className="text-xs text-app-text-secondary mt-0.5">
                          Unit Price: {formatCurrency(item.unit_price)}
                        </Text>
                      </View>
                      <Text className="text-app-text-primary text-sm font-semibold">
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Total row — same for both layouts */}
            <View className="flex-row justify-between items-center pt-4 mt-1 border-t-2 border-app-border-strong">
              <Text className="font-bold text-app-text-primary text-base">Total Estimate</Text>
              <Text className="font-bold text-app-accent text-xl">
                {isReady ? formatCurrency(subtotal) : "TBD"}
              </Text>
            </View>
          </Section>

          {/* Job Photos */}
          {customerPhotos.length > 0 && (
            <>
              <Divider />
              <Section title="Job Photos">
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  {customerPhotos.map((photo) => (
                    <View
                      key={photo.id}
                      style={{ width: isWide ? "48%" : "100%", minWidth: 200 }}
                    >
                      <View
                        style={{
                          width: "100%",
                          aspectRatio: 4 / 3,
                          borderRadius: 8,
                          overflow: "hidden",
                          backgroundColor: tokens.surfaceAlt,
                        }}
                      >
                        <Image
                          source={{ uri: photo.signedUrl! }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      </View>
                      {photo.description ? (
                        <Text className="text-xs text-app-text-secondary mt-1.5">
                          {photo.description}
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              </Section>
            </>
          )}

          {/* Assumptions */}
          {estimate.assumptions?.length > 0 && (
            <>
              <Divider />
              <Section title="Notes & Assumptions">
                {estimate.assumptions.map((a, i) => (
                  <Text key={i} className="text-app-text-secondary text-sm mb-1.5 leading-5">
                    {"• "}{cleanBulletText(a)}
                  </Text>
                ))}
              </Section>
            </>
          )}

          {/* Customer Message */}
          {estimate.customer_message && (
            <>
              <Divider />
              <Section title="Message">
                <Text className="text-app-text-secondary text-sm leading-6 italic">
                  {estimate.customer_message}
                </Text>
              </Section>
            </>
          )}

          <Divider />

          {/* Terms */}
          <Section title="Terms">
            <Text className="text-app-text-secondary text-sm leading-6">
              {businessTerms ?? DEFAULT_TERMS}
            </Text>
          </Section>

          <Divider />

          {/* Signature */}
          <View className="mt-2 mb-2">
            <View className="mb-6">
              <View className="flex-row items-end gap-3 mb-1">
                <Text className="text-sm text-app-text-secondary w-44">Contractor Signature</Text>
                <View className="flex-1 border-b border-app-border-strong pb-5" />
                <Text className="text-sm text-app-text-secondary">Date</Text>
                <View style={{ width: 80 }} className="border-b border-app-border-strong pb-5" />
              </View>
            </View>

            <View className="mb-6">
              <View className="flex-row items-end gap-3 mb-1">
                <Text className="text-sm text-app-text-secondary w-44">Customer Approval</Text>
                <View className="flex-1 border-b border-app-border-strong pb-5" />
                <Text className="text-sm text-app-text-secondary">Date</Text>
                <View style={{ width: 80 }} className="border-b border-app-border-strong pb-5" />
              </View>
            </View>

            <Text className="text-xs text-app-text-tertiary mt-2">
              Customer approval indicates acceptance of the scope and estimate total listed above.
            </Text>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}
