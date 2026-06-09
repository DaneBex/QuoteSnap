import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { statusColors } from "@/styles";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
    case "sent":
      return "Sent";
    case "draft":
    default:
      return "Draft";
  }
}
