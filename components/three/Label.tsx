"use client";

import { Html } from "@react-three/drei";
import type { ComponentProps, RefObject } from "react";

/**
 * Labels mount into an overlay that outlives the canvases; drei's default target
 * (the canvas parent) is torn down before Html cleans up, which throws on view switches.
 */
export const labelPortal: RefObject<HTMLDivElement | null> = { current: null };

export default function Label(props: ComponentProps<typeof Html>) {
  return (
    <Html
      portal={labelPortal as RefObject<HTMLElement>}
      zIndexRange={[10, 0]}
      {...props}
      style={{ pointerEvents: "none", ...props.style }}
    />
  );
}
