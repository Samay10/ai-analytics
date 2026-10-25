"use client";

import Html from "@/components/three/Label";
import { Line, OrbitControls, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useState } from "react";
import { type RankedModel, useRanked } from "@/lib/hooks";
import { orgOf } from "@/lib/orgs";
import { useStore } from "@/lib/store";

const WEEKS = 52;
const TRACKED = 16;
const TOP_AT_ANY_TIME = 5;
const MAX_RANK = 20;
const WIDTH = 26;
const ROW = 0.7;

interface Series {
  model: RankedModel;
  ranks: (number | null)[];
}

/** Rank of each tracked model among models already released at each weekly step. */
function buildSeries(ranked: RankedModel[]) {
  const dated = ranked.filter((m) => m.releaseDate);
  const dates: string[] = [];
  const end = new Date();
  for (let i = WEEKS; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i * 7);
    dates.push(d.toISOString().slice(0, 10));
  }
  const positions = dates.map((date) => {
    const available = dated.filter((m) => m.releaseDate! <= date);
    return new Map(available.map((m, i) => [m.id, i + 1]));
  });

  const tracked = new Map<string, RankedModel>();
  for (const m of dated.slice(0, 5)) tracked.set(m.id, m);
  for (const pos of positions) {
    for (const m of dated) {
      if (tracked.size >= TRACKED) break;
      if ((pos.get(m.id) ?? Infinity) <= TOP_AT_ANY_TIME) tracked.set(m.id, m);
    }
  }
  const series: Series[] = [...tracked.values()].map((model) => ({
    model,
    ranks: positions.map((pos) => pos.get(model.id) ?? null),
  }));
  return { dates, series };
}

const xAt = (i: number) => (i / WEEKS) * WIDTH - WIDTH / 2;
const yAt = (rank: number) => -(Math.min(rank, MAX_RANK + 1) - 1) * ROW + (MAX_RANK * ROW) / 2;

function RaceLine({ s, depth, upTo, focus }: { s: Series; depth: number; upTo: number; focus: string | null }) {
  const select = useStore((st) => st.select);
  const hover = useStore((st) => st.hover);
  const color = orgOf(s.model.org).color;
  const points: [number, number, number][] = [];
  for (let i = 0; i <= upTo; i++) {
    const r = s.ranks[i];
    if (r != null) points.push([xAt(i), yAt(r), depth]);
  }
  if (points.length === 0) return null;
  const head = points[points.length - 1];
  const headRank = s.ranks[upTo];
  const dim = focus != null && focus !== s.model.id;

  return (
    <group>
      {points.length > 1 && (
        <Line
          points={points}
          color={color}
          lineWidth={dim ? 1.5 : 3.5}
          transparent
          opacity={dim ? 0.2 : 1}
          toneMapped={false}
        />
      )}
      <mesh
        position={head}
        onClick={(e) => {
          e.stopPropagation();
          select(s.model.id);
        }}
        onPointerOver={() => hover(s.model.id)}
        onPointerOut={() => hover(null)}
      >
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={dim ? 0.4 : 3} toneMapped={false} />
      </mesh>
      {headRank != null && headRank <= MAX_RANK && !dim && (
        <Html position={[head[0] + 0.35, head[1], head[2]]} style={{ pointerEvents: "none" }}>
          <div className="-translate-y-1/2 whitespace-nowrap font-mono text-[10px] text-white/80" style={{ textShadow: "0 0 10px #000" }}>
            <span className="text-white/40">#{headRank}</span> {s.model.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function Grid({ dates }: { dates: string[] }) {
  const months = dates
    .map((d, i) => ({ d, i }))
    .filter(({ d }, idx, arr) => idx === 0 || d.slice(0, 7) !== arr[idx - 1].d.slice(0, 7));
  const bottom = yAt(MAX_RANK + 1) - 0.4;
  return (
    <group>
      {months.map(({ d, i }) => (
        <group key={d}>
          <Line points={[[xAt(i), yAt(1) + 0.4, -1], [xAt(i), bottom, -1]]} color="#ffffff" transparent opacity={0.05} />
          <Html position={[xAt(i), bottom - 0.3, -1]} center style={{ pointerEvents: "none" }}>
            <span className="font-mono text-[9px] uppercase text-white/35">
              {new Date(d).toLocaleDateString(undefined, { month: "short" })}
            </span>
          </Html>
        </group>
      ))}
      {[1, 5, 10, 15, 20].map((r) => (
        <group key={r}>
          <Line points={[[-WIDTH / 2, yAt(r), -1], [WIDTH / 2, yAt(r), -1]]} color="#8b9dff" transparent opacity={r === 1 ? 0.15 : 0.05} />
          <Html position={[-WIDTH / 2 - 0.6, yAt(r), -1]} center style={{ pointerEvents: "none" }}>
            <span className="font-mono text-[9px] text-white/35">#{r}</span>
          </Html>
        </group>
      ))}
    </group>
  );
}

export default function RaceView() {
  const ranked = useRanked();
  const focus = useStore((s) => s.selectedId ?? s.hoveredId);
  const { dates, series } = useMemo(() => buildSeries(ranked), [ranked]);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setT((v) => {
        if (v >= WEEKS) {
          setPlaying(false);
          return WEEKS;
        }
        return v + 1;
      });
    }, 90);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [2, 1.5, 23], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={["#05060a"]} />
        <ambientLight intensity={0.3} />
        <Stars radius={120} depth={50} count={3000} factor={3} fade speed={0.3} />
        <group rotation={[0, -0.12, 0]} position={[1.5, 0, 0]}>
          <Grid dates={dates} />
          {series.map((s, i) => (
            <RaceLine key={s.model.id} s={s} depth={i * 0.12} upTo={t} focus={focus} />
          ))}
        </group>
        <OrbitControls makeDefault enablePan={false} minDistance={8} maxDistance={45} maxPolarAngle={Math.PI * 0.62} minPolarAngle={Math.PI * 0.3} />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.6} intensity={0.9} />
        </EffectComposer>
      </Canvas>

      <div className="pointer-events-auto glass absolute bottom-28 left-1/2 flex w-[min(560px,90vw)] -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2">
        <button
          onClick={() => {
            if (t >= WEEKS) setT(0);
            setPlaying((p) => !p);
          }}
          className="grid size-7 place-items-center rounded-full bg-white/10 text-xs hover:bg-white/20"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <input
          type="range"
          min={0}
          max={WEEKS}
          value={t}
          onChange={(e) => {
            setPlaying(false);
            setT(Number(e.target.value));
          }}
          className="h-1 flex-1"
        />
        <span className="w-24 text-right font-mono text-[11px] text-dim">{dates[t]}</span>
      </div>
      <p className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 text-center text-[11px] text-dim">
        Rank among models released by each date · every model that reached the top {TOP_AT_ANY_TIME}
      </p>
    </div>
  );
}
