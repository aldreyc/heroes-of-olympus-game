import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as model from '../src/dragon-chase-model.mjs';
function load(path,deps={}){const s={exports:{},...deps};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8').replace(/^import .*;$/gm,''),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,s);return s.exports;}
const {chaseFrames}=load('src/chase-frames.ts');
const {drawDragonChase}=load('src/dragon-chase-renderer.ts',{...model,chaseFrames});
test('all new animation frames fit their sheets and preserve logical scale and ground offsets',()=>{
 for(const [key,a]of Object.entries(chaseFrames)){
  const png=fs.readFileSync('public/assets/art/'+a.file);assert.equal(png.readUInt32BE(16),a.size[0]);assert.equal(png.readUInt32BE(20),a.size[1]);
  assert.equal(a.frames.length,key==='leo'?8:key==='calm'?1:4);assert.equal(a.offsets.length,a.frames.length);
  for(const [i,[x,y,w,h]]of a.frames.entries()){
   assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=a.size[0]&&y+h<=a.size[1]);
   assert.ok(a.offsets[i][0]>=0&&a.offsets[i][1]>=0);
   assert.ok(a.offsets[i][0]+w<=a.logical[0]&&a.offsets[i][1]+h<=a.logical[1]);
   assert.equal(a.offsets[i][1]+h,a.logical[1],'all poses share their sole/foot baseline');
  }
 }
 const leo=chaseFrames.leo;assert.ok(leo.frames[4][3]<leo.frames[7][3]*.6);assert.ok(leo.frames[5][3]<leo.frames[7][3]*.6);
 const mask=chaseFrames.dragon.masks[3];
 const contains=(x,y)=>{let inside=false;for(let i=0,j=mask.length-1;i<mask.length;j=i++){const a=mask[i],b=mask[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside};
 assert.equal(contains(6,308),false,'the neighboring pose claw fragment stays outside the mask');assert.equal(contains(20,308),true);
});
test('fire, gait, jump, duck, pause and vat frames keep bounded finite drawing commands',()=>{
 const images=Object.fromEntries(['camp-woods-v2.png','chase-trees-v1.png',...Object.values(chaseFrames).map(a=>a.file)].map(f=>[f,{}]));
 for(const reduced of [false,true])for(const t of [0,4,4.6,4.9,5.1,8.4,8.7,22,48,51.8,52])for(const y of [0,-120]){
  let calls=0;const ctx=new Proxy({}, {set(_o,_k,v){if(typeof v==='number')assert.ok(Number.isFinite(v));return true},get(_o,k){return (...args)=>{calls++;for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),String(k));if(String(k).startsWith('create'))return {addColorStop(){}};}}});
  const s=model.createChase();s.time=t;s.y=y;s.duck=true;for(const a of s.attacks){a.fired=t>=a.at;a.resolved=t>a.at+.6;}
  drawDragonChase(ctx,s,images,reduced);assert.ok(calls<750,'effects must have a fixed per-frame budget');
 }
});
