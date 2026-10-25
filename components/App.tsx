"use client";

import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useCapabilities, useLiveDataset } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { labelPortal } from "./three/Label";
import { DetailPanel } from "./ui/DetailPanel";
import { Header } from "./ui/Header";
import { Leaderboard } from "./ui/Leaderboard";
import { SearchPalette } from "./ui/SearchPalette";
import { Ticker } from "./ui/Ticker";
import { ViewSwitcher } from "./ui/ViewSwitcher";
import TableView from "./views/TableView";
import ValueView from "./views/ValueView";

const GalaxyScene = dynamic(() => import("./galaxy/GalaxyScene"), { ssr: false });
const RaceView = dynamic(() => import("./views/RaceView"), { ssr: false });
const SkylineView = dynamic(() => import("./views/SkylineView"), { ssr: false });

export default function App() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const caps = useCapabilities();
  useLiveDataset();

  useEffect(() => {
    if (!caps.webgl || caps.compact) setView("table");
  }, [caps.webgl, caps.compact, setView]);

  const sidePanels = view === "galaxy" || view === "race" || view === "skyline" || view === "value";

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {view === "galaxy" && <GalaxyScene motion={!caps.reducedMotion} />}
          {view === "race" && <RaceView />}
          {view === "skyline" && <SkylineView />}
          {view === "value" && <ValueView />}
          {view === "table" && <TableView />}
        </motion.div>
      </AnimatePresence>
      <div ref={labelPortal} className="pointer-events-none absolute inset-0 z-10 overflow-hidden" />

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
        <Header />
        <div className="flex min-h-0 flex-1 justify-between gap-4 p-5 pb-3">
          {sidePanels && !caps.compact ? <Leaderboard /> : <div />}
          <DetailPanel />
        </div>
        <div className="flex flex-col items-center gap-3 px-5 pb-4">
          <ViewSwitcher webgl={caps.webgl} />
          <div className="w-full">
            <Ticker />
          </div>
        </div>
      </div>
      <SearchPalette />
    </main>
  );
}
