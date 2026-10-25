"use client";

import Html from "@/components/three/Label";
import { MeshDistortMaterial, OrbitControls, Sparkles, Stars } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef } from "react";
import { type Mesh, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useRanked } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { ModelNode } from "./ModelNode";
import { CORE_RADIUS, nodePositions, radiusForRank } from "./layout";

const RING_RANKS = [1, 5, 10, 25, 50, 100];
const HOME = new Vector3(0, 18, 34);

function Core() {
  const shellA = useRef<Mesh>(null);
  const shellB = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (shellA.current) shellA.current.rotation.y += dt * 0.15;
    if (shellB.current) {
      shellB.current.rotation.x -= dt * 0.1;
      shellB.current.rotation.z += dt * 0.07;
    }
  });
  return (
    <group>
      <mesh>
        <sphereGeometry args={[CORE_RADIUS * 0.32, 48, 48]} />
        <meshBasicMaterial color="#dfe4ff" toneMapped={false} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[CORE_RADIUS * 0.55, 8]} />
        <MeshDistortMaterial
          color="#6f7dff"
          emissive="#6f7dff"
          emissiveIntensity={2}
          distort={0.4}
          speed={2}
          transparent
          opacity={0.55}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={shellA}>
        <icosahedronGeometry args={[CORE_RADIUS, 2]} />
        <meshBasicMaterial color="#8b9dff" wireframe transparent opacity={0.18} toneMapped={false} />
      </mesh>
      <mesh ref={shellB}>
        <icosahedronGeometry args={[CORE_RADIUS * 1.18, 1]} />
        <meshBasicMaterial color="#c084fc" wireframe transparent opacity={0.08} toneMapped={false} />
      </mesh>
      <pointLight intensity={60} color="#9aa8ff" distance={40} />
      <Sparkles count={120} scale={7} size={2} speed={0.4} color="#b9c3ff" opacity={0.6} />
    </group>
  );
}

function RankRings({ total }: { total: number }) {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {RING_RANKS.filter((r) => r <= total).map((rank) => {
        const r = radiusForRank(rank);
        return (
          <group key={rank}>
            <mesh>
              <ringGeometry args={[r - 0.015, r + 0.015, 160]} />
              <meshBasicMaterial color="#8b9dff" transparent opacity={rank <= 10 ? 0.22 : 0.1} />
            </mesh>
            <Html position={[r, 0, 0]} center style={{ pointerEvents: "none" }}>
              <span className="font-mono text-[9px] tracking-widest text-white/30">
                {rank === 1 ? "#1" : `TOP ${rank}`}
              </span>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/** Eases the camera toward a selected model, then keeps following it as it orbits. */
function CameraRig() {
  const selectedId = useStore((s) => s.selectedId);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const camera = useThree((s) => s.camera);
  const focusStart = useRef(0);
  const lastTarget = useMemo(() => new Vector3(), []);
  const goal = useMemo(() => new Vector3(), []);

  useEffect(() => {
    focusStart.current = performance.now();
  }, [selectedId]);

  useFrame((_, dt) => {
    if (!controls) return;
    const focusing = performance.now() - focusStart.current < 1600;
    const pos = selectedId ? nodePositions.get(selectedId) : null;

    if (pos) {
      lastTarget.copy(controls.target);
      controls.target.lerp(pos, focusing ? 1 - Math.exp(-dt * 4) : 1);
      camera.position.add(goal.copy(controls.target).sub(lastTarget));
      if (focusing) {
        const dir = goal.copy(camera.position).sub(controls.target).normalize();
        camera.position.lerp(dir.multiplyScalar(10).add(controls.target), 1 - Math.exp(-dt * 3));
      }
    } else if (focusing) {
      controls.target.lerp(new Vector3(), 1 - Math.exp(-dt * 3));
      camera.position.lerp(HOME, 1 - Math.exp(-dt * 2.5));
    }
    controls.update();
  });
  return null;
}

function Nodes({ motion }: { motion: boolean }) {
  const ranked = useRanked();
  const selectedId = useStore((s) => s.selectedId);
  const hoveredId = useStore((s) => s.hoveredId);
  const focus = selectedId ?? hoveredId;
  const focusOrg = focus ? ranked.find((m) => m.id === focus)?.org : null;

  return (
    <>
      <RankRings total={ranked.length} />
      {ranked.map((m) => (
        <ModelNode
          key={m.id}
          model={m}
          selected={m.id === selectedId}
          hovered={m.id === hoveredId}
          dimmed={!!focusOrg && m.org !== focusOrg && m.id !== focus}
          motion={motion}
        />
      ))}
    </>
  );
}

export default function GalaxyScene({ motion = true }: { motion?: boolean }) {
  const select = useStore((s) => s.select);
  return (
    <Canvas
      camera={{ position: HOME.toArray(), fov: 45, near: 0.1, far: 500 }}
      dpr={[1, 2]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={["#05060a"]} />
      <fog attach="fog" args={["#05060a", 40, 110]} />
      <ambientLight intensity={0.15} />
      <Stars radius={140} depth={60} count={6000} factor={4} fade speed={motion ? 0.6 : 0} />
      <Core />
      <Nodes motion={motion} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        minDistance={3}
        maxDistance={80}
        autoRotate={motion}
        autoRotateSpeed={0.25}
      />
      <CameraRig />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.6} intensity={1.1} radius={0.75} />
        <Vignette offset={0.25} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
