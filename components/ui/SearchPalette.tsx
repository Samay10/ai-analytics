"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRanked } from "@/lib/hooks";
import { orgOf } from "@/lib/orgs";
import { useStore } from "@/lib/store";

export function SearchPalette() {
  const open = useStore((s) => s.searchOpen);
  const setOpen = useStore((s) => s.setSearchOpen);
  const select = useStore((s) => s.select);
  const ranked = useRanked();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useStore.getState().searchOpen);
      } else if (e.key === "Escape") {
        if (useStore.getState().searchOpen) setOpen(false);
        else select(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen, select]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ranked
      .filter((m) => !q || m.name.toLowerCase().includes(q) || orgOf(m.org).label.toLowerCase().includes(q))
      .slice(0, 8);
  }, [ranked, query]);

  const choose = (id: string) => {
    select(id);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-auto fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[18vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ y: -10, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -10, scale: 0.98 }}
            className="glass w-[520px] max-w-[92vw] overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
                if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
                if (e.key === "Enter" && results[active]) choose(results[active].id);
              }}
              placeholder="Search models or companies…"
              className="w-full border-b border-line bg-transparent px-5 py-4 text-sm outline-none placeholder:text-dim"
            />
            <ul className="p-2">
              {results.map((m, i) => (
                <li
                  key={m.id}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(m.id)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${i === active ? "bg-white/10" : ""}`}
                >
                  <span className="w-7 font-mono text-xs text-dim">#{m.rank}</span>
                  <span className="size-2 rounded-full" style={{ background: orgOf(m.org).color }} />
                  <span className="flex-1">{m.name}</span>
                  <span className="text-xs text-dim">{orgOf(m.org).label}</span>
                  <span className="font-mono text-xs">{m.score.toFixed(1)}</span>
                </li>
              ))}
              {!results.length && <li className="px-3 py-6 text-center text-sm text-dim">No models found</li>}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
