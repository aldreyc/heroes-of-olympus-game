import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { HEROES, BATTLE_RULES } from '../src/combat-model.mjs';
import { MIDAS_RULES, GOLD_STAGES } from '../src/midas-model.mjs';
function compiled(path) { return ts.transpileModule(fs.readFileSync(path,'utf8').replace(/^import .*;$/gm,''),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText; }
function setup(completed=false) {
 const storage=new Map(completed?[['olympus-complete','true']]:[]),nodes=new Map(),timers=new Map();
 let now=0,id=0,activeMotion=0,activeChase=0,finishChase;const voices=[];
 const element=()=>({innerHTML:'',classList:{add(){},remove(){},toggle(){}},querySelector(){return null},querySelectorAll(){return []}});
 const ui=element(),persistent=element(),app=element();
 const node=(key)=>{if(!nodes.has(key))nodes.set(key,{events:{},style:{},classList:{toggle(){}},setAttribute(){},addEventListener(type,fn){this.events[type]=fn},insertAdjacentHTML(_where,html){ui.innerHTML+=html},focus(){}});return nodes.get(key)};
 class Scene { goldHits=0;encounter='dylan';health=3600;heroMaxHealth=3600;enemyHealth=3200;enemyMaxHealth=3200;meter=35;streak=0;streakTimer=0;charm=0;rallyCooldown=0;startFight(_hero,encounter){this.encounter=encounter;this.goldHits=0;this.health=this.heroMaxHealth=encounter==='midas'?10:3600;this.enemyMaxHealth=encounter==='midas'?1500:encounter==='golden-dragon'?1800:encounter==='medea'?1900:3200;this.enemyHealth=this.enemyMaxHealth;this.mode='battle'}resume(){this.mode='battle'}player={setVisible(){}};enemy={setVisible(){}};stats={hits:5,perfectBlocks:1,counters:1,bestCombo:2};reduced=false;mode='scenery';keys=new Set(['j']);buffer='strong';pendingResult=true;textures={get(){return {getSourceImage(){return {}}}}};scenery(){this.mode='scenery'}pause(){this.mode='pause'} }
 const context={exports:{},HEROES,BATTLE_RULES,MIDAS_RULES,GOLD_STAGES,OlympusScene:Scene,
  Phaser:{Game:class{},Scale:{FIT:0,CENTER_BOTH:0}},
  localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},
  document:{querySelector:s=>({'#ui':ui,'#persistent':persistent,'#app':app})[s],getElementById:node,querySelectorAll:()=>[],addEventListener(){}},
  window:{addEventListener(){},setTimeout(fn,ms){timers.set(++id,{fn,at:now+ms});return id}},
  clearTimeout:handle=>timers.delete(handle),requestAnimationFrame:fn=>fn(0),matchMedia:()=>({matches:false}),
  audio:{stopVoice(){},wind(){},playMusic(){},init(){},sfx(){},ambience(){},narration:key=>voices.push(key)},
  startStoryMotion(){activeMotion++;return ()=>activeMotion--},storyTableau:()=>'',
  startQuestCinematic(){return ()=>{}},questTableau:()=>'',startMansionFlight(){return ()=>{}},mansionFlightTableau:()=>'',midasTableau:()=>'',BLUE_STRIKE_TIME:2.4,startDragonCinematic(){return ()=>{}},dragonChaseHTML:()=>'<section>Run, Leo!</section>',
  startDragonChase(_root,options){activeChase++;finishChase=options.done;return {dispose(){activeChase--},togglePause(){}}},
 };
 vm.runInNewContext(compiled('src/story.ts'),context);Object.assign(context,context.exports);
 vm.runInNewContext(compiled('src/camp-story.ts'),context);Object.assign(context,context.exports);
 vm.runInNewContext(compiled('src/chase-frames.ts'),context);Object.assign(context,context.exports);
 vm.runInNewContext(compiled('src/quest-story.ts'),context);Object.assign(context,context.exports);
 vm.runInNewContext(compiled('src/midas-story.ts'),context);Object.assign(context,context.exports);
 vm.runInNewContext(compiled('src/main.ts')+'\nexports.flow={title,win:()=>scene.onEnd(true),lose:()=>scene.onEnd(false),getPage:()=>page,showBattle:()=>setPage("battle",battleHTML()),pauseMenu,getScene:()=>scene};',context);
 return {ui,persistent,storage,timers,voices,motion:()=>activeMotion,chase:()=>activeChase,winChase:()=>finishChase(),...context.exports.flow,
  click:key=>node(key).events.click(),
  nextTimer(){const [key,timer]=[...timers.entries()].sort((a,b)=>a[1].at-b[1].at)[0];timers.delete(key);now=timer.at;timer.fn()},
 };
}
function finishAtMidas(f) {
 assert.equal(f.getPage(),'story');assert.ok(f.ui.innerHTML.includes('Impact'));
 f.click('skip');assert.equal(f.getPage(),'battle');assert.equal(f.getScene().encounter,'midas');
 f.win();assert.ok(f.ui.innerHTML.includes('The golden king falters'));f.click('skip');assert.equal(f.getPage(),'complete');
}
test('victory flows through rescue, camp, a playable chase and the dragon return before completion',()=>{
 const f=setup();f.win();assert.equal(f.storage.get('olympus-camp-unlocked'),'true');
 let reachedCamp=false,reachedDragon=false;
 for(let n=0;n<100&&f.getPage()!=='chase';n++){
  reachedCamp ||= f.ui.innerHTML.includes('A place for demigods');
  reachedDragon ||= f.ui.innerHTML.includes('The bronze dragon');
  assert.ok(f.timers.size);f.nextTimer();
 }
 assert.ok(reachedCamp&&reachedDragon);assert.equal(f.getPage(),'chase');assert.equal(f.chase(),1);assert.equal(f.motion(),0);
 f.winChase();assert.equal(f.chase(),0);assert.ok(f.ui.innerHTML.includes("A dragon's favorite drink"));
 for(let n=0;n<35&&f.getPage()!=='battle';n++)f.nextTimer();
 assert.equal(f.getPage(),'battle');assert.equal(f.getScene().encounter,'medea');assert.ok(f.ui.innerHTML.includes('MEDEA'));
 assert.ok(f.voices.includes('rachel-prophecy'));f.win();
 for(let n=0;n<12&&f.getPage()!=='battle';n++)f.nextTimer();
 assert.equal(f.getScene().encounter,'golden-dragon');assert.equal(f.getPage(),'battle');f.win();
 for(let n=0;n<65&&f.getPage()!=='battle';n++)f.nextTimer();
 assert.equal(f.getScene().encounter,'midas');f.win();f.click('skip');
 assert.equal(f.getPage(),'complete');assert.equal(f.motion(),0);assert.equal(f.timers.size,0);
 assert.ok(f.ui.innerHTML.includes('Against the golden king.'));
});
test('an existing completed save can continue at camp and skip without leaving animation or timers',()=>{
 const f=setup(true);f.title();assert.ok(f.ui.innerHTML.includes('CONTINUE AT CAMP'));
 f.click('continue-camp');assert.ok(f.ui.innerHTML.includes('A place for demigods'));
 for(let n=0;n<6;n++)f.click('next');assert.ok(f.ui.innerHTML.includes('Beyond the cabins'));assert.equal(f.motion(),1);
 f.click('skip');assert.equal(f.getPage(),'chase');assert.equal(f.motion(),0);assert.equal(f.timers.size,0);
 f.click('skip-chase');assert.equal(f.chase(),0);assert.ok(f.ui.innerHTML.includes("A dragon's favorite drink"));
 f.winChase();assert.ok(f.ui.innerHTML.includes("A dragon's favorite drink"),'a late chase callback cannot restart the story');
 f.click('skip');assert.ok(f.ui.innerHTML.includes('Three heroes. One quest.'));
 f.click('skip');assert.ok(f.ui.innerHTML.includes('Beyond Half-Blood Hill'));
 f.click('skip');assert.equal(f.getPage(),'battle');f.win();f.click('skip');assert.equal(f.getScene().encounter,'golden-dragon');f.win();f.click('skip');assert.ok(f.ui.innerHTML.includes('A moment to breathe'));f.click('skip');finishAtMidas(f);assert.equal(f.motion(),0);assert.equal(f.timers.size,0);
 f.click('replay-camp');assert.ok(f.ui.innerHTML.includes('A place for demigods'));assert.equal(f.motion(),1);
});
test('completed saves can replay the chase directly and dispose it when leaving',()=>{
 const f=setup(true);f.title();assert.ok(f.ui.innerHTML.includes('PLAY DRAGON CHASE'));
 f.click('continue-chase');assert.equal(f.getPage(),'chase');assert.equal(f.chase(),1);
 f.click('skip-chase');assert.equal(f.chase(),0);f.click('skip');f.click('skip');f.click('skip');f.win();f.click('skip');assert.equal(f.getScene().encounter,'golden-dragon');f.win();f.click('skip');assert.ok(f.ui.innerHTML.includes('A moment to breathe'));f.click('skip');finishAtMidas(f);
 f.click('replay-chase');assert.equal(f.chase(),1);assert.equal(f.getPage(),'chase');
});
test('a fresh save first presents the original play flow',()=>{
 const f=setup();f.title();assert.ok(!f.ui.innerHTML.includes('CONTINUE AT CAMP'));
 f.click('play');assert.equal(f.getPage(),'books');
});
test('Skip battle stops combat and proceeds through the rescue and camp without fighting',()=>{
 const f=setup();f.showBattle();assert.ok(f.persistent.innerHTML.includes('SKIP BATTLE'));
 const hits=f.getScene().stats.hits;
 f.click('skip-battle');assert.equal(f.getPage(),'story');assert.ok(f.ui.innerHTML.includes('Over the edge'));
 assert.equal(f.getScene().mode,'scenery');assert.equal(f.getScene().keys.size,0);assert.equal(f.getScene().buffer,'');assert.equal(f.getScene().pendingResult,null);
 assert.equal(f.getScene().stats.hits,hits);assert.equal(f.storage.get('olympus-camp-unlocked'),'true');
 f.click('next');assert.ok(f.ui.innerHTML.includes('Jason jumps'));
 f.click('skip-battle');assert.ok(f.ui.innerHTML.includes('Jason jumps'),'a queued second skip must not restart the ending');
 f.click('skip');assert.ok(f.ui.innerHTML.includes('A place for demigods'));
});
test('Skip battle also works from the pause menu',()=>{
 const f=setup();f.showBattle();f.pauseMenu();assert.equal(f.getPage(),'pause');
 assert.ok(f.ui.innerHTML.includes('SKIP BATTLE'));
 f.click('skip-battle-paused');assert.equal(f.getPage(),'story');assert.ok(f.ui.innerHTML.includes('Over the edge'));
});

