import type Phaser from "phaser";

type Graphics = Phaser.GameObjects.Graphics;
export type VisualState = {
  clock: number; x: number; y: number; ex: number; facing: number;
  heroIndex: number; move: string; moveTime: number; connected: boolean;
  enemyPhase: string; enemyMove: string; enemyTimer: number;
  enemyHealth: number; storm: number; enemyRecoil: number;
  guardFlash: number; guarding: boolean; reduced: boolean;
  finishTimer: number; pendingResult: boolean | null;
};
export const HERO_INK = [0xffd57d, 0xe9b8dd, 0x8be2df];
const pixel = (n: number) => Math.round(n / 3) * 3;
const wrap = (n: number, size: number) => ((n % size) + size) % size;

function line(g: Graphics, points: number[][], color: number, width: number, alpha: number) {
  g.lineStyle(width, color, alpha);
  g.beginPath();
  points.forEach(([x, y], i) => i ? g.lineTo(pixel(x), pixel(y)) : g.moveTo(pixel(x), pixel(y)));
  g.strokePath();
}
function curve(g: Graphics, x: number, y: number, rx: number, ry: number,
  from: number, to: number, color: number, width: number, alpha: number) {
  const points = [];
  for (let i = 0; i <= 18; i++) {
    const a = from + (to - from) * i / 18;
    points.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]);
  }
  line(g, points, color, width, alpha);
}

/** Separate layers keep atmospheric detail behind the fighters and warnings on the floor. */
export function drawStorm(g: Graphics, floor: Graphics, s: VisualState) {
  g.clear(); floor.clear();
  const t = s.reduced ? s.clock * 0.16 : s.clock;
  const strength = s.storm;
  g.fillStyle(0x071421, 0.08 + strength * 0.08);
  g.fillRect(0, 0, 1280, 720);
  // Slow banks of haze. No strobe or enemy electricity.
  for (let i = 0; i < 7; i++) {
    g.fillStyle(0x092232, 0.08);
    g.fillEllipse(wrap(i * 241 - t * (9 + i), 1560) - 140,
      155 + (i % 3) * 125, 480, 90 + i * 8);
  }
  const count = s.reduced ? 12 : 42;
  for (let i = 0; i < count; i++) {
    const near = i % 3 === 0;
    const speed = (near ? 105 : 42) * (0.75 + strength * 0.5);
    const x = wrap(i * 197 - t * speed, 1380) - 50;
    const y = 175 + wrap(i * 91, 400) + Math.sin(t * 1.4 + i) * 16;
    const paper = i % 7 === 0;
    g.fillStyle(paper ? 0xe7d6ad : 0xb9c5c9, paper ? 0.52 : 0.18);
    const flutter = paper ? Math.abs(Math.sin(t * 2.5 + i)) : 0;
    g.fillRect(pixel(x), pixel(y), paper ? 7 + flutter * 9 : 3, paper ? 3 + (1 - flutter) * 7 : 2);
    if (paper) line(g, [[x - 3, y + 4], [x - 16, y + 6]], 0xbcc8cb, 1, 0.15);
  }
  // Dust skimming across the lane establishes depth without covering faces.
  for (let i = 0; i < 9; i++) {
    const x = wrap(i * 157 - t * 125 * strength, 1430) - 75;
    curve(floor, x, 590 + i % 3 * 16, 65, 5, 0.2, 2.8, 0xc4bba4, 2, 0.09);
  }
  if (s.enemyPhase === "tell") {
    const duration = s.enemyMove === "charge" ? 1.05 : 0.85;
    const progress = Math.max(0, Math.min(1, 1 - s.enemyTimer / duration));
    const color = s.enemyMove === "low" ? 0xe6c388 : 0x9bd2df;
    const dir = s.x < s.ex ? -1 : 1;
    const range = s.enemyMove === "charge" ? 330 : 850;
    const left = Math.max(20, dir < 0 ? s.ex - range : s.ex);
    const right = Math.min(1260, dir < 0 ? s.ex : s.ex + range);
    floor.fillStyle(color, 0.05 + progress * 0.07);
    floor.fillRect(left, 581, right - left, 18);
    line(floor, [[left, 601], [right, 601]], color, 2, 0.25 + progress * 0.35);
    for (let i = 0; i < 7; i++) {
      const x = s.ex + dir * (40 + i * 100);
      if (x < left || x > right) continue;
      line(floor, [[x - dir * 10, 587], [x, 591], [x - dir * 10, 595]], color, 2, 0.4);
    }
    curve(floor, s.ex, 590, 90 + progress * 25, 16, 0, Math.PI * 2, color, 2, 0.6);
  }
}

