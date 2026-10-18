type Ink = any;
type State = { clock: number; x: number; y: number; ex: number; enemyPhase: string; enemyMove: string; enemyTimer: number; charm: number; rallyFlash: number; pendingResult: boolean | null; reduced: boolean; };

/** Department-store enchantments share no storm layers with the canyon encounter. */
export function drawMedeaAtmosphere(g: Ink, floor: Ink, s: State) {
  g.clear(); floor.clear();
  for (let i = 0; i < (s.reduced ? 8 : 24); i++) {
    const x = (i * 173 + s.clock * (7 + i % 4)) % 1280;
    const y = 165 + (i * 79) % 370 + (s.reduced ? 0 : Math.sin(s.clock + i) * 14);
    g.fillStyle(i % 2 ? 0xe6b86b : 0xc78cf2, .15 + Math.sin(s.clock + i) ** 2 * .22);
    g.fillRect(x, y, i % 3 ? 3 : 5, 3);
  }
  const ward = s.enemyPhase === "tell";
  floor.lineStyle(2, 0xc781ed, ward ? .65 : .2);
  floor.strokeEllipse(s.ex, 593, 160 + Math.sin(s.clock * 2) * 8, 30);
  if (s.charm >= 60) {
    g.fillStyle(0x982a9c, (s.charm / 100) * .12);
    g.fillRect(0, 0, 1280, 720);
  }
  if (s.rallyFlash > 0) {
    const p = 1 - s.rallyFlash / .8;
    g.lineStyle(5, 0xffd5f0, (1 - p) * .8);
    g.strokeEllipse(s.x, 455, 100 + p * 600, 120 + p * 460);
    floor.lineStyle(4, 0xffe6b4, 1 - p);
    floor.strokeEllipse(s.x, 592, 80 + p * 700, 25 + p * 70);
  }
}

export function drawMedeaSpell(g: Ink, s: State) {
  if (s.pendingResult !== null) return;
  const telling = s.enemyPhase === "tell", attacking = s.enemyPhase === "attack";
  if (!telling && !attacking) return;
  const color = s.enemyMove === "low" ? 0x8effb7 : s.enemyMove === "sweep" ? 0xc599ff : 0xff9ed9;
  if (telling) {
    g.lineStyle(2, color, .55);
    g.strokeCircle(s.ex - 45, 390, 24 + Math.sin(s.clock * 6) * 6);
    for (let i = 0; i < 6; i++) {
      const a = s.clock + i * Math.PI / 3;
      g.fillStyle(color, .8); g.fillRect(s.ex - 47 + Math.cos(a) * 38, 388 + Math.sin(a) * 38, 5, 5);
    }
    if (s.enemyMove === "low") {
      g.fillStyle(color, .12);g.fillRect(45, 555, 1190, 35);
      g.lineStyle(2, color, .65);g.lineBetween(45, 589, 1235, 589);
    }
    return;
  }
  const progress = Math.max(0, Math.min(1, 1 - s.enemyTimer / .6));
  const start = s.ex - 50, end = s.x;
  if (s.enemyMove === "low") {
    const x = start + (end - start) * Math.min(1, progress * 2.2);
    for (let i = 7; i >= 0; i--) {
      g.fillStyle(i % 2 ? 0x67dda4 : 0xe8ffb7, .7 - i * .07);
      g.fillEllipse(x + i * 15, 575 - (i % 3) * 3, 34, 23);
    }
    // Readable glass vial, cork and highlight above the rolling emerald vapor.
    g.fillStyle(0x175b53, 1); g.fillRect(x - 10, 550, 20, 28);
    g.fillStyle(0x82ffd1, .95); g.fillRect(x - 7, 557, 14, 18);
    g.fillStyle(0xe3fff2, .9); g.fillRect(x - 5, 555, 3, 13);
    g.fillStyle(0xd8aa59, 1); g.fillRect(x - 5, 543, 10, 7);
    for (let i = 0; i < 9; i++) {
      const a = s.clock * 5 + i * 2.4;
      g.fillStyle(i % 2 ? 0xecffad : 0x56efbb, .7);
      g.fillRect(x + Math.cos(a) * (20 + i * 4), 565 + Math.sin(a) * 18, 3, 3);
    }
  } else if (s.enemyMove === "sweep") {
    for (let i = 0; i < 5; i++) {
      const x = start + (end - start) * Math.min(1, progress * 2 + i * .025);
      const y = 370 + i * 42;
      g.lineStyle(5, color, .65);g.lineBetween(x + 65, y - 15, x - 22, y + 6);
      g.fillStyle(0xf0d2ff, .9);g.fillRect(x - 8, y - 4, 12, 12);
      g.lineStyle(2, 0xffffff, .8);g.lineBetween(x - 9, y + 4, x + 4, y - 8);
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const x = start + (end - start) * (i + 1) / 6;
      g.lineStyle(3, color, .75);g.strokeEllipse(x, 440, 36 + progress * 85, 115 + progress * 100);
      const a = s.clock * 4 + i * .8;
      g.fillStyle(0xffe3f1, .9);g.fillRect(x + Math.cos(a) * (18 + progress * 42), 440 + Math.sin(a) * (57 + progress * 50), 5, 5);
    }
  }
}
