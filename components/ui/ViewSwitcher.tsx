"use client";

import { motion } from "framer-motion";
import { type View, useStore } from "@/lib/store";

export const VIEWS: { id: View; label: string; webgl: boolean }[] = [
  { id: "galaxy", label: "Galaxy", webgl: true },
  { id: "race", label: "Rank race", webgl: true },
  { id: "skyline", label: "Skyline", webgl: true },
  { id: "value", label: "Value map", webgl: false },
  { id: "table", label: "Table", webgl: false },
];

export function ViewSwitcher({ webgl }: { webgl: boolean }) {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  return (
    <nav className="glass pointer-events-auto flex gap-0.5 rounded-full p-1">
      {VIEWS.filter((v) => webgl || !v.webgl).map((v) => (
        <button
          key={v.id}
          onClick={() => setView(v.id)}
          className={`relative rounded-full px-3.5 py-1.5 text-xs transition ${view === v.id ? "text-black" : "text-dim hover:text-white"}`}
        >
          {view === v.id && (
            <motion.span
              layoutId="view-pill"
              className="absolute inset-0 rounded-full bg-white"
              transition={{ type: "spring", stiffness: 400, damping: 34 }}
            />
          )}
          <span className="relative">{v.label}</span>
        </button>
      ))}
    </nav>
  );
}
