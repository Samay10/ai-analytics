"use client";

import { useEffect, useMemo, useState } from "react";
import { rankModels } from "./score";
import { useStore } from "./store";
import type { Dataset, Model } from "./types";

export type RankedModel = Model;

/** Dataset models filtered by the UI and re-ranked under the current weights. */
export function useRanked(): RankedModel[] {
  const models = useStore((s) => s.dataset.models);
  const weights = useStore((s) => s.weights);
  const openFilter = useStore((s) => s.openFilter);
  const hiddenOrgs = useStore((s) => s.hiddenOrgs);
  return useMemo(() => {
    const visible = models.filter(
      (m) =>
        !hiddenOrgs.includes(m.org) &&
        (openFilter === "all" ||
          (openFilter === "open" ? m.openWeights === true : m.openWeights !== true)),
    );
    return rankModels(visible, weights);
  }, [models, weights, openFilter, hiddenOrgs]);
}

export function useSelectedModel(): RankedModel | null {
  const ranked = useRanked();
  const id = useStore((s) => s.selectedId);
  return useMemo(() => ranked.find((m) => m.id === id) ?? null, [ranked, id]);
}

const POLL_MS = 5 * 60 * 1000;

/** Polls the published dataset so the page picks up hourly ingest runs without a reload. */
export function useLiveDataset() {
  const setDataset = useStore((s) => s.setDataset);
  useEffect(() => {
    let current = useStore.getState().dataset?.generatedAt;
    const tick = async () => {
      try {
        const res = await fetch(`/data/latest.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as Dataset;
        if (next.generatedAt !== current) {
          current = next.generatedAt;
          setDataset(next);
        }
      } catch {}
    };
    const id = setInterval(tick, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [setDataset]);
}

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useCapabilities() {
  const [caps, setCaps] = useState({ webgl: true, compact: false, reducedMotion: false });
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const webgl = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    const compactQuery = window.matchMedia("(max-width: 899px)");
    const update = () =>
      setCaps({
        webgl,
        compact: compactQuery.matches,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
    update();
    compactQuery.addEventListener("change", update);
    return () => compactQuery.removeEventListener("change", update);
  }, []);
  return caps;
}
