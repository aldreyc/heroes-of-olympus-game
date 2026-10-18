import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function mod(path,deps={}){const s={exports:{},...deps};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8').replace(/^import .*;$/gm,''),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,s);return s.exports;}
const {mansionPartyFrames:party,MANSION_ART}=mod('src/mansion-frames.ts');const {mansionJourney}=mod('src/quest-story.ts');
const {sampleMansionFlight,mansionFlightTableau,BLUE_STRIKE_TIME}=mod('src/mansion-flight.ts',{party});
test('Hedge remains with all three heroes through relief, the blue strike and the mansion approach',()=>{
 assert.deepEqual(Array.from(mansionJourney,b=>b.shot),['mansion-departure','mansion-relief','mansion-blue-strike','mansion-descent','mansion-reveal']);
 assert.match(mansionJourney[0].text,/Coach Hedge/);assert.match(mansionJourney[1].text,/four travelers/);assert.match(mansionJourney[2].text,/blue beam/);assert.match(mansionJourney[4].text,/mansion/);
 assert.ok(!mansionJourney.some(b=>/palace/i.test(b.text)));assert.ok(mansionJourney.every(b=>b.kind==='action'&&b.speaker===''&&b.duration>7000));
});
test('the wing strike switches to the damaged pose once; healthy flight cannot resume during descent',()=>{
 const shot='mansion-blue-strike';assert.ok(sampleMansionFlight(shot,BLUE_STRIKE_TIME-.01).frame!==3);
 const hit=sampleMansionFlight(shot,BLUE_STRIKE_TIME);assert.equal(hit.frame,3);assert.equal(hit.beam,1);assert.equal(hit.smoke,1);assert.equal(hit.impact,1);
 const after=sampleMansionFlight(shot,BLUE_STRIKE_TIME+2);assert.equal(after.frame,3);assert.equal(after.beam,0);assert.equal(after.smoke,1);assert.equal(after.impact,0);assert.ok(after.angle>0);
 for(const name of ['mansion-descent','mansion-reveal'])for(let t=0;t<9;t+=.1)assert.equal(sampleMansionFlight(name,t).frame,3);
 const start=sampleMansionFlight('mansion-descent',0),end=sampleMansionFlight('mansion-descent',8);assert.ok(end.top>start.top);assert.ok(end.left>start.left);assert.ok(end.scale<start.scale);
});
test('reduced motion avoids the sudden beam flash, falling camera motion and wing loop',()=>{
 for(const b of mansionJourney){
  const first=sampleMansionFlight(b.shot,0,true),last=sampleMansionFlight(b.shot,7,true);
  assert.equal(first.left,last.left);assert.equal(first.top,last.top);assert.equal(first.frame,last.frame);assert.equal(first.angle,0);assert.equal(first.impact,0);
 }
 assert.equal(sampleMansionFlight('mansion-blue-strike',0,true).beam,.5);
});
test('the actual new sheet, normalized clips, and all three backgrounds exist',()=>{
 for(const file of MANSION_ART)assert.ok(fs.statSync('public/assets/art/'+file+'.png').size>100000);
 const b=fs.readFileSync('public/assets/art/'+party.file);assert.equal(b.readUInt32BE(16),party.size[0]);assert.equal(b.readUInt32BE(20),party.size[1]);
 for(const [i,[x,y,w,h]]of party.frames.entries()){
  const s=party.scales[i],o=party.offsets[i];assert.ok(x>=0&&y>=0&&x+w<=party.size[0]&&y+h<=party.size[1]);assert.ok(o[0]+w*s<=party.logical[0]&&o[1]+h*s<=party.logical[1]);
 }
 for(const beat of mansionJourney){const html=mansionFlightTableau(beat);assert.ok(!html.includes('undefined'));assert.equal((html.match(/data-mansion-party/g)||[]).length,1);assert.ok(html.includes('clip-path="url(#'));assert.ok(html.includes('festus-escape-party-v1.png'));}
});
test('flight controller swaps source scales, shows the synchronized beam, and stops after disposal',()=>{
 const attrs={},children=new Map();let callback,handle=0,cancelled=0;
 const child=key=>{if(!children.has(key))children.set(key,{setAttribute:(k,v)=>attrs[key+'-'+k]=v});return children.get(key)};
 const dragon={style:{},querySelector:key=>child(key)},root={querySelector:key=>key==='[data-mansion-party]'?dragon:child(key)};
 const {startMansionFlight}=mod('src/mansion-flight.ts',{party,requestAnimationFrame:fn=>{callback=fn;return ++handle},cancelAnimationFrame:id=>cancelled=id});
 const stop=startMansionFlight(root,'mansion-blue-strike',false);callback(0);callback(2500);
 assert.equal(attrs['[data-blue-beam]-opacity'],'1');assert.equal(attrs['[data-wing-smoke]-opacity'],'1');assert.equal(attrs['image-width'],String(1536*party.scales[3]));
 const at=handle;stop();assert.equal(cancelled,at);callback(3000);assert.equal(handle,at);
 startMansionFlight(root,'mansion-blue-strike',true)();assert.equal(handle,at);assert.equal(attrs['[data-blue-beam]-opacity'],'0.5');
});
