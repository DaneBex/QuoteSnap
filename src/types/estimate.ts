export interface JobPhoto {
  id: string;
  job_id: string;
  user_id: string;
  storage_path: string;
  description: string | null;
  include_in_customer_estimate: boolean;
  sort_order: number;
  created_at: string;
  signedUrl?: string;
}

export interface ClarifyingAnswer {
  question: string;
  answer: string;
}

export interface LineItem {
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface Upsell {
  title: string;
  description: string;
  estimatedCost: string;
}

export interface EstimatePayload {
  estimateQuality: "ready" | "needs_detail";
  jobSummary: string;
  scopeOfWork: string;
  lineItems: LineItem[];
  materialsChecklist: string[];
  missingQuestions: string[];
  optionalQuestions: string[];
  assumptions: string[];
  optionalUpsells: Upsell[];
  customerMessage: string;
}

export type EstimateStatus = "draft" | "pricing_needed" | "draft_ready" | "ready" | "sent";

export interface SavedEstimate {
  id: string;
  job_id: string;
  user_id: string;
  job_summary: string | null;
  scope_of_work: string | null;
  line_items: LineItem[];
  materials_checklist: string[];
  materials_checked: boolean[];
  missing_questions: string[];
  optional_questions: string[];
  clarifying_answers: ClarifyingAnswer[];
  assumptions: string[];
  optional_upsells: Upsell[];
  customer_message: string | null;
  subtotal: number | null;
  total: number | null;
  status: EstimateStatus;
  prices_confirmed: boolean;
  prices_confirmed_at: string | null;
  clarification_round: number;
  title: string | null;
  created_at: string;
  updated_at: string;
  jobs?: {
    id: string;
    job_type: string;
    notes: string | null;
    customers?: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      address: string | null;
    } | null;
  } | null;
}
