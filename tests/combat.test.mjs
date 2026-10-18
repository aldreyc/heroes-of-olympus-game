import test from "node:test";
import assert from "node:assert/strict";
import {
  hitOutcome,
  attackDamage,
  MOVES,
  HEROES,
} from "../src/combat-model.mjs";
test("low gust punishes guarding but can be jumped", () => {
  assert.equal(
    hitOutcome({
      attack: "low",
      blocking: true,
      jumping: false,
      distance: 100,
    }),
    "hit",
  );
  assert.equal(
    hitOutcome({
      attack: "low",
      blocking: false,
      jumping: true,
      distance: 100,
    }),
    "evade",
  );
});
test("sweeping gust and close charge can be guarded", () => {
  for (const attack of ["sweep", "charge"])
    assert.equal(
      hitOutcome({ attack, blocking: true, jumping: false, distance: 100 }),
      "block",
    );
  assert.equal(
    hitOutcome({
      attack: "charge",
      blocking: false,
      jumping: false,
      distance: 300,
    }),
    "miss",
  );
});
test("hero strengths change damage without making quick attacks strongest", () => {
  assert.ok(
    attackDamage("jason", "strong", 0) > attackDamage("piper", "strong", 0),
  );
  assert.ok(
    attackDamage("leo", "special", 0) > attackDamage("piper", "special", 0),
  );
  for (const hero of HEROES)
    assert.ok(
      attackDamage(hero.id, "strong", 0) > attackDamage(hero.id, "quick", 0),
    );
});
test("combos have bounded bonus and all attacks have counterplay windows", () => {
  assert.equal(
    attackDamage("jason", "quick", 100),
    attackDamage("jason", "quick", 5),
  );
  for (const move of Object.values(MOVES)) {
    assert.ok(move.windup > 0);
    assert.ok(move.active > 0);
    assert.ok(move.recovery > move.active);
  }
});
test("Jason's playtest tuning strengthens every attack while preserving the other heroes", () => {
  for (const [move, damage] of Object.entries({ quick: 16, strong: 33, special: 52 })) {
    assert.equal(attackDamage("jason", move, 0), damage);
    assert.equal(attackDamage("jason", move, 3, true), damage + 8);
    assert.equal(attackDamage("piper", move, 0), MOVES[move].damage);
    assert.equal(attackDamage("leo", move, 0), MOVES[move].damage + (move === "special" ? 4 : 0));
  }
});