/** Animated wisps and debris surround the illustrated spirit; the face stays readable. */
export function drawSpirit(g: Graphics, s: VisualState) {
  g.clear();
  const t = s.clock * (s.reduced ? 0.35 : 1);
  const dispersing = s.pendingResult === true ? Math.min(1, Math.max(0, 1 - s.finishTimer / 0.72)) : 0;
  const opacity = 1 - dispersing;
  const tell = s.enemyPhase === "tell";
  for (let i = 0; i < 7; i++) {
    const y = -128 + i * 42 - dispersing * 130;
    const w = 125 - i * 10 + dispersing * 160;
    curve(g, Math.sin(t * 2 + i) * 12, y, w, 15 + i * 2,
      t * 2.5 + i * 0.9, t * 2.5 + i * 0.9 + 2.6,
      tell ? 0xb3cdd3 : 0x789ba8, 2, opacity * (tell ? 0.55 : 0.3));
  }
  for (let i = 0; i < (s.reduced ? 5 : 14); i++) {
    const a = t * (2 + s.storm * 0.5) + i * 1.8;
    const x = Math.cos(a) * (125 + i * 2 + dispersing * 140);
    const y = Math.sin(a) * 42 + i * 22 - 180;
    g.fillStyle(i % 3 === 0 ? 0xe3d2ad : 0x82979d, opacity * 0.6);
    g.fillRect(pixel(x), pixel(y), i % 3 === 0 ? 11 : 4, 4);
  }
  if (s.enemyPhase === "recover") {
    curve(g, 0, -160, 80, 14, 0, Math.PI * 2, 0xf0ce89, 2, 0.65);
  }
}

