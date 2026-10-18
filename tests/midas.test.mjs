import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {goldRegions,goldenHit,goldVolley,advanceGoldBolts,MIDAS_RULES} from '../src/midas-model.mjs';
function mod(path,deps={}){const s={exports:{},...deps};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8').replace(/^import .*;$/gm,''),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,s);return s.exports;}
const {midasFrames,MIDAS_ART}=mod('src/midas-frames.ts'),{storyFrames}=mod('src/story-frames.ts'),{spriteSvg}=mod('src/sprite-svg.ts');
const {midasTableau}=mod('src/midas-tableau.ts',{midasFrames,storyFrames,spriteSvg,walkingActor:n=>`<walk>${n}</walk>`});
const {midasArrival,midasEnding}=mod('src/midas-story.ts');
const {gildPixels,gildFramePixels,applyGoldCurse,ensureGoldTexture}=mod('src/gold-render.ts',{goldRegions});
const hero={x:500,y:590,blocking:false,invulnerable:false};
const bolt=(overrides={})=>({x:750,y:450,vx:-460,radius:12,low:false,delay:0,spin:0,...overrides});
test('gold projectiles use swept contact at low frame rates and count a projectile only once',()=>{
 const out=advanceGoldBolts([bolt()],1,hero);assert.equal(out.events.length,1);assert.equal(out.events[0].type,'hit');assert.equal(out.bolts.length,0);
 assert.equal(advanceGoldBolts(out.bolts,1,hero).events.length,0);
 assert.equal(advanceGoldBolts([bolt()],1,{...hero,blocking:true}).events[0].type,'block');
 assert.equal(advanceGoldBolts([bolt()],1,{...hero,invulnerable:true}).events[0].type,'immune');
 assert.equal(advanceGoldBolts([bolt({low:true,y:565})],1,{...hero,y:480}).events.length,0);
 assert.equal(advanceGoldBolts([bolt({low:true,y:565})],1,{...hero,blocking:true}).events[0].type,'hit');
 const simultaneous=advanceGoldBolts([bolt(),bolt()],1,hero);assert.equal(simultaneous.events.filter(e=>e.type==='hit').length,1);assert.equal(simultaneous.events.filter(e=>e.type==='immune').length,1);
});
test('delayed double gold has separate travel time and expires beyond the screen',()=>{
 const bolts=goldVolley('charge',1000,500);assert.equal(bolts.length,2);assert.equal(bolts[0].x,865);assert.equal(bolts[1].delay,.48);
 let out=advanceGoldBolts(bolts,.3,hero);assert.equal(out.events.length,0);assert.equal(out.bolts[1].x,865);assert.ok(out.bolts[1].delay>0);
 out=advanceGoldBolts(out.bolts,.3,hero);assert.ok(Math.abs(out.bolts[1].x-(865-460*.12))<.001);
 assert.equal(advanceGoldBolts([bolt({y:100})],5,hero).bolts.length,0);
 assert.ok(goldVolley('low',200,500)[0].vx>0);assert.equal(goldVolley('low',200,500)[0].y,565);
});
test('every hit increases cumulative gold coverage; only ten covers the entire frame',()=>{
 const covered=(n,x,y)=>goldRegions(n).some(([rx,ry,w,h])=>x>=rx&&x<rx+w&&y>=ry&&y<ry+h);
 for(let n=0;n<10;n++){
  assert.equal(goldenHit(n),n+1);
  for(let y=0;y<1;y+=.025)for(let x=0;x<1;x+=.025)if(covered(n,x,y))assert.ok(covered(n+1,x,y));
  assert.equal(covered(n,.5,.05),false);
 }
 assert.equal(goldenHit(10),10);assert.equal(goldRegions(0).length,0);assert.equal(covered(10,.5,.05),true);assert.equal(MIDAS_RULES.hitLimit,10);
});
test('gold mapping preserves alpha, transparent pixels and visible shading',()=>{
 const data=new Uint8ClampedArray([10,20,30,0,20,20,20,128,220,220,220,255]),original=data.slice();gildPixels(data);
 assert.deepEqual(Array.from(data.slice(0,4)),Array.from(original.slice(0,4)));assert.equal(data[7],128);assert.equal(data[11],255);
 assert.ok(data[4]>data[5]&&data[5]>data[6]);assert.ok(data[8]>data[4]);
 const frame=new Uint8ClampedArray(20*20*4);for(let i=0;i<frame.length;i+=4)frame.set([100,80,140,255],i);
 gildFramePixels(frame,20,20,1);assert.deepEqual(Array.from(frame.slice(0,4)),[100,80,140,255]);
 assert.ok(frame[(19*20+19)*4]>100);assert.deepEqual(Array.from(frame.slice(19*20*4,19*20*4+4)),[100,80,140,255]);
 gildFramePixels(frame,20,20,10);assert.ok(frame[0]>frame[1]&&frame[1]>frame[2]);
});
test('runtime gold textures retain exact pose dimensions, origin, frames and cache',()=>{
 const registry=new Map(),frame={name:'idle',cutX:20,cutY:30,cutWidth:40,cutHeight:60};let creates=0,cleared=0;
 function makeTexture(w,h){return {getContext:()=>({drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(w*h*4).fill(255)}),putImageData(){}}),refresh(){},frames:[],add(name,...args){this.frames.push([name,...args])}};}
 const original={key:'jason-idle',getSourceImage:()=>({width:100,height:100}),getFrameNames:()=>['idle'],get:()=>frame};registry.set('jason-idle',original);
 const scene={encounter:'midas',goldHits:4,textures:{exists:k=>registry.has(k),get:k=>registry.get(k),createCanvas(k,w,h){creates++;const t=makeTexture(w,h);t.width=w;t.height=h;registry.set(k,t);return t}},player:{texture:original,frame,originX:.4,originY:1,scaleX:1,scaleY:1,setScale(x,y){this.scaleX=x;this.scaleY=y;return this},setTexture(k){this.texture={key:k};return this},setOrigin(x,y){this.originX=x;this.originY=y;return this},clearTint(){cleared++}}};
 applyGoldCurse(scene);assert.equal(creates,1);assert.equal(scene.player.texture.key,'curse-jason-idle-idle-4');assert.equal(scene.player.originX,.4);assert.equal(scene.player.originY,1);
 const cached=registry.get(scene.player.texture.key);assert.equal(cached.width,40);assert.equal(cached.height,60);applyGoldCurse(scene);assert.equal(creates,1);
 scene.player.texture=original;applyGoldCurse(scene);assert.equal(creates,1);
 scene.player.texture=original;scene.goldHits=10;applyGoldCurse(scene);assert.equal(cleared,1);
 const gold=ensureGoldTexture(scene,'jason-idle');assert.equal(gold,'gilded-jason-idle');assert.equal(registry.get(gold).frames[0][0],'idle');assert.deepEqual(registry.get(gold).frames[0].slice(2),[20,30,40,60]);
 const count=creates;assert.equal(ensureGoldTexture(scene,'jason-idle'),gold);assert.equal(creates,count);
 scene.player.texture=original;scene.player.frame={...frame,name:'large',cutWidth:1029,cutHeight:1123};scene.player.scaleX=scene.player.scaleY=.25;applyGoldCurse(scene);
 const reduced=registry.get(scene.player.texture.key);assert.equal(reduced.height,384);assert.ok(Math.abs(reduced.width*scene.player.scaleX-1029*.25)<.00001);assert.ok(Math.abs(reduced.height*scene.player.scaleY-1123*.25)<.00001);assert.equal(scene.player.originY,1);
});
test('the crash leads through repair, the intact ascension, Hedge guarding and the two gold statues',()=>{
 assert.deepEqual(Array.from(midasArrival,b=>b.shot),['midas-crash','midas-repair','midas-hephaestus','midas-forge-words','midas-ascension','midas-enter','midas-friends-gold','midas-reveal']);
 const get=shot=>midasTableau(midasArrival.find(b=>b.shot===shot));
 assert.match(get('midas-crash'),/landing-explosion/);assert.match(get('midas-repair'),/midas-actor kneeling/);
 const asc=get('midas-ascension');assert.equal((asc.match(/festus-wreck/g)||[]).length,1);assert.match(asc,/<div class="forge-ascension"><div class="midas-actor hephaestus/);assert.match(asc,/festus-damaged-v1/);
 assert.match(get('midas-enter'),/midas-actor hedge/);assert.match(get('midas-enter'),/<walk>leo/);
 assert.ok(!get('midas-reveal').includes('midas-actor hedge'));assert.equal((get('midas-friends-gold').match(/-gold-blast" d=/g)||[]).length,2);
 assert.equal((get('midas-reveal').match(/is-gold/g)||[]).length,2);assert.ok(midasEnding.every(b=>b.kind==='action'&&b.speaker===''));
 const spoken=midasArrival.find(b=>b.voice);assert.equal(spoken.voice,'hephaestus-reuse');assert.equal(spoken.speaker,'Hephaestus');assert.match(spoken.text,/everything can be reused/);
 assert.ok(fs.statSync('public/assets/audio/hephaestus-reuse.mp3').size>10000);
});
test('every new artwork exists with measured isolated frames inside its actual PNG bounds',()=>{
 for(const file of MIDAS_ART)assert.ok(fs.statSync('public/assets/art/'+file+'.png').size>100000);
 for(const f of Object.values(midasFrames)){
  const bytes=fs.readFileSync('public/assets/art/'+f.file);assert.equal(bytes.readUInt32BE(16),f.size[0]);assert.equal(bytes.readUInt32BE(20),f.size[1]);
  for(const [x,y,w,h]of f.frames||[f.rect])assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=f.size[0]&&y+h<=f.size[1]);
 }
 for(const b of [...midasArrival,...midasEnding])assert.ok(!midasTableau(b).includes('undefined'));
});
test('Midas particle and projectile graphics stay finite in every attack and facing',()=>{
 const {drawMidasAtmosphere,drawMidasBolts}=mod('src/midas-vfx.ts');let calls=0;const g=new Proxy({}, {get:()=> (...args)=>{calls++;assert.ok(args.every(n=>Number.isFinite(n)))}});
 for(const x of [100,1100])for(const move of ['low','sweep','charge']){
  const s={x,ex:640,clock:5,reduced:false,enemyPhase:'tell',enemyMove:move,pendingResult:null,goldBolts:goldVolley(move,640,x)};drawMidasAtmosphere(g,g,s);drawMidasBolts(g,s);
 }
 assert.ok(calls>100);
});