test('completed saves can go straight to the quest; skip, pause and retry stay in the Medea encounter',()=>{
 const f=setup(true);f.title();assert.ok(f.ui.innerHTML.includes('CONTINUE THE QUEST'));
 f.click('continue-quest');assert.ok(f.ui.innerHTML.includes('Three heroes. One quest.'));
 f.click('next');f.click('next');assert.ok(f.ui.innerHTML.includes('ORACLE OF DELPHI'));assert.equal(f.voices.at(-1),'rachel-prophecy');
 f.click('next');assert.ok(f.ui.innerHTML.includes('The road ahead'));
 f.click('skip');f.click('skip');assert.equal(f.getPage(),'battle');assert.equal(f.getScene().encounter,'medea');
 f.pauseMenu();f.click('retry');assert.equal(f.getPage(),'battle');assert.equal(f.getScene().encounter,'medea');
 f.click('skip-battle');assert.ok(f.ui.innerHTML.includes('The spell breaks'));f.click('skip');assert.equal(f.getPage(),'battle');assert.equal(f.getScene().encounter,'golden-dragon');
 f.pauseMenu();f.click('retry');assert.equal(f.getScene().encounter,'golden-dragon');
 f.click('skip-battle');assert.ok(f.ui.innerHTML.includes('Through the window'));f.click('next');assert.ok(f.ui.innerHTML.includes('Bronze fire'));f.click('next');assert.ok(f.ui.innerHTML.includes('The guardian falls'));f.click('next');assert.ok(f.ui.innerHTML.includes('Coach Hedge!'));f.click('skip');assert.ok(f.ui.innerHTML.includes('A moment to breathe'));f.click('skip');finishAtMidas(f);
 f.click('replay-medea');assert.equal(f.getScene().encounter,'medea');assert.equal(f.getPage(),'battle');
});

