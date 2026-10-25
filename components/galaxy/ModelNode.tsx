"use client";

import Html from "@/components/three/Label";
import { useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import { Color, MathUtils, type Group, type Mesh, type MeshBasicMaterial, Vector3 } from "three";
import { daysSince, hash01 } from "@/lib/format";
import type { RankedModel } from "@/lib/hooks";
import { orgOf } from "@/lib/orgs";
import { useStore } from "@/lib/store";
import { nodePositions, radiusForRank, sizeForScore } from "./layout";

const NEW_DAYS = 14;
const LABEL_TOP = 8;

interface Props {
  model: RankedModel;
  selected: boolean;
  hovered: boolean;
  dimmed: boolean;
  motion: boolean;
}

function ModelNodeImpl({ model, selected, hovered, dimmed, motion }: Props) {
  const group = useRef<Group>(null);
  const body = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const hover = useStore((s) => s.hover);
  const select = useStore((s) => s.select);

  const seed = useMemo(() => hash01(model.id), [model.id]);
  const tilt = useMemo(() => (hash01(model.id, 7) - 0.5) * 0.35, [model.id]);
  const color = useMemo(() => new Color(orgOf(model.org).color), [model.org]);
  const isNew = (daysSince(model.releaseDate) ?? Infinity) <= NEW_DAYS;

  const targetRadius = radiusForRank(model.rank);
  const targetSize = sizeForScore(model.score);
  const radius = useRef(isNew && motion ? targetRadius + 60 : targetRadius);
  const angle = useRef(seed * Math.PI * 2);
  const size = useRef(targetSize);
  const pos = useMemo(() => new Vector3(), []);

  useEffect(() => {
    nodePositions.set(model.id, pos);
    return () => {
      nodePositions.delete(model.id);
    };
  }, [model.id, pos]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    radius.current = MathUtils.damp(radius.current, targetRadius, 1.8, dt);
    if (motion) angle.current += (dt * 1.4) / Math.pow(radius.current, 1.25);
    const r = radius.current;
    const a = angle.current;
    pos.set(Math.cos(a) * r, Math.sin(a * 2 + seed * 10) * r * tilt * 0.4, Math.sin(a) * r);
    g.position.copy(pos);

    const emphasis = selected ? 1.6 : hovered ? 1.35 : 1;
    size.current = MathUtils.damp(size.current, targetSize * emphasis, 6, dt);
    body.current?.scale.setScalar(size.current);

    if (halo.current) {
      const t = (state.clock.elapsedTime * 0.6 + seed) % 1;
      halo.current.scale.setScalar(size.current * (1.5 + t * 3));
      (halo.current.material as MeshBasicMaterial).opacity = (1 - t) * 0.7;
      halo.current.lookAt(state.camera.position);
    }
  });

  const showLabel = selected || hovered || model.rank <= LABEL_TOP || isNew;
  const intensity = dimmed ? 0.25 : selected || hovered ? 2.8 : 2;
  const labelY = targetSize * (selected ? 1.6 : hovered ? 1.35 : 1) + 0.3;

  return (
    <group ref={group}>
      <mesh
        ref={body}
        onPointerOver={(e) => {
          e.stopPropagation();
          hover(model.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          hover(null);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          select(model.id);
        }}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={intensity}
          roughness={0.35}
          metalness={0.1}
          toneMapped={false}
          transparent={dimmed}
          opacity={dimmed ? 0.35 : 1}
        />
      </mesh>
      {isNew && (
        <mesh ref={halo}>
          <ringGeometry args={[0.92, 1, 48]} />
          <meshBasicMaterial color={color} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      )}
      {showLabel && !dimmed && (
        <Html center position={[0, labelY, 0]} style={{ pointerEvents: "none" }}>
          <div
            className={`whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide transition-all ${
              selected || hovered ? "bg-black/60 text-white backdrop-blur" : "text-white/70"
            }`}
            style={{ textShadow: "0 0 12px rgba(0,0,0,.9)" }}
          >
            <span className="text-white/45">#{model.rank}</span> {model.name}
            {isNew && <span className="ml-1.5 rounded bg-white px-1 text-[8px] font-bold text-black">NEW</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

export const ModelNode = memo(ModelNodeImpl);
