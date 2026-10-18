/** Renderer contract: combat remains authoritative in OlympusScene in both modes. */
export interface BattleView {
  mode: string; heroIndex: number; clock: number;
  x: number; y: number; ex: number; facing: number;
  move: string; moveTime: number; health: number; enemyHealth: number;
  enemyPhase: string; enemyMove: string; enemyTimer: number;
  enemyRecoil: number; guardFlash: number; guarding: boolean; hurt: number;
  storm: number; reduced: boolean; freeze: number;
  pendingResult: boolean | null; finishTimer: number; reveal: boolean;
  keys: Set<string>;
  player: { visible: boolean }; enemy: { visible: boolean };
  label: { text: string }; warning: { text: string };
  particles: { x: number; y: number; life: number; max: number; color: number; size: number }[];
  impacts: { x: number; y: number; life: number; power: number; color: number }[];
  callouts: { obj: { text: string; x: number }; life: number; y: number }[];
}
export type Stage = "title" | "books" | "select" | "prophecy" | "bus" | "canyon" | "museum" | "reveal" | "rescue" | "battle" | "pause" | "defeat" | "complete";
export const worldX = (x: number) => (x - 640) / 78;
export const worldY = (y: number) => (590 - y) / 78;
export const heroColors = [0xffd17a, 0xf1a4df, 0x7de9ef];
export function seeded(seed = 1) {
  return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
}
