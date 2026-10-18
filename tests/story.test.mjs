import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function module(path, imports = {}) {
 const scope={exports:{},...imports};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8').replace(/^import .*;$/gm,''),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,scope);
 return scope.exports;
}
const {opening,ending}=module('src/story.ts');
const {storyFrames}=module('src/story-frames.ts');
const {storyProps}=module('src/story-props.ts');
const {storyWalkFrames}=module('src/story-walk-frames.ts');
const {spriteSvg}=module('src/sprite-svg.ts');
const {chaseFrames}=module('src/chase-frames.ts');
const {dragonSequence}=module('src/dragon-cinematic.ts',{chaseFrames});
const walk=module('src/story-walk.ts',{storyWalkFrames,spriteSvg});
const {campArrival,CAMP_ART,dragonReturn}=module('src/camp-story.ts');
const {storyTableau}=module('src/story-tableau.ts',{storyFrames,storyProps,spriteSvg,dragonSequence,...walk});
test('requested scene order ends one fight with rescue, cloud departure and Annabeth/Butch extraction',()=>{
 assert.deepEqual(Array.from(ending,b=>b.shot),['piper-fall','jason-dive','leo-ledge','hedge-rescue','flight','reunion','seized','seized','departure','chariot-arrival','annabeth','annabeth','chariot-leave']);
 assert.ok(opening.some(b=>b.shot==='passes'));assert.ok(opening.some(b=>b.shot==='transform'));
 assert.ok(ending.find(b=>b.shot==='departure').duration>=8000);
});
test('only brief sourced quotes and the requested reactions appear as character speech',()=>{
 const beats=[...opening,...ending,...campArrival,...dragonReturn],quotes=beats.filter(b=>b.kind==='quote');
 assert.equal(quotes.length,5);assert.equal(quotes.map(b=>b.text).join(' ').split(/\s+/).length,18);
 for(const b of beats){
   assert.ok(b.text.length);assert.ok(b.duration===undefined||Number.isFinite(b.duration)&&b.duration>0);
   if(b.kind==='action')assert.equal(b.speaker,'');else assert.ok(['quote','reaction'].includes(b.kind));
   assert.equal(b.voice,undefined);
 }
 assert.equal(beats.filter(b=>b.kind==='reaction').length,2);
});
test('each cinematic shot renders isolated actors and all referenced files and viewports exist',()=>{
 for(const b of [...opening,...ending,...campArrival,...dragonReturn])if(b.shot){
   const html=storyTableau(b);assert.ok(html.includes(`story-shot ${b.shot} `));assert.ok(!html.includes('undefined'));
   for(const match of html.matchAll(/(?:href|src)="(\/assets\/[^\"]+)"/g))assert.ok(fs.existsSync('public'+match[1]),match[1]);
 }
 for(const f of [...Object.values(storyFrames),...Object.values(storyProps)]){
   const png=fs.readFileSync('public/assets/art/'+f.file),w=png.readUInt32BE(16),h=png.readUInt32BE(20);
   const [x,y,rw,rh]=f.rect;assert.equal(w,f.size[0]);assert.equal(h,f.size[1]);
   assert.ok(x>=0&&y>=0&&rw>0&&rh>0&&x+rw<=w&&y+rh<=h);
 }
});
test('the dragon calms with Tabasco and motor oil, then Leo mounts and flies back to camp',()=>{
 assert.deepEqual(Array.from(dragonReturn,b=>b.shot),['dragon-calm','dragon-mount','dragon-takeoff','camp-dragon-return']);
 assert.match(dragonReturn[0].text,/Tabasco and motor oil/);assert.ok(!dragonReturn.some(b=>/vanilla/i.test(b.text)));
 for(const [i,file]of ['festus-calm-v1','festus-mount-v1','festus-flight-v1','festus-flight-v1'].entries()){
  const html=storyTableau(dragonReturn[i]);assert.ok(html.includes(file+'.png'));assert.ok(html.includes('clip-path='));
  assert.ok(!html.includes('festus-discovery-v1.png'),'the discovery dragon must not be duplicated behind the new pose');
 }
});
test('camp arrival claims all three, guides each to a cabin, and ends at the dragon discovery',()=>{
 assert.deepEqual(Array.from(campArrival,b=>b.shot),['camp-touchdown','camp-claiming','camp-tour','camp-jason-cabin','camp-piper-cabin','camp-leo-cabin','forest-walk','forest-listen','dragon-approach','dragon-discovery']);
 assert.ok(campArrival.every(b=>b.kind==='action'&&b.speaker===''&&b.chapter==='CAMP HALF-BLOOD'));
 const claim=storyTableau(campArrival[1]);
 for(const name of ['jason','piper','leo'])assert.ok(claim.includes('claim-'+name));
 for(const god of ['JUPITER','APHRODITE','HEPHAESTUS'])assert.ok(claim.includes(god));
 for(const hero of ['jason','piper','leo']){
  const tour=campArrival.find(b=>b.shot===`camp-${hero}-cabin`),html=storyTableau(tour);
  assert.ok(html.includes(`data-walk="${hero}"`)&&html.includes('data-walk="drew"'));
 }
 for(const name of CAMP_ART)assert.ok(fs.statSync('public/assets/art/'+name+'.png').size>100000);
 assert.match(storyTableau(campArrival.at(-1)),/festus-discovery-v1\.png/);
});
test('rescue and extraction use dedicated contact poses rather than disconnected standing figures',()=>{
 const html=shot=>storyTableau(ending.find(b=>b.shot===shot));
 assert.match(html('leo-ledge'),/story-ledge-v2\.png/);
 assert.match(html('hedge-rescue'),/story-cliff-rescue-v2\.png/);
 assert.match(html('flight'),/story-flight-embrace-v2\.png/);
 assert.ok(!html('flight').includes('story-actor jason'));
 for(const [shot,pose]of [['chariot-arrival','arrival'],['annabeth','landed'],['chariot-leave','departure']])assert.ok(html(shot).includes(`story-chariot-${pose}-v2.png`));
 assert.ok(ending.find(b=>b.shot==='chariot-leave').duration>=14000);
});
test('Leo bus beat focuses on Jason remembering their friendship',()=>{
 const bus=opening.filter(b=>b.scene==='bus'),text=bus.map(b=>b.text).join(' ');
 assert.ok(!/special boy|megaphone|microphone/i.test(text));
 assert.ok(bus.some(b=>/Leo asks whether Jason remembers him and their friendship/.test(b.text)));
});
test('Hedge warns about the weather before shelter and Dylan transforms afterward',()=>{
 const warning=opening.findIndex(b=>b.speaker==='Coach Hedge'&&b.text==="I don't like this weather.");
 const shelter=opening.findIndex(b=>b.title==='Toward shelter');
 const passing=opening.findIndex(b=>b.shot==='passes');
 const transformation=opening.findIndex(b=>b.shot==='transform');
 assert.ok(warning>=0&&warning<shelter&&shelter<passing&&passing<transformation);
 assert.equal(opening[warning].kind,'reaction');
 assert.equal(opening[shelter].kind,'action');
});
