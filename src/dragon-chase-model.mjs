export const CHASE = { duration: 52, floor: 552, heroX: 820, maxStumbles: 6, gravity: 1400, jumpSpeed: 800, fireX: 550, fireSpeed: 500, warning: 0.45 };
const pattern = ["low", "high", "low", "high", "high", "low", "high", "low", "low", "high", "low", "high"];
export function createChase() {
  return { mode: "ready", time: 0, y: 0, vy: 0, duck: false, jumpQueued: false, stumbles: 0, dodged: 0, flash: 0,
    attacks: pattern.map((kind, id) => ({ id, kind, at: 4.5 + id * 3.7, fired: false, resolved: false })), events: [] };
}
export function startChase(s) { if (s.mode === "ready") s.mode = "running"; }
export function pauseChase(s) { if (s.mode === "running") { s.mode = "paused"; s.duck = false; s.jumpQueued = false; } }
export function resumeChase(s) { if (s.mode === "paused") s.mode = "running"; }
export function queueChaseJump(s) { if (s.mode === "running") s.jumpQueued = true; }
export function setChaseDuck(s, held) { s.duck = s.mode === "running" && held; }
export function attackX(s, attack) { return CHASE.fireX + (s.time - attack.at) * CHASE.fireSpeed; }
export function currentWarning(s) {
  return s.attacks.find(a => !a.resolved && s.time >= a.at - CHASE.warning && attackX(s, a) <= CHASE.heroX) ?? null;
}
export function stepChase(s, dt) {
  if (s.mode !== "running") return;
  dt = Math.max(0, Math.min(1 / 30, dt));
  s.time = Math.min(CHASE.duration, s.time + dt);
  s.flash = Math.max(0, s.flash - dt);
  if (s.jumpQueued && s.y === 0) {
    s.vy = -CHASE.jumpSpeed; s.duck = false; s.events.push("jump");
  }
  s.jumpQueued = false;
  s.vy += s.y < 0 || s.vy < 0 ? CHASE.gravity * dt : 0;
  s.y += s.vy * dt;
  if (s.y >= 0) { s.y = 0; s.vy = 0; }
  for (const a of s.attacks) {
    if (!a.fired && s.time >= a.at) { a.fired = true; s.events.push("fire"); }
    if (!a.resolved && a.fired && attackX(s, a) >= CHASE.heroX) {
      a.resolved = true;
      const avoided = a.kind === "low" ? s.y < -62 : s.duck && s.y === 0 || s.y < -170;
      if (avoided) { s.dodged++; s.events.push(s.y < 0 ? "clear-jump" : "clear-duck"); }
      else { s.stumbles++; s.flash = 0.6; s.events.push("stumble"); }
    }
  }
  if (s.stumbles >= CHASE.maxStumbles) { s.mode = "lost"; s.events.push("caught"); }
  else if (s.time >= CHASE.duration) { s.mode = "won"; s.duck = false; s.y = 0; s.events.push("finish"); }
}
export function drainChaseEvents(s) { return s.events.splice(0); }
