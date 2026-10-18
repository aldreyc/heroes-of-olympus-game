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
  audio: { sfx() {}, playMusic() {}, wind() {}, setStorm() {} },
  HEROES,
  MOVES,
  hitOutcome,
  attackDamage,
  matchMedia: () => ({ matches: true }),
  Math,
};
const vfx = { exports: {}, Math };
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/combat-vfx.ts", "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText, vfx);
Object.assign(sandbox, vfx.exports);
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

test('timed guard prevents damage and opens an immediate counter opportunity', () => {
  const s = battle();
  s.enemyPhase = 'attack'; s.enemyMove = 'sweep'; s.enemyTimer = .28;
  s.keys.add('s');
  advance(s, .05);
  assert.equal(s.health, 100);
  assert.equal(s.stats.perfectBlocks, 1);
  assert.equal(s.meter, 55);
  assert.equal(s.enemyPhase, 'recover');
});

test('holding guard early still blocks but does not grant a perfect guard', () => {
  const s = battle();
  s.enemyPhase = 'tell'; s.enemyMove = 'sweep'; s.enemyTimer = .4;
  s.keys.add('s');
  advance(s, .5);
  assert.equal(s.health, 98);
  assert.equal(s.stats.blocks, 1);
  assert.equal(s.stats.perfectBlocks, 0);
});

test('airborne guarding cannot block a sweeping gust', () => {
  const s = battle();
  s.enemyPhase = 'attack'; s.enemyMove = 'sweep'; s.enemyTimer = .28;
  s.y = 450; s.keys.add('s');
  advance(s, .03);
  assert.equal(s.health, 91);
  assert.equal(s.stats.blocks, 0);
});

test('one recovery window rewards only one counter, even with multiple hits', () => {
  const s = battle();
  s.enemyPhase = 'recover'; s.enemyTimer = 10;
  s.queue('quick'); advance(s, .5);
  assert.equal(s.enemyHealth, 147);
  assert.equal(s.stats.counters, 1);
  s.ex = s.x + 140;
  s.queue('quick'); advance(s, .5);
  assert.equal(s.enemyHealth, 138); // second hit gets the chain bonus, not another counter bonus
  assert.equal(s.stats.counters, 1);
});

test('connected quick-heavy-special chain preserves separate windups and meter cost', () => {
  const s = battle(); s.enemyTimer = 100;
  s.queue('quick'); advance(s, .2);
  assert.equal(s.stats.hits, 1);
  s.queue('strong'); advance(s, .13);
  assert.equal(s.move, 'strong');
  assert.equal(s.stats.hits, 1); // heavy is still winding up
  advance(s, .32);
  assert.equal(s.stats.hits, 2);
  s.queue('special'); advance(s, .65);
  assert.equal(s.stats.hits, 3);
  assert.equal(s.meter, 15);
});

test('Piper voice interruption persists and suspends enemy attacks', () => {
  const s = battle(); s.heroIndex = 1; s.meter = 50; s.enemyTimer = 100;
  s.queue('special'); advance(s, .8);
  assert.equal(s.enemyPhase, 'stunned');
  assert.equal(s.health, 100);
  const remaining = s.enemyTimer;
  advance(s, 1);
  assert.equal(s.enemyPhase, 'stunned');
  assert.ok(s.enemyTimer < remaining);
});

test('finishing impact is brief, cannot accept attacks, and respects pause', () => {
  const s = battle(); s.enemyHealth = 5; s.enemyTimer = 100;
  let ends = 0; s.onEnd = () => ends++;
  s.queue('quick'); advance(s, .2);
  assert.equal(s.pendingResult, true);
  assert.equal(ends, 0);
  s.queue('strong'); assert.equal(s.buffer, '');
  s.pause(); const remaining = s.finishTimer;
  advance(s, 2); assert.equal(s.finishTimer, remaining); assert.equal(ends, 0);
  s.resume(); advance(s, 1);
  assert.equal(ends, 1);
});

test('wind spirit pursuit stays inside the arena', () => {
  const s = battle(); s.x = 1100; s.ex = 1169; s.enemyTimer = .8;
  advance(s, .4);
  assert.ok(s.ex <= 1170);
});

test('new effects stay bounded and all visual lifetimes freeze while paused', () => {
  const s = battle();
  s.effects = new Proxy({}, {get:()=>()=>{}});
  for(let i=0;i<30;i++) s.impact(400,450,0xffffff);
  assert.equal(s.impacts.length,12);
  s.particles=[{x:1,y:1,vx:20,vy:10,life:.4,max:.7,color:0xffffff,size:3}];
  let destroyed=0;
  s.callouts=[{obj:{setY(){},setAlpha(){},destroy(){destroyed++}},life:.3,y:20}];
  s.pause(); s.drawEffects(.5);
  assert.equal(s.particles[0].life,.4);
  assert.equal(s.impacts[0].life,.38);
  assert.equal(s.callouts[0].life,.3);
  s.resume(); s.drawEffects(.5);
  assert.equal(s.particles.length,0);
  assert.equal(s.impacts.length,0);
  assert.equal(s.callouts.length,0);
  assert.equal(destroyed,1);
});

test('committed attacks cannot hit an enemy behind the fighter', () => {
  const s=battle(); s.enemyTimer=100;
  s.move='quick'; s.moveTime=0; s.facing=1;
  s.ex=s.x-140;
  advance(s,.3);
  assert.equal(s.stats.hits,0);
});

test('pausing freezes atmospheric motion while the reveal can animate independently', () => {
  const s=battle();
  const object=new Proxy({}, {get:()=>()=>object});
  s.smoke=object;s.weather=object;s.floorFX=object;s.spirit=object;s.effects=object;s.backdrop=object;
  s.pause(); const clock=s.clock;
  s.update(0,50); assert.equal(s.clock,clock);
  s.reveal=true;
  s.update(50,50); assert.ok(s.clock>clock);
  assert.equal(s.mode,'pause');
});
