import { Vector3 } from "three";

export const CORE_RADIUS = 1.6;

export function radiusForRank(rank: number): number {
  return CORE_RADIUS + 1.6 + Math.sqrt(rank - 1) * 2.3;
}

export function sizeForScore(score: number): number {
  return 0.12 + Math.pow(Math.max(score, 0) / 100, 3) * 0.55;
}

/** Live world positions of each node, read by the camera rig to follow a selected model. */
export const nodePositions = new Map<string, Vector3>();
