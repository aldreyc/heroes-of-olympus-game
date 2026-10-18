export const MIDAS_RULES = { health: 1500, hitLimit: 10, invulnerability: .75 };

export function goldenHit(hits) { return Math.min(MIDAS_RULES.hitLimit, Math.max(0, hits) + 1); }

export function goldRegions(hits) {
  const n = Math.max(0, Math.min(10, Math.floor(hits)));
  if (!n) return [];
  if (n === 10) return [[0, 0, 1, 1]];
  if (n === 9) return [[0, .2, 1, .8]];
  const feet = n === 1 ? [[.5, .85, .5, .15]] : [[0, .85, 1, .15]];
  if (n <= 2) return feet;
  const shins = n === 3 ? [[0, .68, .5, .17]] : [[0, .68, 1, .17]];
  if (n <= 4) return [...feet, ...shins];
  const legs = n === 5 ? [[0, .49, .5, .19]] : [[0, .49, 1, .19]];
  const result = [...feet, ...shins, ...legs];
  if (n >= 7) result.push([.62, .25, .38, .3]);
  if (n >= 8) result.push([0, .25, .38, .3]);
  return result;
}

export const GOLD_STAGES = ["CLEAR", "RIGHT FOOT", "BOTH FEET", "LEFT LEG", "BOTH LEGS", "LEFT THIGH", "LEGS", "RIGHT ARM", "BOTH ARMS", "TORSO", "FULL GOLD"];

export function goldVolley(move, enemyX, targetX) {
  const direction = targetX < enemyX ? -1 : 1;
  const low = move === "low";
  return Array.from({length: move === "charge" ? 2 : 1}, (_,i) => ({
    x: enemyX + direction * 135, y: low ? 565 : 375,
    vx: direction * (low ? 390 : 460), radius: low ? 14 : 12,
    low, delay: i * .48, spin: 0,
  }));
}

/** Swept horizontal collision counts each projectile once, even at slow frame rates. */
export function advanceGoldBolts(bolts, dt, hero) {
  const active = [], events = [];
  let protectedNow = hero.invulnerable;
  for (const bolt of bolts) {
    const b = {...bolt};
    const beforeDelay = b.delay;
    b.delay = Math.max(0, b.delay-dt);
    if (b.delay > 0) { active.push(b); continue; }
    const travel = Math.max(0, dt-beforeDelay), oldX = b.x;
    b.x += b.vx * travel; b.spin += travel * 7;
    const crossing = Math.max(oldX,b.x)+b.radius >= hero.x-38 && Math.min(oldX,b.x)-b.radius <= hero.x+38;
    const inBody = b.y+b.radius >= hero.y-260 && b.y-b.radius <= hero.y-4;
    if (crossing && inBody) {
      if (protectedNow) events.push({type:"immune",x:b.x,y:b.y});
      else if (hero.blocking && !b.low) events.push({type:"block",x:b.x,y:b.y});
      else { events.push({type:"hit",x:b.x,y:b.y}); protectedNow=true; }
      continue;
    }
    if (b.x > -40 && b.x < 1320) active.push(b);
  }
  return { bolts:active, events };
}
