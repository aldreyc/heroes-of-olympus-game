import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path,deps={}){const s={exports:{},...deps};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8').replace(/^import .*;$/gm,''),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,s);return s.exports;}
const {chaseFrames}=load('src/chase-frames.ts');
function setup(which,shot,reduced=false){
 const pending=new Map();let id=0;const attrs={},crop={};
 const element={dataset:{sequence:which},querySelector(k){return {setAttribute(name,value){(k==='rect'?crop:attrs)[name]=value}}}};
 const api=load('src/dragon-cinematic.ts',{chaseFrames,requestAnimationFrame(fn){pending.set(++id,fn);return id},cancelAnimationFrame(k){pending.delete(k)}});
 const stop=api.startDragonCinematic({querySelectorAll(){return [element]}},shot,reduced);
 return {attrs,crop,pending,stop,advance(now){const callbacks=[...pending.values()];pending.clear();callbacks.forEach(fn=>fn(now));}};
}
test('Leo climbs through four contact poses without changing source scale or exposing neighboring cells',()=>{
 const f=setup('mount','dragon-mount');f.advance(0);
 for(const [time,index]of [[0,0],[1500,1],[3000,2],[4500,3]]){
  f.advance(time);const a=chaseFrames.mount,r=a.frames[index],o=a.offsets[index];
  assert.equal(f.attrs.x,String(o[0]-r[0]));assert.equal(f.attrs.y,String(o[1]-r[1]));
  assert.equal(f.crop.width,String(r[2]));assert.equal(f.crop.height,String(r[3]));
 }
 f.stop();const before={...f.attrs};f.advance(9000);assert.deepEqual(f.attrs,before);assert.equal(f.pending.size,0);
});
test('the return beats wings, lands at camp and switches to the grounded folded-wing pose',()=>{
 const f=setup('flight','camp-dragon-return');f.advance(0);f.advance(250);
 assert.equal(f.attrs.href,'/assets/art/festus-flight-v1.png');
 f.advance(6500);assert.equal(f.attrs.href,'/assets/art/festus-mount-v1.png');
 const a=chaseFrames.mount;assert.equal(f.attrs.x,String(a.offsets[3][0]-a.frames[3][0]));f.stop();
});
test('reduced motion uses stable seated/landed poses without scheduling animation frames',()=>{
 const f=setup('flight','camp-dragon-return',true);assert.equal(f.pending.size,0);assert.equal(f.attrs.href,'/assets/art/festus-mount-v1.png');f.stop();
});