export function drawMove(g: Graphics, s: VisualState, windup: number, active: number) {
  const color = HERO_INK[s.heroIndex];
  const dir = s.facing;
  const shoulder = s.y - 150;
  if (s.guarding || s.guardFlash > 0) {
    const a = s.guardFlash > 0 ? Math.min(1, s.guardFlash * 5) : 0.24;
    curve(g, s.x + dir * 30, shoulder, 58, 102, dir > 0 ? -1.2 : 1.94,
      dir > 0 ? 1.2 : 4.34, 0xb9e9f1, s.guardFlash > 0 ? 5 : 2, a);
  }
  if (!s.move) return;
  if (s.moveTime < windup) {
    if (s.move === "special") {
      const p = s.moveTime / windup;
      curve(g, s.x, s.y - 4, 100 - p * 45, 15, 0, Math.PI * 2, color, 3, p * 0.6);
    }
    return;
  }
  const progress = (s.moveTime - windup) / active;
  if (progress > 1.4) return;
  const alpha = Math.max(0, 1 - Math.max(0, progress - 0.6) / 0.8);
  if (s.move !== "special") {
    const radius = s.move === "strong" ? 155 : 113;
    const center = dir > 0 ? 0 : Math.PI;
    const head = center - dir * 1.3 + dir * Math.min(1, progress) * 2.5;
    for (let i = 0; i < 3; i++) curve(g, s.x + dir * 25, shoulder,
      radius - i * 9, radius * 0.65 - i * 5, head - dir * 1.15, head,
      color, i === 0 ? 6 : 3, alpha * (0.8 - i * 0.22));
    return;
  }
  // The effect lands at the same bounded range as the hit test, even on a miss.
  const target = s.connected ? s.ex : s.x + dir * Math.min(560, Math.abs(s.ex - s.x));
  if (s.heroIndex === 0) {
    const bolt = [[s.x + dir * 58, shoulder - 35]];
    const offsets = [-8, 14, -22, 27, -11, 19, -29, 9, 0];
    for (let i = 1; i <= 9; i++) bolt.push([
      s.x + dir * 58 + (target - s.x - dir * 58) * i / 9,
      shoulder - 25 + offsets[i - 1],
    ]);
    line(g, bolt, 0xd7b96d, 16, alpha * 0.16);
    line(g, bolt, 0xffdf92, 7, alpha * 0.8);
    line(g, bolt, 0xfffae5, 2, alpha);
    if (!s.reduced) for (const i of [3, 6]) {
      const [x, y] = bolt[i];
      const up = i === 3 ? -1 : 1;
      line(g, [[x, y], [x + dir * 28, y + up * 18], [x + dir * 15, y + up * 32],
        [x + dir * 49, y + up * 59]], 0xffdf92, 2, alpha * 0.55);
    }
    if (s.connected) curve(g, target, shoulder - 10, 45 + progress * 65, 70,
      0, Math.PI * 2, color, 3, alpha * 0.6);
  } else if (s.heroIndex === 1) {
    for (let i = 0; i < 5; i++) {
      const p = Math.max(0, Math.min(1, progress * 1.5 - i * 0.12));
      if (!p) continue;
      const x = s.x + (target - s.x) * p;
      curve(g, x, s.y - 192, 20 + p * 35, 45 + p * 75,
        dir > 0 ? -1.4 : 1.74, dir > 0 ? 1.4 : 4.54,
        i % 2 ? 0xffdfec : color, 3, alpha * (0.7 - i * 0.1));
    }
  } else {
    const p = Math.min(1, progress * 2.5);
    const x = s.x + (target - s.x) * p;
    const y = shoulder - Math.sin(p * Math.PI) * 45;
    g.fillStyle(0x344651, alpha); g.fillCircle(x, y, 13);
    g.lineStyle(3, 0xe7c591, alpha); g.strokeCircle(x, y, 13);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + progress * 8;
      line(g, [[x + Math.cos(a) * 14, y + Math.sin(a) * 14],
        [x + Math.cos(a) * 20, y + Math.sin(a) * 20]], 0xe7c591, 4, alpha);
    }
    if (p === 1) for (let i = 0; i < 3; i++) {
      const r = 25 + Math.max(0, progress - 0.4) * 180 + i * 16;
      curve(g, x, y, r, r * 0.7, 0, Math.PI * 2, color, 3, alpha * (0.6 - i * 0.15));
    }
  }
}

export function drawGust(g: Graphics, s: VisualState) {
  if (s.enemyPhase !== "attack") return;
  const dir = s.x < s.ex ? -1 : 1;
  const low = s.enemyMove === "low";
  const charge = s.enemyMove === "charge";
  const duration = charge ? 0.4 : 0.28;
  const progress = Math.max(0, Math.min(1, 1 - s.enemyTimer / duration));
  const reach = charge ? 230 : 850;
  // The whole lane lights at impact; travelling ribbons are only the trailing air.
  for (let i = 0; i < (low ? 6 : 10); i++) {
    const y = low ? 551 + i * 7 : 375 + i * 16;
    const points = [];
    for (let j = 0; j <= 10; j++) points.push([
      s.ex + dir * reach * j / 10,
      y + Math.sin(j * 0.8 - progress * 8 + i) * (low ? 9 : 21),
    ]);
    line(g, points, i % 2 ? 0xc1dce1 : 0x759eab, i % 3 ? 2 : 4, (1 - progress * 0.6) * 0.45);
  }
  const x = s.ex + dir * reach * progress;
  curve(g, x, low ? 566 : 448, charge ? 48 : 30, low ? 26 : 90,
    0, Math.PI * 2, 0xd7e7e7, 3, 0.6 * (1 - progress));
}
