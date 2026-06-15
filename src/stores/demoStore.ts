import { create } from "zustand";

export type WalkthroughStep =
  | "dashboard"
  | "newEstimate"
  | "photosNotes"
  | "aiDraft"
  | "reviewDraft"
  | "answerQuestions"
  | "editor"
  | "confirmPrices"
  | "preview"
  | "finish";

export type DemoPhase = "idle" | "welcome" | "walkthrough";

interface DemoState {
  phase: DemoPhase;
  step: WalkthroughStep;
  demoEstimateId: string | null;
  showWelcome: () => void;
  startWalkthrough: () => void;
  setStep: (step: WalkthroughStep) => void;
  close: () => void;
  setDemoEstimateId: (id: string | null) => void;
}

export const useDemoStore = create<DemoState>((set) => ({
  phase: "idle",
  step: "dashboard",
  demoEstimateId: null,
  showWelcome: () => set({ phase: "welcome", step: "dashboard" }),
  startWalkthrough: () => set({ phase: "walkthrough", step: "dashboard" }),
  setStep: (step) => set({ step }),
  close: () => set({ phase: "idle" }),
  setDemoEstimateId: (id) => set({ demoEstimateId: id }),
}));
