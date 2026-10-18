import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function mod(path,deps={}){const s={exports:{},...deps};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8').replace(/^import .*;$/gm,''),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,s);return s.exports;}
const {questBriefing,questJourney,medeaEnding,goldenDragonEnding,QUEST_ART}=mod('src/quest-story.ts');
const {questFrames}=mod('src/quest-frames.ts'),{storyFrames}=mod('src/story-frames.ts'),{spriteSvg}=mod('src/sprite-svg.ts');
const {storyWalkFrames}=mod('src/story-walk-frames.ts');const walk=mod('src/story-walk.ts',{storyWalkFrames,spriteSvg});
const {questTableau}=mod('src/quest-tableau.ts',{questFrames,storyFrames,spriteSvg,...walk});
test('Chiron selects the trio, Rachel recites, and the quest is revealed before departure',()=>{
 assert.deepEqual(Array.from(questBriefing,b=>b.shot),['quest-chiron','quest-rachel','quest-oracle','quest-revealed']);
 assert.match(questBriefing[0].text,/centaur/);assert.match(questBriefing[1].text,/Rachel Elizabeth Dare/);
 const oracle=questBriefing[2];assert.equal(oracle.kind,'prophecy');assert.equal(oracle.voice,'rachel-prophecy');assert.ok(oracle.duration>=14500);
 const normalize=s=>s.replace(/[’']/g,"'").replace(/\s+/g,' ').trim();
 assert.equal(normalize(oracle.text),normalize(JSON.parse(fs.readFileSync('public/assets/prophecy.json')).join(' ')));
 for(const beat of [...questBriefing,...questJourney,...medeaEnding,...goldenDragonEnding])if(beat!==oracle){assert.equal(beat.kind,'action');assert.equal(beat.speaker,'');}
 assert.ok(fs.statSync('public/assets/audio/rachel-prophecy.mp3').size>50000);
});
test('Festus carries all three toward the horizon, stays outside, and never appears in the mall interior',()=>{
 assert.deepEqual(Array.from(questJourney,b=>b.shot),['quest-takeoff','quest-horizon','mall-landing','mall-enter','mall-meet','mall-spell']);
 assert.match(questTableau(questJourney[0]),/festus-trio-flight-v1/);
 assert.ok(questJourney[1].duration>=12000);
 const enter=questTableau(questJourney[3]);assert.match(enter,/parked-festus/);
 for(const hero of ['jason','piper','leo'])assert.match(enter,new RegExp(`data-walk="${hero}"`));
 for(const b of [...questJourney,...medeaEnding,...goldenDragonEnding].filter(b=>['mall-meet','mall-spell','mall-victory','mall-hedge'].includes(b.shot))){const html=questTableau(b);assert.ok(!/festus/i.test(html));assert.match(html,/mall-inside/);}
 assert.match(goldenDragonEnding.at(-1).text,/find Hera/);
});
test('every new sprite and art path exists and lies within its own clipped viewport',()=>{
 for(const name of QUEST_ART)assert.ok(fs.statSync('public/assets/art/'+name+'.png').size>100000);
 for(const f of Object.values(questFrames)){
  const b=fs.readFileSync('public/assets/art/'+f.file),w=b.readUInt32BE(16),h=b.readUInt32BE(20);
  assert.equal(w,f.size[0]);assert.equal(h,f.size[1]);
  for(const [x,y,rw,rh]of(f.frames||[f.rect]))assert.ok(x>=0&&y>=0&&rw>0&&rh>0&&x+rw<=w&&y+rh<=h);
 }
 for(const b of [...questBriefing,...questJourney,...medeaEnding,...goldenDragonEnding]){
  const html=questTableau(b);assert.ok(!html.includes('undefined'));
  for(const m of html.matchAll(/(?:href|src)="(\/assets\/[^\"]+)"/g))assert.ok(fs.existsSync('public'+m[1]));
  for(const svg of html.matchAll(/<svg[\s\S]*?<\/svg>/g))if(svg[0].includes('<image '))assert.match(svg[0],/clip-path="url\(#/);
 }
});
test('walking into the mall uses a moving gait and stops at the entrance',()=>{
 for(const name of ['jason','piper','leo']){
  const p=walk.walkPaths['mall-enter'][name],frames=new Set();
  for(let t=0;t<9;t+=.1)frames.add(walk.sampleWalk(p,t).frame);
  assert.equal(frames.size,4);const end=walk.sampleWalk(p,10);assert.equal(end.walking,false);assert.equal(end.bottom,37);assert.equal(end.scale,.62);
 }
});
test('quest wing animation switches clipped frames and is disposed on story advance',()=>{
 let callback,handle=0,cancelled=0;const attrs={};const child=name=>({setAttribute:(k,v)=>attrs[name+'-'+k]=v});
 const svg={querySelector:s=>child(s)},root={querySelector:()=>svg};
 const {startQuestCinematic}=mod('src/quest-tableau.ts',{questFrames,requestAnimationFrame:fn=>{callback=fn;return ++handle},cancelAnimationFrame:id=>cancelled=id});
 const stop=startQuestCinematic(root,false);callback(0);const h=attrs['rect-height'];callback(170);assert.notEqual(attrs['rect-height'],h);
 stop();assert.equal(cancelled,handle);const previous=handle;callback(340);assert.equal(handle,previous);
 const reduced=startQuestCinematic(root,true);reduced();assert.equal(handle,previous);
});
test('Medea effects draw finite potion, crystal and charm geometry in both motion settings',()=>{
 const vfx=mod('src/medea-vfx.ts');let calls=0;
 const g=new Proxy({}, {get:()=> (...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n));calls++;return g}});
 for(const reduced of [true,false])for(const enemyPhase of ['wait','tell','attack'])for(const enemyMove of ['low','sweep','charge'])for(let time=0;time<2;time+=.2){
  const s={clock:time,x:300,y:590,ex:900,enemyPhase,enemyMove,enemyTimer:.6-time*.25,charm:75,rallyFlash:.4,pendingResult:null,reduced};
  vfx.drawMedeaAtmosphere(g,g,s);vfx.drawMedeaSpell(g,s);
 }
 assert.ok(calls>1000);
});

test('one smaller mechanical gold dragon blocks the rescue; Festus enters, burns it, then Hedge is freed',()=>{
 assert.deepEqual(Array.from(medeaEnding,b=>b.shot),['mall-victory','mall-golden-dragon']);
 assert.match(medeaEnding[1].text,/mechanical/);assert.match(medeaEnding[1].text,/Smaller than Festus/);assert.match(medeaEnding[1].text,/pure golden armor/);
 assert.deepEqual(Array.from(goldenDragonEnding,b=>b.shot),['mall-festus-window','mall-festus-fire','mall-dragon-fallen','mall-hedge','mall-regroup']);
 for(const beat of [medeaEnding[1],...goldenDragonEnding.slice(0,3)]){
  const html=questTableau(beat);assert.equal((html.match(/class="golden-guardian/g)||[]).length,1);assert.match(html,/golden-dragon-v2/);
 }
 const window=questTableau(goldenDragonEnding[0]),fire=questTableau(goldenDragonEnding[1]);
 assert.match(window,/rescue-window/);assert.match(window,/festus-window-v1/);assert.match(window,/window-shards/);
 assert.match(fire,/fire-core/);assert.match(fire,/rescue-embers/);
 assert.ok(!questTableau(goldenDragonEnding[3]).includes('golden-guardian'));
});

test('golden automaton fire, claws, charge and floor warnings draw finite geometry',()=>{
 const fx=mod('src/golden-dragon-vfx.ts');let calls=0;
 const g=new Proxy({}, {get:()=> (...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n));calls++;return g}});
 for(const reduced of [true,false])for(const x of [300,1100])for(const enemyPhase of ['wait','tell','attack'])for(const enemyMove of ['low','sweep','charge'])for(const enemyTimer of [.55,.3,0]){
  const s={clock:2.5,x,ex:900,enemyPhase,enemyMove,enemyTimer,pendingResult:null,reduced};fx.drawGoldenAtmosphere(g,g,s);fx.drawGoldenAttack(g,s);
 }
 assert.ok(calls>5000);
});
