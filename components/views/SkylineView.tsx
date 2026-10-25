"use client";

import Html from "@/components/three/Label";
import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useRef, useState } from "react";
import { MathUtils, type Mesh } from "three";
import { useRanked } from "@/lib/hooks";
import { CATEGORIES } from "@/lib/metrics";
import { useStore } from "@/lib/store";

const COUNT = 16;
const GAP_X = 1.15;
const GAP_Z = 1.2;
const MAX_H = 7;

function Bar({
  x,
  z,
  value,
  color,
  dim,
  onHover,
  onClick,
}: {
  x: number;
  z: number;
  value: number | undefined;
  color: string;
  dim: boolean;
  onHover: (on: boolean) => void;
  onClick: () => void;
}) {
  const ref = useRef<Mesh>(null);
  const h = value != null ? Math.max(0.05, (value / 100) * MAX_H) : 0.04;
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    m.scale.y = MathUtils.damp(m.scale.y, h, 4, dt);
    m.position.x = MathUtils.damp(m.position.x, x, 5, dt);
    m.position.y = m.scale.y / 2;
  });
  return (
    <mesh
      ref={ref}
      position={[x, 0, z]}
      scale={[0.8, 0.001, 0.8]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
      }}
      onPointerOut={() => onHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <boxGeometry />
      <meshStandardMaterial
        color={value != null ? color : "#222"}
        emissive={value != null ? color : "#000"}
        emissiveIntensity={dim ? 0.15 : 0.9}
        transparent
        opacity={dim ? 0.25 : 0.92}
        roughness={0.3}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function SkylineView() {
  const ranked = useRanked().slice(0, COUNT);
  const select = useStore((s) => s.select);
  const selectedId = useStore((s) => s.selectedId);
  const [hovered, setHovered] = useState<{ id: string; cat: string } | null>(null);

  const x0 = -((COUNT - 1) * GAP_X) / 2;
  const z0 = -((CATEGORIES.length - 1) * GAP_Z) / 2;
  const focus = hovered?.id ?? selectedId;

  return (
    <div className="absolute inset-0">
      <Canvas camera={{ position: [14, 11, 16], fov: 40 }} dpr={[1, 2]} onPointerMissed={() => select(null)}>
        <color attach="background" args={["#05060a"]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} />
        <Stars radius={120} depth={50} count={3000} factor={3} fade speed={0.3} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[COUNT * GAP_X + 4, CATEGORIES.length * GAP_Z + 4]} />
          <meshStandardMaterial color="#0b0d16" />
        </mesh>
        <gridHelper args={[40, 40, "#1c2033", "#11131f"]} position={[0, 0, 0]} />

        {ranked.map((m, i) =>
          CATEGORIES.map((c, j) => (
            <Bar
              key={`${m.id}:${c.id}`}
              x={x0 + i * GAP_X}
              z={z0 + j * GAP_Z}
              value={m.categories[c.id]}
              color={c.color}
              dim={!!focus && focus !== m.id}
              onHover={(on) => setHovered(on ? { id: m.id, cat: c.id } : null)}
              onClick={() => select(m.id)}
            />
          )),
        )}

        {ranked.map((m, i) => (
          <Html key={m.id} position={[x0 + i * GAP_X, 0, z0 + CATEGORIES.length * GAP_Z]} center style={{ pointerEvents: "none" }}>
            <div className="origin-top-left translate-x-1 rotate-45 whitespace-nowrap font-mono text-[10px] text-white/60">
              #{m.rank} {m.name}
            </div>
          </Html>
        ))}
        {CATEGORIES.map((c, j) => (
          <Html key={c.id} position={[x0 - 1.2, 0, z0 + j * GAP_Z]} center style={{ pointerEvents: "none" }}>
            <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-wider" style={{ color: c.color }}>
              {c.label}
            </span>
          </Html>
        ))}

        {hovered &&
          (() => {
            const i = ranked.findIndex((m) => m.id === hovered.id);
            const j = CATEGORIES.findIndex((c) => c.id === hovered.cat);
            const m = ranked[i];
            const v = m?.categories[CATEGORIES[j].id as keyof typeof m.categories];
            if (!m) return null;
            return (
              <Html position={[x0 + i * GAP_X, ((v ?? 0) / 100) * MAX_H + 0.6, z0 + j * GAP_Z]} center style={{ pointerEvents: "none" }}>
                <div className="glass whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-dim">
                    {CATEGORIES[j].label}: <span className="font-mono text-white">{v != null ? v.toFixed(0) : "no data"}</span>
                  </div>
                </div>
              </Html>
            );
          })()}

        <OrbitControls makeDefault enablePan={false} minDistance={10} maxDistance={50} maxPolarAngle={Math.PI * 0.45} autoRotate={!hovered} autoRotateSpeed={0.3} />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.55} intensity={0.7} />
        </EffectComposer>
      </Canvas>
      <p className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2 text-[11px] text-dim">
        Category scores for the top {COUNT} models
      </p>
    </div>
  );
}
