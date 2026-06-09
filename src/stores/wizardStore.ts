import { create } from "zustand";
import type { EstimatePayload } from "@/types/estimate";

export interface WizardPhoto {
  uri: string;
  storageKey?: string;
  description?: string;
}

export interface WizardCustomer {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface WizardState {
  currentStep: number;
  jobType: string;
  customer: WizardCustomer;
  photos: WizardPhoto[];
  notes: string;
  isGenerating: boolean;
  generatedEstimate: EstimatePayload | null;
  generationError: string | null;
  savedJobId: string | null;
  savedEstimateId: string | null;

  setStep: (step: number) => void;
  setJobType: (jobType: string) => void;
  setCustomer: (customer: Partial<WizardCustomer>) => void;
  addPhoto: (photo: WizardPhoto) => void;
  removePhoto: (index: number) => void;
  updatePhotoStorageKey: (index: number, storageKey: string) => void;
  setNotes: (notes: string) => void;
  setIsGenerating: (v: boolean) => void;
  setGeneratedEstimate: (estimate: EstimatePayload) => void;
  setGenerationError: (error: string | null) => void;
  setSavedIds: (jobId: string, estimateId: string) => void;
  reset: () => void;
}

const defaultCustomer: WizardCustomer = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

export const useWizardStore = create<WizardState>((set) => ({
  currentStep: 1,
  jobType: "",
  customer: defaultCustomer,
  photos: [],
  notes: "",
  isGenerating: false,
  generatedEstimate: null,
  generationError: null,
  savedJobId: null,
  savedEstimateId: null,

  setStep: (step) => set({ currentStep: step }),
  setJobType: (jobType) => set({ jobType }),
  setCustomer: (partial) =>
    set((s) => ({ customer: { ...s.customer, ...partial } })),
  addPhoto: (photo) => set((s) => ({ photos: [...s.photos, photo] })),
  removePhoto: (index) =>
    set((s) => ({ photos: s.photos.filter((_, i) => i !== index) })),
  updatePhotoStorageKey: (index, storageKey) =>
    set((s) => ({
      photos: s.photos.map((p, i) => (i === index ? { ...p, storageKey } : p)),
    })),
  setNotes: (notes) => set({ notes }),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setGeneratedEstimate: (generatedEstimate) =>
    set({ generatedEstimate, generationError: null }),
  setGenerationError: (generationError) => set({ generationError }),
  setSavedIds: (savedJobId, savedEstimateId) =>
    set({ savedJobId, savedEstimateId }),
  reset: () =>
    set({
      currentStep: 1,
      jobType: "",
      customer: defaultCustomer,
      photos: [],
      notes: "",
      isGenerating: false,
      generatedEstimate: null,
      generationError: null,
      savedJobId: null,
      savedEstimateId: null,
    }),
}));
