import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import {
  HEROES,
  MOVES,
  BATTLE_RULES,
  hitOutcome,
  attackDamage,
} from "../src/combat-model.mjs";
import { MIDAS_RULES, goldVolley, advanceGoldBolts, goldenHit } from "../src/midas-model.mjs";
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
  BATTLE_RULES,
  hitOutcome,
  attackDamage,
  MIDAS_RULES,goldVolley,advanceGoldBolts,goldenHit,
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
  s.enemyMaxHealth = 160; s.enemyHealth = 160;
  s.heroMaxHealth = 100; s.health = 100;
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
  s.spirit = {setTexture(){return this},setAlpha(){return this}};
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
  assert.equal(s.enemyHealth, 144);
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
test("crossing half health escalates combat without interrupting it", () => {
  const s = battle();
  s.enemyTimer = 100;
  s.enemyHealth = 85;
  s.queue("quick");
  advance(s, 0.4);
  assert.equal(s.mode, "battle");
  assert.equal(s.storyTriggered, true);
  assert.equal(s.enemyHealth, 69);
  s.resume();
  advance(s, 0.5);
  s.queue("quick");
  advance(s, 0.5);
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
 assert.equal(s.heroIndex,2);assert.equal(s.health,BATTLE_RULES.heroHealth);assert.equal(s.heroMaxHealth,BATTLE_RULES.heroHealth);assert.equal(s.enemyHealth,BATTLE_RULES.spiritHealth);
 assert.equal(s.streak,0);assert.equal(s.acc,0);assert.equal(s.moveTime,0);assert.equal(s.connected,false);assert.equal(s.enemyHit,false);assert.equal(s.facing,1);assert.equal(s.keys.size,0);
});

test('pause freezes the simulation and clears held movement',()=>{
 const s=battle();s.keys.add('d');advance(s,.2);s.pause();
 const snapshot={x:s.x,hp:s.health,enemyHp:s.enemyHealth,time:s.elapsed};
 advance(s,4);assert.deepEqual({x:s.x,hp:s.health,enemyHp:s.enemyHealth,time:s.elapsed},snapshot);assert.equal(s.keys.size,0);
 s.resume();advance(s,.1);assert.ok(s.elapsed>snapshot.time);
});

