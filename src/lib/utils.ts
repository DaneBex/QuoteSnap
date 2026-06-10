import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { statusColors } from "@/styles";
import type { EstimateStatus, LineItem } from "@/types/estimate";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseAmount(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[$,]/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getStatusColor(status: string): string {
  const key = status as keyof typeof statusColors;
  const colors = statusColors[key] ?? statusColors.draft;
  return `${colors.bg} ${colors.text}`;
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "ready":
      return "Ready to Send";
    case "draft_ready":
      return "Draft Ready";
    case "pricing_needed":
      return "Pricing Needed";
    case "review_pricing":
      return "Review Prices";
    case "needs_details":
      return "Needs Details";
    case "sent":
      return "Sent";
    case "draft":
    default:
      return "Draft";
  }
}

export function getEffectiveStatusKey(
  status: string,
  pricesConfirmed: boolean,
  subtotal: number,
  missingQuestionsCount = 0
): string {
  if (status === "sent") return "sent";
  if (subtotal === 0 || status === "pricing_needed") return "pricing_needed";
  if (!pricesConfirmed) return "review_pricing";
  if (missingQuestionsCount > 0) return "needs_details";
  return "ready";
}

export function computeEstimateStatus(
  lineItems: LineItem[],
  subtotal: number,
  missingQuestionsCount = 0,
  optionalQuestionsCount = 0
): EstimateStatus {
  if (lineItems.length === 0) return "draft";
  const hasUnpricedItems = lineItems.some(
    (li) => li.description && (Number(li.unit_price) || 0) === 0
  );
  if (subtotal === 0 || hasUnpricedItems) return "pricing_needed";
  if (missingQuestionsCount > 0 || optionalQuestionsCount > 0) return "draft_ready";
  return "ready";
}