test('Medea victory cannot free Hedge before the gold dragon battle and Festus rescue',()=>{
 const f=setup(true);f.title();f.click('continue-quest');f.click('skip');f.click('skip');f.win();
 assert.ok(f.ui.innerHTML.includes('The spell breaks'));assert.ok(!f.ui.innerHTML.includes('find Coach Hedge and free him'));
 f.click('next');assert.ok(f.ui.innerHTML.includes('A guardian of gold'));f.click('next');
 assert.equal(f.getPage(),'battle');assert.equal(f.getScene().encounter,'golden-dragon');assert.ok(f.ui.innerHTML.includes('⅓'));
 f.win();assert.ok(f.ui.innerHTML.includes('Through the window'));f.click('next');assert.ok(f.ui.innerHTML.includes('Bronze fire'));
 f.click('next');assert.ok(f.ui.innerHTML.includes('The guardian falls'));f.click('next');assert.ok(f.ui.innerHTML.includes('find Coach Hedge and free him'));
 f.click('skip');assert.ok(f.ui.innerHTML.includes('A moment to breathe'));f.click('skip');finishAtMidas(f);f.click('replay-golden-dragon');assert.equal(f.getScene().encounter,'golden-dragon');assert.equal(f.getPage(),'battle');
});

test('flight preview includes relief, a timed blue strike and descent to a mansion, and skip clears its timers',()=>{
 const f=setup(true);f.title();assert.ok(f.ui.innerHTML.includes('PLAY NEW FLIGHT SCENE'));f.click('continue-mansion');
 assert.equal(f.storage.get('olympus-mansion-unlocked'),'true');assert.ok(f.ui.innerHTML.includes('A moment to breathe'));
 f.click('next');assert.ok(f.ui.innerHTML.includes('Above the winter hills'));
 f.click('next');assert.ok(f.ui.innerHTML.includes('Out of the blue'));assert.ok(f.timers.size>=2);
 f.click('next');assert.ok(f.ui.innerHTML.includes('Hold on'));f.click('next');assert.ok(f.ui.innerHTML.includes('The mansion below'));
 f.click('next');finishAtMidas(f);assert.equal(f.timers.size,0);assert.equal(f.motion(),0);
 f.click('replay-flight');assert.ok(f.ui.innerHTML.includes('A moment to breathe'));f.click('skip');finishAtMidas(f);assert.equal(f.timers.size,0);
});