for(let hero=0;hero<HEROES.length;hero++)test(`${HEROES[hero].name} can win a complete simulated battle before the rescue sequence`,()=>{
 const s=battle();s.heroIndex=hero;s.x=300;s.ex=950;s.enemyMaxHealth=BATTLE_RULES.spiritHealth;s.enemyHealth=s.enemyMaxHealth;s.heroMaxHealth=BATTLE_RULES.heroHealth;s.health=s.heroMaxHealth;
 let result; let frames=0;
 s.onEnd=won=>{result=won;};
 for(let frame=0;frame<60*240&&result===undefined;frame++){
  frames++;
  s.keys.clear();const distance=Math.abs(s.ex-s.x);
  if(distance>145&&!s.move)s.keys.add(s.ex>s.x?'d':'a');
  const danger=s.enemyPhase==='tell'||s.enemyPhase==='attack';
  if(danger){
   if(s.enemyMove==='low'&&s.enemyPhase==='tell'&&s.enemyTimer<.38&&s.y>=589)s.queue('jump');
   else if(s.enemyMove!=='low')s.keys.add('s');
  }else if(!s.move&&distance<185&&s.y>=589)s.queue(s.meter>=50?'special':'strong');
  s.step(1/60);
 }
 const target = hero === 0 ? BATTLE_RULES.jasonTargetSeconds : BATTLE_RULES.targetSeconds;
 assert.ok(frames/60 >= target[0] && frames/60 <= target[1], `encounter took ${frames/60}s`);
 assert.equal(result,true);assert.ok(s.health>0);assert.ok(s.stats.hits>0);
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
  assert.equal(s.enemyHealth, 139);
  assert.equal(s.stats.counters, 1);
  s.ex = s.x + 140;
  s.queue('quick'); advance(s, .5);
  assert.equal(s.enemyHealth, 122); // second hit gets the chain bonus, not another counter bonus
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
test('full player health exceeds the spirit and survives repeated unblocked gusts', () => {
 const s=battle();
 s.heroMaxHealth=BATTLE_RULES.heroHealth;s.health=s.heroMaxHealth;
 s.enemyMaxHealth=BATTLE_RULES.spiritHealth;s.enemyHealth=s.enemyMaxHealth;
 assert.ok(s.heroMaxHealth>s.enemyMaxHealth);
 let defeated=0;s.onEnd=()=>defeated++;
 for(let i=0;i<20;i++){
   s.enemyPhase='attack';s.enemyMove='sweep';s.enemyTimer=.28;s.enemyHit=false;
   s.step(1/60);
 }
 assert.equal(s.health,BATTLE_RULES.heroHealth-20*9);
 assert.equal(s.mode,'battle');assert.equal(defeated,0);
});

test('Medea restart has its own enchantment health and clears charm and rally state',()=>{
 const s=battle(),visual=new Proxy({}, {get:()=>()=>visual});
 for(const field of ['player','enemy','spirit','ground','shadow','backdrop','label','warning'])s[field]=visual;
 s.charm=95;s.rallyCooldown=6;s.rallyFlash=.3;s.startFight(1,'medea');
 assert.equal(s.encounter,'medea');assert.equal(s.health,3600);assert.equal(s.enemyHealth,1900);
 assert.equal(s.charm,0);assert.equal(s.rallyCooldown,0);assert.equal(s.rallyFlash,0);
 s.startFight(0);assert.equal(s.encounter,'dylan');assert.equal(s.enemyHealth,3200);
});
test('Piper rally clears enchantment, restores a little health, opens a stun and has a real cooldown',()=>{
 const s=battle();s.encounter='medea';s.charm=88;s.health=20;s.meter=20;
 s.queue('rally');assert.equal(s.charm,0);assert.equal(s.health,80);assert.equal(s.meter,35);assert.equal(s.enemyPhase,'stunned');assert.equal(s.rallyCooldown,8);
 s.charm=75;s.rally();assert.equal(s.charm,75);assert.equal(s.meter,35);
 s.pause();const remaining=s.rallyCooldown;advance(s,4);assert.equal(s.rallyCooldown,remaining);
 s.resume();s.enemyTimer=100;advance(s,8.1);s.rally();assert.equal(s.charm,0);assert.equal(s.rallyCooldown,8);
});
test('rally cannot interrupt a finished fight or be used in the canyon',()=>{
 const s=battle();s.charm=90;s.rally();assert.equal(s.charm,90);
 s.encounter='medea';s.pendingResult=true;s.rally();assert.equal(s.charm,90);
});
test('Medea casts charmspeak across the arena without charging through the floor',()=>{
 const s=battle();s.encounter='medea';s.ex=1000;s.x=300;s.health=3600;s.heroMaxHealth=3600;s.enemyPhase='attack';s.enemyMove='charge';s.enemyTimer=.3;
 s.step(1/60);assert.equal(s.ex,1000);assert.equal(s.health,3587);assert.ok(s.charm>=74);
 const hp=s.health;advance(s,.15);assert.equal(s.health,hp,'a spell connects once, not once per frame');
});
test('blocking charmspeak prevents both the enchantment and the hit',()=>{
 const s=battle();s.encounter='medea';s.keys.add('s');s.enemyPhase='attack';s.enemyMove='charge';s.enemyTimer=.3;
 const hp=s.health;s.step(1/60);assert.equal(s.charm,0);assert.equal(s.health,hp);assert.equal(s.stats.perfectBlocks,1);
});
test('Medea ward and high enchantment reduce strikes; rally restores their full strength',()=>{
 const s=battle();s.encounter='medea';s.enemyTimer=100;s.enemyPhase='tell';s.charm=90;
 s.queue('quick');advance(s,.5);assert.equal(s.stats.damage,7);
 s.rally();s.ex=s.x+140;s.queue('quick');advance(s,.5);assert.ok(s.stats.damage>=24);
});
for(let hero=0;hero<3;hero++)test(`${HEROES[hero].name} can break Medea's enchantment with readable defensive play`,()=>{
 const s=battle();s.encounter='medea';s.heroIndex=hero;s.x=300;s.ex=950;s.enemyMaxHealth=1900;s.enemyHealth=1900;s.heroMaxHealth=3600;s.health=3600;
 let result,seconds=0;s.onEnd=won=>result=won;
 for(let frame=0;frame<60*180&&result===undefined;frame++){
  seconds=frame/60;s.keys.clear();const d=Math.abs(s.ex-s.x);
  if(d>145&&!s.move)s.keys.add(s.ex>s.x?'d':'a');
  if(s.rallyCooldown<=0&&s.enemyPhase==='tell'&&s.enemyMove==='charge')s.rally();
  const danger=s.enemyPhase==='tell'||s.enemyPhase==='attack';
  if(danger){if(s.enemyMove==='low'&&s.enemyPhase==='tell'&&s.enemyTimer<.38&&s.y>=589)s.queue('jump');else if(s.enemyMove!=='low')s.keys.add('s');}
  else if(!s.move&&d<185&&s.y>=589)s.queue(s.meter>=50?'special':'strong');
  s.step(1/60);
 }
 assert.equal(result,true);assert.ok(s.health>0);assert.ok(seconds>25&&seconds<180,`duration ${seconds}s`);
});

test('the golden dragon hands over at exactly one third, even if the final strike would overshoot',()=>{
 const s=battle();s.encounter='golden-dragon';s.enemyMaxHealth=1800;s.enemyHealth=601;s.enemyTimer=100;
 let endings=0;s.onEnd=won=>{assert.equal(won,true);endings++};s.queue('strong');advance(s,.35);
 assert.equal(s.enemyHealth,600);assert.equal(s.stats.damage,1);assert.equal(s.pendingResult,true);
 const hp=s.health;s.queue('special');advance(s,2);assert.equal(endings,1);assert.equal(s.enemyHealth,600);assert.equal(s.health,hp);
});
test('golden dragon damage above the one-third boundary keeps combat playable',()=>{
 const s=battle();s.encounter='golden-dragon';s.enemyMaxHealth=1800;s.enemyHealth=1000;s.enemyTimer=100;s.queue('strong');advance(s,.5);
 assert.equal(s.pendingResult,null);assert.ok(s.enemyHealth>600);assert.equal(s.mode,'battle');
});
test('the golden dragon body stays within the arena and Leo resists its floor fire',()=>{
 const s=battle();s.encounter='golden-dragon';s.heroIndex=2;s.x=600;s.ex=1300;s.enemyPhase='attack';s.enemyMove='low';s.enemyTimer=.2;
 const hp=s.health;s.step(1/60);assert.equal(s.health,hp);assert.equal(s.ex,980);
 s.enemyHit=false;s.enemyMove='sweep';s.enemyTimer=.2;s.ex=720;s.step(1/60);assert.ok(s.health<hp);
});
for(let hero=0;hero<3;hero++)test(`${HEROES[hero].name} can weaken the golden automaton and summon Festus once`,()=>{
 const s=battle();s.encounter='golden-dragon';s.heroIndex=hero;s.enemyMaxHealth=1800;s.enemyHealth=1800;s.heroMaxHealth=3600;s.health=3600;s.x=300;s.ex=950;
 let endings=0;s.onEnd=won=>{assert.equal(won,true);endings++};
 for(let frame=0;frame<60*180&&endings===0;frame++){
  s.keys.clear();const d=Math.abs(s.ex-s.x);if(d>145&&!s.move)s.keys.add(s.ex>s.x?'d':'a');
  if(s.enemyPhase==='tell'||s.enemyPhase==='attack'){
   if(s.enemyMove==='low'&&s.enemyPhase==='attack'&&s.enemyTimer>.4&&s.y>=589)s.queue('jump');else if(s.enemyMove!=='low')s.keys.add('s');
  }else if(!s.move&&d<185&&s.y>=589)s.queue(s.meter>=50?'special':'strong');
  s.step(1/60);
 }
 assert.equal(endings,1);assert.equal(s.enemyHealth,600);assert.equal(s.stats.damage,1200);assert.ok(s.health>0);advance(s,3);assert.equal(endings,1);
});

function midasBattle() {
 const s=battle();s.encounter='midas';s.heroIndex=0;s.health=s.heroMaxHealth=10;s.enemyMaxHealth=s.enemyHealth=MIDAS_RULES.health;return s;
}
function incomingGold(s, low=false) {
 s.goldBolts=[{x:s.x+40,y:low?565:450,vx:-460,radius:12,low,delay:0,spin:0}];
}
test('Midas requires ten real golden hits and presents the full-gold defeat only once',()=>{
 const s=midasBattle();s.enemyTimer=100;let losses=0;s.onEnd=won=>{assert.equal(won,false);losses++};
 for(let i=1;i<=10;i++){
  s.hurt=0;s.freeze=0;incomingGold(s);s.step(1/60);
  assert.equal(s.goldHits,i);assert.equal(s.health,10-i);assert.equal(s.goldBolts.length,0);
  if(i<10)assert.equal(s.pendingResult,null);
 }
 assert.equal(s.pendingResult,false);assert.equal(losses,0);assert.ok(s.finishTimer>=1.8);
 s.queue('strong');advance(s,4);assert.equal(losses,1);assert.equal(s.goldHits,10);assert.equal(s.mode,'pause');
});
test('Midas guard has no chip gold, even on the ninth hit; low shots require jumping',()=>{
 const s=midasBattle();s.enemyTimer=100;s.goldHits=9;s.health=1;s.keys.add('s');incomingGold(s);s.step(1/60);
 assert.equal(s.health,1);assert.equal(s.goldHits,9);assert.equal(s.stats.blocks,1);assert.equal(s.pendingResult,null);
 s.keys.clear();s.y=480;incomingGold(s,true);s.step(1/60);
 assert.equal(s.health,1);assert.equal(s.goldHits,9);
 s.y=590;s.vy=0;s.keys.add('s');incomingGold(s,true);s.step(1/60);assert.equal(s.goldHits,10);assert.equal(s.pendingResult,false);
});
test('a single gold hit gives brief protection and pausing freezes projectiles',()=>{
 const s=midasBattle();s.enemyTimer=100;incomingGold(s);s.step(1/60);assert.equal(s.goldHits,1);
 incomingGold(s);s.step(1/60);assert.equal(s.goldHits,1);assert.equal(s.goldBolts.length,0);
 incomingGold(s);s.pause();const x=s.goldBolts[0].x;advance(s,3);assert.equal(s.goldBolts[0].x,x);assert.equal(s.goldHits,1);
 s.resume();s.hurt=0;s.freeze=0;s.step(1/60);assert.equal(s.goldHits,2);
});
test('restarting Midas forces Jason, restores all ten resistance points and clears the old curse',()=>{
 const s=midasBattle(),visual=new Proxy({}, {get:()=>()=>visual});
 for(const field of ['player','enemy','ground','shadow','backdrop','label','warning'])s[field]=visual;
 s.prepareGoldStatues=()=>{};s.goldHits=9;s.health=1;incomingGold(s);s.startFight(2,'midas');
 assert.equal(s.heroIndex,0);assert.equal(s.health,10);assert.equal(s.heroMaxHealth,10);assert.equal(s.goldHits,0);assert.equal(s.goldBolts.length,0);assert.equal(s.enemyHealth,MIDAS_RULES.health);
 s.startFight(1,'medea');assert.equal(s.health,BATTLE_RULES.heroHealth);assert.equal(s.heroIndex,1);assert.equal(s.goldBolts.length,0);
});
test('Jason can defeat Midas by approaching, guarding airborne gold and jumping low gold',()=>{
 const s=midasBattle();s.x=300;s.ex=950;let result,frames=0;s.onEnd=won=>result=won;
 for(;frames<60*180&&result===undefined;frames++){
  s.keys.clear();const distance=Math.abs(s.ex-s.x);
  const nearby=s.goldBolts.filter(b=>b.delay<=0&&Math.abs(b.x-s.x)<190);
  if(nearby.some(b=>b.low)&&s.y>=589)s.queue('jump');
  else if(nearby.some(b=>!b.low))s.keys.add('s');
  else if(!s.move&&s.y>=589){
   if(distance>145)s.keys.add(s.ex>s.x?'d':'a');
   else s.queue(s.meter>=50?'special':'strong');
  }
  s.step(1/60);
 }
 assert.equal(result,true,`result ${result}, gold hits ${s.goldHits}, enemy ${s.enemyHealth}, time ${frames/60}`);
 assert.ok(s.goldHits<10);assert.ok(s.stats.hits>0);assert.ok(frames/60>15&&frames/60<180);
});

test('Midas stays inside the room even in his wide low-casting pose',()=>{
 const s=midasBattle();s.enemyTimer=100;
 for(const [x,expected]of [[-100,240],[1500,1040]]){s.ex=x;s.step(1/60);assert.equal(s.ex,expected);}
});
