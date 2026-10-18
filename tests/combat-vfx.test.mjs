import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const context = {exports:{}, Math};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/combat-vfx.ts','utf8'), {
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
}).outputText,context);
const {drawStorm,drawSpirit,drawMove,drawGust} = context.exports;
const base={clock:3,x:300,y:590,ex:900,facing:1,heroIndex:0,move:'',moveTime:0,connected:false,enemyPhase:'wait',enemyMove:'low',enemyTimer:.85,enemyHealth:160,storm:1,enemyRecoil:0,guardFlash:0,guarding:false,reduced:false,finishTimer:0,pendingResult:null};
function recorder() {
  const calls=[];
  const g=new Proxy({}, {get:(_,name)=>(...args)=>{
    for(const value of args) assert.ok(Number.isFinite(value),`${String(name)} received ${value}`);
    if(name==='lineStyle') assert.ok(args[0]>0);
    if(name==='fillStyle') assert.ok(args[1]>=0 && args[1]<=1);
    calls.push([name,...args]);
  }});
  return {g,calls};
}
test('all hero moves and wind phases generate finite, bounded drawing commands',()=>{
 for(const heroIndex of [0,1,2]) for(const facing of [-1,1]) for(const reduced of [false,true]) {
  for(const enemyPhase of ['wait','tell','attack','recover','stunned']) for(const enemyMove of ['low','sweep','charge']) {
   const r=recorder(); const s={...base,heroIndex,facing,reduced,enemyPhase,enemyMove,storm:1.8};
   drawStorm(r.g,r.g,s); drawSpirit(r.g,s); drawGust(r.g,s);
   for(const move of ['quick','strong','special']) for(const moveTime of [0,.12,.2,.4,.6]) drawMove(r.g,{...s,move,moveTime},.18,.28);
   assert.ok(r.calls.length<2500,`drawing budget ${r.calls.length}`);
  }
 }
});
test('reduced motion reduces airborne debris without hiding attack warnings',()=>{
 const full=recorder(), reduced=recorder();
 drawStorm(full.g,full.g,{...base,enemyPhase:'tell'});
 drawStorm(reduced.g,reduced.g,{...base,enemyPhase:'tell',reduced:true});
 assert.ok(reduced.calls.length<full.calls.length);
 assert.ok(reduced.calls.some(c=>c[0]==='fillRect' && c[2]===581));
});
test('storm dispersion remains valid through its last frame',()=>{
 for(const finishTimer of [.72,.36,0,-.02]) {
  const r=recorder(); drawSpirit(r.g,{...base,pendingResult:true,finishTimer});
  assert.ok(r.calls.length>0);
 }
});
