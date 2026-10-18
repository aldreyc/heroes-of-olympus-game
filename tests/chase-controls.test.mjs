import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as model from '../src/dragon-chase-model.mjs';
function setup(){
 let now=0,id=0,draws=0,completed=0;const frames=new Map(),sounds=[];
 class Node extends EventTarget {
  hidden=false;innerHTML='';value=0;classes=new Set();
  classList={toggle:(k,on)=>on?this.classes.add(k):this.classes.delete(k)};
  querySelector(selector){return get(selector)}focus(){}setPointerCapture(){}getContext(){return {}};
 }
 const nodes=new Map(),get=key=>{if(!nodes.has(key))nodes.set(key,new Node());return nodes.get(key)};
 const root=new Node(),window=new EventTarget(),document=new EventTarget();document.hidden=false;
 const context={exports:{},...model,window,document,AbortController,performance:{now:()=>now},requestAnimationFrame(fn){frames.set(++id,fn);return id},cancelAnimationFrame(id){frames.delete(id)},drawDragonChase(){draws++}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/dragon-chase.ts','utf8').replace(/^import .*;$/gm,''),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
 const session=context.exports.startDragonChase(root,{images:{},reduced:false,sound:k=>sounds.push(k),done:()=>completed++});
 const emit=(target,type,props={})=>{const e=new Event(type,{cancelable:true});Object.assign(e,props);target.dispatchEvent(e);};
 const tick=()=>{now+=1000/60;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));};
 return {session,sounds,get,window,document,frames,emit,tick,start(){emit(get('#chase-start'),'click')},key(key,type='keydown'){emit(window,type,{key,repeat:false})},run(seconds){for(let i=0;i<seconds*60;i++)tick()},draws:()=>draws,completed:()=>completed};
}
test('keyboard and touch control the chase, focus loss pauses, and disposal removes callbacks and input',()=>{
 const f=setup();f.run(.5);assert.equal(f.session.state().time,0);f.start();f.key(' ');f.run(.15);assert.ok(f.session.state().y<0);
 f.emit(f.get('#chase-duck'),'pointerdown',{pointerId:1});assert.equal(f.session.state().duck,true);
 f.emit(f.get('#chase-duck'),'pointerup');assert.equal(f.session.state().duck,false);
 f.emit(f.window,'blur');assert.equal(f.session.state().mode,'paused');const t=f.session.state().time;f.run(.5);assert.equal(f.session.state().time,t);
 f.session.togglePause();assert.equal(f.session.state().mode,'running');f.run(.1);assert.ok(f.session.state().time>t);
 f.session.dispose();const draws=f.draws();f.run(.2);f.key('s');assert.equal(f.draws(),draws);assert.equal(f.session.state().duck,false);assert.equal(f.frames.size,0);
});
test('getting caught offers a fresh retry with restored lead',()=>{
 const f=setup();f.start();f.run(27);assert.equal(f.session.state().mode,'lost');assert.equal(f.get('#chase-overlay').hidden,false);
 f.emit(f.get('#chase-retry'),'click');assert.equal(f.session.state().stumbles,0);assert.equal(f.session.state().mode,'running');assert.equal(f.get('#chase-overlay').hidden,true);f.session.dispose();
});
test('a full controlled run plays fire cues, reaches the vat, and completes exactly once',()=>{
 const f=setup();f.start();const jumped=new Set();
 for(let i=0;i<60*56;i++){
  const s=f.session.state(),a=model.currentWarning(s);f.key('s',a?.kind==='high'?'keydown':'keyup');
  if(a?.kind==='low'&&!jumped.has(a.id)&&s.time>=a.at-model.CHASE.warning+.2){f.key(' ');jumped.add(a.id)}
  f.tick();
 }
 assert.equal(f.session.state().mode,'won');assert.equal(f.session.state().stumbles,0);assert.equal(f.completed(),1);assert.equal(f.frames.size,0);
 assert.equal(f.sounds.filter(k=>k==='fire').length,12);assert.ok(f.sounds.includes('victory'));f.session.dispose();
});
