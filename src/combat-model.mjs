export const HEROES = [
  {
    id: "jason",
    name: "Jason Grace",
    short: "JASON",
    title: "THE LOST HERO",
    power: "Son of Jupiter",
    color: "#b5daff",
    weapon: "Golden sword",
    special: "Skybreaker",
    description:
      "A missing past. A golden blade. The courage to stand against the storm.",
    stats: [4, 3, 4],
  },
  {
    id: "piper",
    name: "Piper McLean",
    short: "PIPER",
    title: "THE FEARLESS HEART",
    power: "Daughter of Aphrodite",
    color: "#e0aedb",
    weapon: "Borrowed club",
    special: "Unshaken voice",
    description:
      "When the world tells her to run, she stands her ground. Her voice can turn the tide.",
    stats: [3, 5, 3],
  },
  {
    id: "leo",
    name: "Leo Valdez",
    short: "LEO",
    title: "THE QUICK THINKER",
    power: "Son of Hephaestus",
    color: "#ffc681",
    weapon: "Workshop hammer",
    special: "Gustbreaker",
    description:
      "Quick hands. Quicker wit. Give him a broken machine, and he will find a way.",
    stats: [3, 4, 5],
  },
];
export const MOVES = {
  quick: {
    windup: 0.1,
    active: 0.12,
    recovery: 0.2,
    damage: 8,
    range: 158,
    meter: 13,
  },
  strong: {
    windup: 0.24,
    active: 0.16,
    recovery: 0.34,
    damage: 15,
    range: 192,
    meter: 17,
  },
  special: {
    windup: 0.18,
    active: 0.28,
    recovery: 0.4,
    damage: 28,
    range: 600,
    meter: 0,
  },
};
export function hitOutcome({ attack, blocking, jumping, distance }) {
  if (attack === "low" && jumping) return "evade";
  if (distance > (attack === "charge" ? 210 : 850)) return "miss";
  if (blocking && attack !== "low") return "block";
  return "hit";
}
export function attackDamage(hero, move, combo) {
  const base = MOVES[move].damage;
  return (
    base +
    (hero === "jason" && move === "strong" ? 3 : 0) +
    (hero === "leo" && move === "special" ? 4 : 0) +
    Math.min(combo, 5)
  );
}
