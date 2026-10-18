import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { Window } from 'happy-dom';
import { HEROES } from '../src/combat-model.mjs';
const storyCode=ts.transpileModule(fs.readFileSync('src/story.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const storyScope={exports:{}};vm.runInNewContext(storyCode,storyScope);
const mainCode=ts.transpileModule(fs.readFileSync('src/main.ts','utf8').replace(/^import .*;$/gm,'').replace('await import("./three/view")','await loadThree()'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
async function harness({fail=false,savedMode='2d'}={}) {
 const window=new Window({url:'http://game.test'}),document=window.document;
 document.body.innerHTML='<div id="app"><div id="game"></div><main id="ui"></main><div id="persistent"></div><div id="toast"></div></div>';
 window.localStorage.setItem('olympus-visual-mode',savedMode);
 let scene,view,loads=0,prepares=0;
 class MockScene {
  mode='scenery';health=100;enemyHealth=160;meter=35;heroIndex=0;x=300;y=590;ex=950;streak=0;streakTimer=0;keys=new Set();stats={};
  cameras={main:{visible:true,setVisible(v){this.visible=v;}}};
  player={visible:true,setVisible(v){this.visible=v;return this;}};enemy={setVisible(){}};ground={setVisible(){}};label={setText(){}};
  constructor(){scene=this;}
  scenery(){this.mode='scenery';}startFight(i){this.heroIndex=i;this.mode='battle';this.health=100;this.enemyHealth=160;}pause(){this.mode='pause';}resume(){this.mode='battle';}renderHero(){}queue(m){this.queued=m;}
 }
 class Mock3D {
  enabled=false;qualityName='cinematic';disposed=false;
  constructor(host,failure){view=this;this.failure=failure;this.host=host;}
  async prepare(){prepares++;}
  setEnabled(v){this.enabled=v;}setStage(stage,hero,beat){this.stage=stage;this.hero=hero;this.beat=beat;}dispose(){this.disposed=true;}update(){}diagnostics(){return{quality:this.qualityName};}toggleQuality(){this.qualityName='performance';}
 }
 const timers=new Map();let id=0;window.setTimeout=(fn)=>{timers.set(++id,fn);return id;};window.clearTimeout=i=>timers.delete(i);
 const audio={muted:false,init(){},sfx(){},setMute(){this.muted=!this.muted;},stopVoice(){},wind(){},playMusic(){},ambience(){},narration(){},music:{pause(){}}};
 const scope={exports:{},window,document,localStorage:window.localStorage,matchMedia:()=>({matches:false}),HTMLButtonElement:window.HTMLButtonElement,requestAnimationFrame:fn=>fn(),setTimeout:window.setTimeout,clearTimeout:window.clearTimeout,queueMicrotask,console:{error(){}},Phaser:{AUTO:0,Scale:{FIT:0,CENTER_BOTH:0},Game:class{}},OlympusScene:MockScene,HEROES,audio,...storyScope.exports,playProphecy:()=>({cancel(){}}),fetch:async()=>({ok:true,json:async()=>[]}),loadThree:async()=>{loads++;if(fail)throw Error('No WebGL');return{Olympus3D:Mock3D};}};
 vm.runInNewContext(mainCode,scope);window.dispatchEvent(new window.Event('game-ready'));
 const settle=async()=>{for(let i=0;i<6;i++)await Promise.resolve();};await settle();
 return {window,document,get scene(){return scene;},get view(){return view;},get loads(){return loads;},get prepares(){return prepares;},timers,settle,click:async id=>{const b=document.getElementById(id);assert.ok(b,`missing ${id}`);b.click();await settle();},key:key=>window.dispatchEvent(new window.KeyboardEvent('keydown',{key})),close:()=>window.happyDOM.abort()};
}
test('first screen offers both modes; 3D lazy-loads once and shares combat, pause, retry and return paths',async()=>{
 const h=await harness();assert.equal(h.loads,0);assert.equal(h.document.getElementById('mode-2d').getAttribute('aria-pressed'),'true');
 await h.click('mode-3d');assert.equal(h.loads,1);assert.equal(h.prepares,1);assert.ok(h.view.enabled);assert.equal(h.scene.cameras.main.visible,false);assert.equal(h.window.olympus.visualMode,'3d');
 await h.click('play');await h.click('choose');await h.click('hero-2');await h.click('confirm');
 assert.equal(h.window.olympus.page,'prophecy');await h.click('skip-prophecy');assert.equal(h.view.beat.scene,'bus');await h.click('skip');
 assert.equal(h.window.olympus.page,'battle');assert.equal(h.scene.heroIndex,2);assert.equal(h.view.stage,'battle');
 h.document.querySelector('[data-action="strong"]').click();assert.equal(h.scene.queued,'strong');
 h.key('Escape');assert.equal(h.window.olympus.page,'pause');assert.equal(h.scene.mode,'pause');
 await h.click('resume');assert.equal(h.scene.mode,'battle');
 h.key('Escape');h.scene.health=12;await h.click('retry');assert.equal(h.scene.health,100);
 h.key('Escape');await h.click('characters');await h.click('back');await h.click('back');
 await h.click('mode-2d');assert.equal(h.view.enabled,false);assert.equal(h.scene.cameras.main.visible,true);assert.equal(h.window.olympus.visualMode,'2d');
 await h.click('mode-3d');assert.equal(h.loads,1);assert.equal(h.prepares,1);assert.ok(h.view.enabled);await h.close();
});
test('saved 3D choice restores; failed initialization leaves 2D playable with an explanation',async()=>{
 const saved=await harness({savedMode:'3d'});assert.equal(saved.window.olympus.visualMode,'3d');assert.equal(saved.loads,1);await saved.close();
 const failed=await harness({fail:true});await failed.click('mode-3d');assert.equal(failed.window.olympus.visualMode,'2d');assert.equal(failed.scene.cameras.main.visible,true);
 assert.match(failed.document.querySelector('.mode-status').textContent,/WebGL 2/);assert.equal(failed.document.getElementById('play').disabled,false);
 await failed.click('play');assert.equal(failed.window.olympus.page,'books');await failed.close();
});
test('context loss preserves a running fight and returns rendering to 2D',async()=>{
 const h=await harness();await h.click('mode-3d');await h.click('play');await h.click('choose');await h.click('confirm');await h.click('skip-prophecy');await h.click('skip');
 h.scene.health=57;h.scene.enemyHealth=94;const v=h.view;v.failure('Graphics context interrupted; continuing in 2D');await h.settle();
 assert.ok(v.disposed);assert.equal(h.window.olympus.visualMode,'2d');assert.equal(h.window.olympus.page,'battle');assert.equal(h.scene.health,57);assert.equal(h.scene.enemyHealth,94);assert.ok(h.scene.cameras.main.visible);
 assert.match(h.document.getElementById('toast').textContent,/continuing in 2D/);await h.close();
});
