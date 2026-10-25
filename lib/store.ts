import { create } from "zustand";
import initialData from "../public/data/latest.json";
import { DEFAULT_WEIGHTS } from "./score";
import type { CategoryId, Dataset, Weights } from "./types";

export type View = "galaxy" | "race" | "skyline" | "value" | "table";
export type OpenFilter = "all" | "open" | "closed";

interface State {
  dataset: Dataset;
  weights: Weights;
  openFilter: OpenFilter;
  hiddenOrgs: string[];
  selectedId: string | null;
  hoveredId: string | null;
  view: View;
  searchOpen: boolean;
  setDataset: (d: Dataset) => void;
  setWeight: (c: CategoryId, w: number) => void;
  resetWeights: () => void;
  setOpenFilter: (f: OpenFilter) => void;
  toggleOrg: (org: string) => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setView: (v: View) => void;
  setSearchOpen: (open: boolean) => void;
}

export const useStore = create<State>((set) => ({
  dataset: initialData as Dataset,
  weights: DEFAULT_WEIGHTS,
  openFilter: "all",
  hiddenOrgs: [],
  selectedId: null,
  hoveredId: null,
  view: "galaxy",
  searchOpen: false,
  setDataset: (dataset) => set({ dataset }),
  setWeight: (c, w) => set((s) => ({ weights: { ...s.weights, [c]: w } })),
  resetWeights: () => set({ weights: DEFAULT_WEIGHTS }),
  setOpenFilter: (openFilter) => set({ openFilter }),
  toggleOrg: (org) =>
    set((s) => ({
      hiddenOrgs: s.hiddenOrgs.includes(org)
        ? s.hiddenOrgs.filter((o) => o !== org)
        : [...s.hiddenOrgs, org],
    })),
  select: (selectedId) => set({ selectedId }),
  hover: (hoveredId) => set({ hoveredId }),
  setView: (view) => set({ view }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}));
