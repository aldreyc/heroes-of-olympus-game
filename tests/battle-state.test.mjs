import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import {
  HEROES,
  MOVES,
  hitOutcome,
  attackDamage,
} from "../src/combat-model.mjs";
const code = ts.transpileModule(
  fs.readFileSync("src/battle.ts", "utf8").replace(/^import .*;$/gm, ""),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  },
).outputText;
const sandbox = {
  exports: {},
  Phaser: {
    Scene: class {},
    Math: { Clamp: (x, a, b) => Math.max(a, Math.min(b, x)) },
  },
  audio: { sfx() {}, playMusic() {}, wind() {} },
  HEROES,
  MOVES,
  hitOutcome,
  attackDamage,
  matchMedia: () => ({ matches: true }),
  Math,
};
vm.runInNewContext(code, sandbox);
const Battle = sandbox.exports.OlympusScene;
function battle() {
  const s = new Battle();
  s.mode = "battle";
  s.warning = { setText() {} };
  s.label = { setText() {} };
  s.ground = {
    setPosition() {
      return this;
    },
    setScale() {
      return this;
    },
  };
  s.shadow = { setX() {} };
  s.enemy = { setPosition() {} };
  s.renderHero = () => {};
  s.burst = () => {};
  s.floating = () => {};
  s.x = 500;
  s.ex = 640;
  return s;
}
function advance(s, seconds) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) s.step(1 / 60);
}
test("one quick swing damages once even across many active frames", () => {
  const s = battle();
  s.enemyTimer = 100;
  s.queue("quick");
  advance(s, 0.5);
  assert.equal(s.stats.hits, 1);
  assert.equal(s.enemyHealth, 152);
});
test("a target entering range during the active swing can still be hit", () => {
  const s = battle();
  s.enemyTimer = 100;
  s.ex = 900;
  s.queue("quick");
  advance(s, 0.14);
  assert.equal(s.stats.hits, 0);
  s.ex = s.x + 140;
  advance(s, 0.05);
  assert.equal(s.stats.hits, 1);
  advance(s, 0.4);
  assert.equal(s.stats.hits, 1);
});
test("a missed swing cannot hit a target entering range during recovery", () => {
  const s = battle();
  s.enemyTimer = 100;
  s.ex = 900;
  s.queue("quick");
  advance(s, 0.28);
  s.ex = s.x + 140;
  advance(s, 0.15);
  assert.equal(s.stats.hits, 0);
});
test("combat input leaves menu buttons and menu navigation alone", () => {
  const s = battle();
  let prevented = 0;
  for (const mode of ["scenery", "pause"]) {
    s.mode = mode;
    for (const key of [" ", "ArrowLeft", "ArrowRight", "j"])
      s.handleKeyDown({key, repeat: false, target: null, preventDefault() { prevented++; }});
  }
  assert.equal(prevented, 0);
  assert.equal(s.keys.size, 0);
  assert.equal(s.buffer, "");
});
test("Space activates focused buttons but jumps when the arena has focus", () => {
  const s = battle();
  let prevented = 0;
  const event = {key: " ", repeat: false, target: { closest: () => ({}) }, preventDefault() { prevented++; }};
  s.handleKeyDown(event);
  assert.equal(s.buffer, "");
  assert.equal(prevented, 0);
  s.handleKeyDown({...event, target: null});
  assert.equal(s.buffer, "jump");
  assert.equal(prevented, 1);
});
test("special requires 50 spirit and consumes it once", () => {
  const s = battle();
  s.enemyTimer = 100;
  s.meter = 49;
  s.queue("special");
  advance(s, 0.3);
  assert.equal(s.stats.hits, 0);
  assert.equal(s.meter, 49);
  s.meter = 50;
  s.queue("special");
  advance(s, 0.7);
  assert.equal(s.stats.hits, 1);
  assert.equal(s.meter, 0);
});
test("jump has gravity and lands on the floor", () => {
  const s = battle();
  s.enemyTimer = 100;
  s.queue("jump");
  advance(s, 0.2);
  assert.ok(s.y < 520);
  advance(s, 1);
  assert.equal(s.y, 590);
  assert.equal(s.vy, 0);
});
test("rescue interrupts once without resetting combat health", () => {
  const s = battle();
  s.enemyTimer = 100;
  s.enemyHealth = 85;
  let interruptions = 0;
  s.onStory = () => interruptions++;
  s.queue("quick");
  advance(s, 0.4);
  assert.equal(interruptions, 1);
  assert.equal(s.mode, "pause");
  assert.equal(s.enemyHealth, 77);
  s.resume();
  advance(s, 0.5);
  s.queue("quick");
  advance(s, 0.5);
  assert.equal(interruptions, 1);
});
test("zero enemy health resolves victory once and pauses simulation", () => {
  const s = battle();
  s.enemyTimer = 100;
  s.enemyHealth = 5;
  let wins = 0;
  s.onEnd = (won) => {
    if (won) wins++;
  };
  s.queue("quick");
  advance(s, 1);
  assert.equal(wins, 1);
  assert.equal(s.mode, "pause");
});
test("zero player health resolves defeat once", () => {
  const s = battle();
  s.health = 5;
  s.enemyPhase = "attack";
  s.enemyMove = "sweep";
  s.enemyTimer = 0.2;
  s.enemyHit = false;
  let losses = 0;
  s.onEnd = (won) => {
    if (!won) losses++;
  };
  advance(s, 1);
  assert.equal(losses, 1);
  assert.equal(s.health, 0);
});

