type Ink = any;
type DragonState = { clock: number; x: number; ex: number; enemyPhase: string; enemyMove: string; enemyTimer: number; pendingResult: boolean | null; reduced: boolean };

export function drawGoldenAtmosphere(g: Ink, floor: Ink, s: DragonState) {
  g.clear(); floor.clear();
  for (let i = 0; i < (s.reduced ? 6 : 20); i++) {
    const x = (i * 179 + s.clock * 14) % 1280;
    const y = 570 - (s.clock * 27 + i * 37) % 260;
    g.fillStyle(i % 2 ? 0xffc655 : 0xffefb3, .2 + .2 * Math.sin(i + s.clock) ** 2);
    g.fillRect(x, y, 3, 3);
  }
  floor.lineStyle(2, 0xffc861, s.enemyPhase === "tell" ? .7 : .2);
  floor.strokeEllipse(s.ex + (s.ex > s.x ? 70 : -70), 594, 240, 28);
  if (s.enemyPhase === "tell" && s.enemyMove === "low") {
    floor.fillStyle(0xff9b35, .12);floor.fillRect(50, 558, 1180, 34);
    floor.lineStyle(2, 0xffd378, .8);floor.lineBetween(50, 591, 1230, 591);
  }
}

/** Stepped fire, claw flashes, and charge trails belong to the golden automaton. */
export function drawGoldenAttack(g: Ink, s: DragonState) {
  if (s.pendingResult !== null) return;
  const direction = s.x < s.ex ? -1 : 1;
  const mouth = s.ex + direction * 70;
  if (s.enemyPhase === "tell") {
    for (let i = 0; i < 5; i++) {
      g.fillStyle(i % 2 ? 0xffc549 : 0xfff0a7, .6);
      g.fillRect(mouth + Math.sin(s.clock * 9 + i) * 14, 395 + i * 7, 4, 4);
    }
  }
  if (s.enemyPhase !== "attack") return;
  if (s.enemyMove === "low") {
    const progress = Math.max(0, Math.min(1, (0.55 - s.enemyTimer) / .25));
    const length = Math.min(850, Math.abs(s.x - mouth) + 100) * progress;
    g.fillStyle(0xef681f, .85);
    g.fillTriangle(mouth, 430, mouth + direction * 100, 576, mouth + direction * 8, 567);
    g.fillStyle(0xffdf77, .95);
    g.fillTriangle(mouth, 430, mouth + direction * 64, 570, mouth + direction * 22, 563);
    for (let i = 0; i < 26; i++) {
      const x = mouth + direction * length * i / 26;
      const h = 18 + Math.sin(s.clock * 25 + i * 1.4) ** 2 * 30;
      g.fillStyle(0xd94619, .8);g.fillRect(x - 12, 590 - h, 25, h);
      g.fillStyle(0xffa72b, .95);g.fillRect(x - 8, 590 - h * .75, 17, h * .75);
      g.fillStyle(0xffef91, .95);g.fillRect(x - 4, 590 - h * .4, 9, h * .4);
    }
  } else if (s.enemyMove === "sweep") {
    for (let i = 0; i < 3; i++) {
      g.lineStyle(4, i === 1 ? 0xfff3bc : 0xffbd49, .8);
      g.lineBetween(s.x - direction * 70, 420 + i * 25, s.x + direction * 15, 485 + i * 25);
    }
  } else {
    for (let i = 1; i < 6; i++) {
      g.lineStyle(3, 0xffd26a, .65 - i * .08);
      g.lineBetween(s.ex - direction * (90 + i * 24), 435 + i * 20, s.ex - direction * (180 + i * 28), 435 + i * 20);
    }
  }
}