test('crash and Hephaestus scenes precede Hedge guarding, two gold statues and a Jason-only Midas battle',()=>{
 const f=setup(true);f.title();assert.ok(f.ui.innerHTML.includes('PLAY CRASH & KING MIDAS'));f.click('continue-midas');
 for(const title of ['Impact','One more repair','A visitor from the forge','Nothing is wasted','Back to the forge','Guard the entrance','Two flashes of gold','King Midas']){
  assert.ok(f.ui.innerHTML.includes(title),title);f.click('next');
 }
 assert.equal(f.getPage(),'battle');assert.equal(f.getScene().encounter,'midas');assert.ok(f.ui.innerHTML.includes('JASON'));assert.ok(f.ui.innerHTML.includes('GOLD HITS · 0 / 10'));
 f.pauseMenu();f.click('retry');assert.equal(f.getScene().encounter,'midas');assert.equal(f.getScene().goldHits,0);
 f.click('skip-battle');assert.ok(f.ui.innerHTML.includes('The golden king falters'));f.click('skip');assert.equal(f.getPage(),'complete');
 f.click('replay-midas-story');assert.ok(f.ui.innerHTML.includes('Impact'));assert.equal(f.storage.get('olympus-midas-unlocked'),'true');
});


test('a Midas defeat keeps the gold Jason tableau and retries this encounter without stale story timers',()=>{
 const f=setup(true);f.title();f.click('continue-midas');f.click('skip');
 f.getScene().goldHits=10;f.getScene().health=0;f.getScene().mode='pause';f.lose();
 assert.equal(f.getPage(),'defeat');assert.ok(f.ui.innerHTML.includes('Jason has turned to gold'));assert.equal(f.getScene().mode,'pause');assert.equal(f.getScene().goldHits,10);assert.equal(f.timers.size,0);
 f.click('retry');assert.equal(f.getPage(),'battle');assert.equal(f.getScene().encounter,'midas');assert.equal(f.getScene().health,10);assert.equal(f.getScene().goldHits,0);
 f.lose();f.click('replay-midas-arrival');assert.equal(f.getPage(),'story');assert.ok(f.ui.innerHTML.includes('Impact'));
});
