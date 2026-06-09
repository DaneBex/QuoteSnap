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
  assumptions: string[];
  optionalUpsells: Upsell[];
  customerMessage: string;
}

export type EstimateStatus = "draft" | "ready" | "sent";

export interface SavedEstimate {
  id: string;
  job_id: string;
  user_id: string;
  job_summary: string | null;
  scope_of_work: string | null;
  line_items: LineItem[];
  materials_checklist: string[];
  missing_questions: string[];
  assumptions: string[];
  optional_upsells: Upsell[];
  customer_message: string | null;
  subtotal: number | null;
  total: number | null;
  status: EstimateStatus;
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
