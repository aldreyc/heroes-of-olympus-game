import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path, dependencies={}) {
 const scope={exports:{},...dependencies};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8').replace(/^import .*;$/gm,''),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,scope);
 return scope.exports;
}
const {storyWalkFrames}=load('src/story-walk-frames.ts');
const {spriteSvg}=load('src/sprite-svg.ts');
const {sampleWalk,walkPaths,startStoryMotion,walkingActor}=load('src/story-walk.ts',{storyWalkFrames,spriteSvg});
test('each walker has four separate frames at a constant scale inside the transparent sheet',()=>{
 const png=fs.readFileSync('public/assets/art/camp-walk-v1.png'),w=png.readUInt32BE(16),h=png.readUInt32BE(20);
 for(const a of Object.values(storyWalkFrames)) {
  assert.equal(a.size[0],w);assert.equal(a.size[1],h);assert.equal(a.frames.length,4);
  assert.equal(new Set(a.frames.map(f=>f.join(','))).size,4);
  for(const [i,[x,y,rw,rh]]of a.frames.entries()) {
   assert.ok(x>=0&&y>=0&&x+rw<=w&&y+rh<=h);
   assert.equal(rw,a.frames[0][2]);assert.equal(rh,a.frames[0][3]);
   if(i)assert.ok(x>a.frames[i-1][0]+rw,'neighboring poses never leak into a frame');
  }
 }
});
test('Leo takes all four gait phases while travelling and stops his gait at the destination',()=>{
 const path=walkPaths['forest-walk'].leo,phases=new Set();
 let last=path.from;
 for(let t=0;t<path.seconds;t+=.05){
  const s=sampleWalk(path,t);phases.add(s.frame);assert.ok(s.left>=last);last=s.left;
  assert.equal(s.bottom,24);assert.equal(s.scale,1);
 }
 assert.equal(phases.size,4);
 const done=sampleWalk(path,100);assert.equal(done.left,path.to);assert.equal(done.walking,false);
 assert.equal(sampleWalk(path,101).frame,done.frame);
 const waiting=sampleWalk(walkPaths['dragon-approach'].leo,.5);assert.equal(waiting.walking,false);assert.equal(waiting.progress,0);
});
test('reduced motion shows the destination with a stable grounded pose',()=>{
 for(const shot of Object.values(walkPaths))for(const path of Object.values(shot)){
  const s=sampleWalk(path,0,true);assert.equal(s.left,path.to);assert.equal(s.walking,false);
  assert.equal(s.bottom,path.endBottom??24);assert.equal(s.scale,path.endScale??1);
 }
});
test('skipping a scene cancels walking frames and footstep sounds',()=>{
 let callback,cancelled=0,steps=0,updates=0;
 const el={dataset:{walk:'leo'},style:{},classList:{toggle(){}},querySelector(){return {setAttribute(){updates++}}}};
 const options={reduced:false,step(){steps++},request(fn){callback=fn;return 17},cancel(id){cancelled=id}};
 const stop=startStoryMotion({querySelectorAll(){return [el]}},'forest-walk',options);
 callback(0);callback(1000);assert.ok(steps>0&&updates>1);
 stop();assert.equal(cancelled,17);const before=[steps,updates];callback(1500);assert.deepEqual([steps,updates],before);
 let requested=false;
 startStoryMotion({querySelectorAll(){return [el]}},'forest-walk',{...options,reduced:true,request(){requested=true}});
 assert.equal(requested,false);assert.equal(el.style.left,'49%');
});
test('changing gait moves the source sheet inside a fixed crop, without widening the visible frame',()=>{
 const html=walkingActor('leo'),[,,w,h]=storyWalkFrames.leo.frames[0];
 assert.ok(html.includes(`<rect width="${w}" height="${h}"/>`));
 let callback;const attrs={};
 const image={setAttribute(key,value){attrs[key]=value}};
 const el={dataset:{walk:'leo'},style:{},classList:{toggle(){}},querySelector(selector){assert.equal(selector,'image');return image}};
 const stop=startStoryMotion({querySelectorAll(){return [el]}},'forest-walk',{reduced:false,request(fn){callback=fn;return 1},cancel(){}});
 callback(0);
 for(const t of [500,1000,1500,2000]){
  callback(t);const f=storyWalkFrames.leo.frames[sampleWalk(walkPaths['forest-walk'].leo,t/1000).frame];
  assert.equal(attrs.x,String(-f[0]));assert.equal(attrs.y,String(-f[1]));
 }
 stop();
});