test('restart clears transient state from the previous battle',()=>{
 const s=battle();
 const visual=new Proxy({}, {get:()=>()=>visual});
 for(const field of ['player','enemy','ground','shadow','backdrop','label','warning'])s[field]=visual;
 s.streak=5;s.streakTimer=1;s.acc=.015;s.move='strong';s.moveTime=.3;s.connected=true;s.enemyHit=true;s.facing=-1;s.keys.add('d');
 s.startFight(2);
 assert.equal(s.heroIndex,2);assert.equal(s.health,100);assert.equal(s.enemyHealth,160);
 assert.equal(s.streak,0);assert.equal(s.acc,0);assert.equal(s.moveTime,0);assert.equal(s.connected,false);assert.equal(s.enemyHit,false);assert.equal(s.facing,1);assert.equal(s.keys.size,0);
});

test('pause freezes the simulation and clears held movement',()=>{
 const s=battle();s.keys.add('d');advance(s,.2);s.pause();
 const snapshot={x:s.x,hp:s.health,enemyHp:s.enemyHealth,time:s.elapsed};
 advance(s,4);assert.deepEqual({x:s.x,hp:s.health,enemyHp:s.enemyHealth,time:s.elapsed},snapshot);assert.equal(s.keys.size,0);
 s.resume();advance(s,.1);assert.ok(s.elapsed>snapshot.time);
});

for(let hero=0;hero<HEROES.length;hero++)test(`${HEROES[hero].name} can win a complete simulated battle with the rescue beat`,()=>{
 const s=battle();s.heroIndex=hero;s.x=300;s.ex=950;
 let result;let rescueCount=0;
 s.onEnd=won=>{result=won;};s.onStory=()=>{rescueCount++;s.resume();};
 for(let frame=0;frame<60*90&&result===undefined;frame++){
  s.keys.clear();const distance=Math.abs(s.ex-s.x);
  if(distance>145&&!s.move)s.keys.add(s.ex>s.x?'d':'a');
  const danger=s.enemyPhase==='tell'||s.enemyPhase==='attack';
  if(danger){
   if(s.enemyMove==='low'&&s.enemyPhase==='tell'&&s.enemyTimer<.38&&s.y>=589)s.queue('jump');
   else if(s.enemyMove!=='low')s.keys.add('s');
  }else if(!s.move&&distance<185&&s.y>=589)s.queue(s.meter>=50?'special':'strong');
  s.step(1/60);
 }
 assert.equal(result,true);assert.equal(rescueCount,1);assert.ok(s.health>0);assert.ok(s.stats.hits>0);
});
