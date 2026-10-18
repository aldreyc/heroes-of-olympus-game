import test from 'node:test';
import assert from 'node:assert/strict';
import { CHASE, createChase, startChase, stepChase, pauseChase, resumeChase, setChaseDuck, queueChaseJump, currentWarning, drainChaseEvents } from '../src/dragon-chase-model.mjs';
function advance(s,until){while(s.time+1e-8<until&&s.mode==='running')stepChase(s,1/60);}
test('chase only advances after Start, freezes on pause, and clears held controls',()=>{
 const s=createChase();stepChase(s,1/60);assert.equal(s.time,0);startChase(s);setChaseDuck(s,true);queueChaseJump(s);pauseChase(s);
 const frozen=JSON.stringify(s);stepChase(s,.03);assert.equal(JSON.stringify(s),frozen);assert.equal(s.duck,false);assert.equal(s.jumpQueued,false);
 resumeChase(s);stepChase(s,1/60);assert.ok(s.time>0);assert.equal(s.y,0);
});
test('jump clears low fire and returns to the ground, but ducking low fire loses a step',()=>{
 for(const jumping of [false,true]){
  const s=createChase();startChase(s);advance(s,4.05);
  if(jumping)queueChaseJump(s);else setChaseDuck(s,true);
  advance(s,5.1);assert.equal(s.stumbles,jumping?0:1);assert.equal(s.dodged,jumping?1:0);
  advance(s,5.6);assert.equal(s.y,0);assert.equal(s.vy,0);
 }
});
test('grounded duck clears high fire while standing or jumping does not',()=>{
 for(const input of ['duck','stand','jump']){
  const s=createChase();s.attacks=s.attacks.filter(a=>a.kind==='high');startChase(s);advance(s,7.75);
  if(input==='duck')setChaseDuck(s,true);if(input==='jump')queueChaseJump(s);
  advance(s,8.9);assert.equal(s.stumbles,input==='duck'?0:1);assert.equal(s.dodged,input==='duck'?1:0);
 }
});
test('each attack warns before firing, resolves once, and cannot cause repeated hits',()=>{
 const s=createChase();startChase(s);advance(s,4.1);assert.equal(currentWarning(s).kind,'low');assert.equal(s.attacks[0].fired,false);
 advance(s,5.6);assert.equal(s.stumbles,1);advance(s,6.6);assert.equal(s.stumbles,1);
 assert.equal(drainChaseEvents(s).filter(x=>x==='stumble').length,1);assert.equal(drainChaseEvents(s).length,0);
});
for(const reaction of [0,.2,.65])test(`a player reacting ${reaction*1000}ms after each warning can clear every attack and reach the vat`,()=>{
 const s=createChase();startChase(s);const jumped=new Set();
 while(s.mode==='running'){
  const a=currentWarning(s);
  setChaseDuck(s,a?.kind==='high');
  if(a?.kind==='low'&&!jumped.has(a.id)&&s.time>=a.at-CHASE.warning+reaction){queueChaseJump(s);jumped.add(a.id);}
  stepChase(s,1/60);drainChaseEvents(s);
 }
 assert.equal(s.mode,'won');assert.equal(s.time,CHASE.duration);assert.equal(s.stumbles,0);assert.equal(s.dodged,12);
});
test('mistakes allow recovery before Festus catches up; terminal states cannot keep advancing',()=>{
 const s=createChase();startChase(s);while(s.mode==='running')stepChase(s,1/60);
 assert.equal(s.mode,'lost');assert.equal(s.stumbles,CHASE.maxStumbles);assert.ok(s.time>20);
 const end=JSON.stringify(s);queueChaseJump(s);stepChase(s,1/30);assert.equal(JSON.stringify(s),end);
 const fresh=createChase();assert.equal(fresh.stumbles,0);assert.ok(fresh.attacks.every(a=>!a.fired&&!a.resolved));
});
