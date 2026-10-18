import '../scripts/three-node-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
const { createFighter, poseFighter } = await import('../src/three/fighters.ts');
const { createWorld, animateWorld } = await import('../src/three/world.ts');
const { createStorm } = await import('../src/three/storm.ts');
const { createEffects } = await import('../src/three/effects.ts');
const { Olympus3D } = await import('../src/three/view.ts');
const { disposeTree } = await import('../src/three/geometry.ts');
const { worldX, worldY } = await import('../src/three/types.ts');
function state(overrides={}) {
  return { mode:'battle', heroIndex:0, clock:4, x:300,y:590,ex:950,facing:1,move:'',moveTime:0,health:100,enemyHealth:160,enemyPhase:'wait',enemyMove:'low',enemyTimer:2,enemyRecoil:0,guardFlash:0,guarding:false,hurt:0,storm:1,reduced:false,freeze:0,pendingResult:null,finishTimer:0,reveal:false,keys:new Set(),player:{visible:true},enemy:{visible:true},label:{text:''},warning:{text:''},particles:[],impacts:[],callouts:[], ...overrides };
}
function finite(root) {
  root.updateMatrixWorld(true);
  root.traverse(o=>{
    assert.ok(o.matrixWorld.elements.every(Number.isFinite),o.name+' matrix');
    if(o.isMesh || o.isPoints || o.isLine) {
      for(const attr of Object.values(o.geometry.attributes)) assert.ok(Array.from(attr.array).every(Number.isFinite),'geometry');
      if(o.isInstancedMesh) assert.ok(Array.from(o.instanceMatrix.array).every(Number.isFinite),'instances');
    }
  });
}
test('all original 3D fighters have one weapon attached to one hand, including Jason',()=>{
  for(let id=0;id<4;id++) {
    const f=createFighter(id), weapons=[]; f.root.traverse(o=>{if(o.userData.weapon)weapons.push(o);});
    assert.deepEqual(weapons,[f.weapon]); assert.equal(f.weapon.parent,f.elbows[1]);
    const bounds=new T.Box3().setFromObject(f.root), size=bounds.getSize(new T.Vector3());
    assert.ok(size.y>3 && size.y<4.1); assert.ok(bounds.min.y>-.15);
    let calls=0;f.root.traverse(o=>{if(o.isMesh)calls++;});assert.ok(calls<50);
    finite(f.root);disposeTree(f.root);
  }
});
test('weapon, jump, guard and attack poses remain finite in both directions for all heroes',()=>{
  for(let id=0;id<3;id++) {
    const f=createFighter(id);
    for(const facing of [-1,1]) for(const move of ['', 'quick','strong','special']) for(let frame=0;frame<65;frame++) {
      const s=state({heroIndex:id,facing,move,moveTime:frame/60,clock:frame/60, y:frame%3===0?450:590, guarding:frame%4===0, hurt:frame%7===0?.2:0, keys:new Set(['d'])});
      poseFighter(f,s.clock,s);
      f.root.updateMatrixWorld(true);f.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));
    }
    disposeTree(f.root);
  }
});
test('museum and bus are genuinely modeled sets; animated banners survive rigid batching',()=>{
  const w=createWorld();
  assert.equal(w.banners.length,2);assert.ok(w.banners.every(b=>b.parent===w.museum));
  const before=w.banners[0].geometry.attributes.position.getZ(20);
  animateWorld(w,2,1.8,false);
  assert.notEqual(before,w.banners[0].geometry.attributes.position.getZ(20));
  for(const set of [w.museum,w.bus]) {
    const bounds=new T.Box3().setFromObject(set);assert.ok(bounds.max.y>3);assert.ok(bounds.max.x-bounds.min.x>5);
  }
  finite(w.root);disposeTree(w.root);
});
test('storm and effects handle every attack, reduced motion and complete dispersion without allocation growth',()=>{
  const storm=createStorm(), fx=createEffects();
  const children=fx.root.children.length;
  for(const reduced of [true,false]) for(const id of [0,1,2]) for(const facing of [-1,1]) for(const phase of ['wait','tell','attack','recover','stunned']) for(const move of ['quick','strong','special']) {
    const s=state({heroIndex:id,facing,reduced,enemyPhase:phase,enemyMove:move==='quick'?'low':move==='strong'?'sweep':'charge',move,moveTime:.26,enemyRecoil:.2,guarding:true,particles:[{x:400,y:440,life:.4,max:.7,color:0xffd177,size:3}],impacts:[{x:450,y:400,life:.2,power:2,color:0xffd177}]});
    storm.update(3,s,reduced);fx.update(s);finite(storm.root);finite(fx.root);
  }
  for(const finishTimer of [.72,.36,0,-.016]) {const s=state({pendingResult:true,finishTimer});storm.update(4,s);fx.update(s);finite(storm.root);finite(fx.root);}
  assert.equal(fx.root.children.length,children);disposeTree(storm.root);disposeTree(fx.root);
});
function fakeElement(){return {textContent:'',style:{},hidden:false};}
function viewHarness() {
  globalThis.document={hidden:false};
  const v=Object.create(Olympus3D.prototype);
  Object.assign(v,{active:true,disposed:false,stage:'title',hero:0,time:0,stageTime:0,snapCamera:true,width:1280,height:720,autoQuality:false,quality:'cinematic',world:createWorld(),fighters:[0,1,2,3].map(createFighter),storm:createStorm(),effects:createEffects(),coin:new T.Mesh(new T.SphereGeometry(.1),new T.MeshBasicMaterial()),camera:new T.PerspectiveCamera(42,16/9,.1,240),cameraTarget:new T.Vector3(),lookTarget:new T.Vector3(0,1.7,0),desiredLook:new T.Vector3(),projection:new T.Vector3(),announcement:fakeElement(),banner:fakeElement(),warning:fakeElement(),callouts:Array.from({length:10},fakeElement),composer:{render(){}},scene:new T.Scene()});
  v.scene.add(v.world.root,v.storm.root,v.effects.root,v.coin,...v.fighters.map(f=>f.root));return v;
}
test('3D story has bus, coin-to-single-sword reveal, rescue and full ending; chapter always fights as chosen hero',()=>{
  const v=viewHarness(), s=state();
  v.setStage('story',2,{scene:'bus',speaker:'Leo'});v.update(s,1/60);
  assert.ok(v.world.bus.visible);assert.ok(!v.world.museum.visible);assert.ok(v.fighters.slice(0,3).every(f=>f.root.visible&&!f.weapon.visible));
  v.setStage('story',2,{scene:'reveal',speaker:'Jason',effect:'coin'});v.update(s,1/60);
  assert.ok(v.coin.visible);assert.ok(!v.fighters[0].weapon.visible);assert.ok(v.storm.root.visible);
  v.setStage('story',2,{scene:'reveal',speaker:'Jason',effect:'sword'});v.update(s,1/60);
  assert.ok(!v.coin.visible);assert.ok(v.fighters[0].weapon.visible);
  for(let hero=0;hero<3;hero++) {
    v.setStage('battle',hero);const s2=state({heroIndex:hero});v.update(s2,1/60);
    assert.deepEqual(v.fighters.map(f=>f.root.visible),[0,1,2,3].map(i=>i===hero));
    assert.equal(v.fighters[hero].root.position.x,worldX(s2.x));assert.equal(v.fighters[hero].root.position.y,worldY(s2.y));
    assert.equal(v.storm.root.position.x,worldX(s2.ex));
  }
  v.setStage('story',0,{scene:'rescue',speaker:'Piper'});v.update(s,1/60);assert.ok(v.fighters[0].root.position.y>1);
  v.setStage('story',0,{scene:'rescue',speaker:'Leo'});v.update(s,1/60);assert.ok(v.fighters[3].root.position.y>1);
  v.setStage('complete',0);v.update(s,1/60);assert.ok(!v.storm.root.visible);assert.ok(v.fighters.slice(0,3).every(f=>f.root.visible));
  finite(v.scene);disposeTree(v.scene);
});
test('3D pause freezes the presentation and does not mutate authoritative combat state',()=>{
  const v=viewHarness(),s=state({mode:'pause'}), before=structuredClone(s);
  v.setStage('pause');v.update(s,1/60);const time=v.time,stageTime=v.stageTime;
  for(let i=0;i<60;i++)v.update(s,1/60);
  assert.equal(v.time,time);assert.equal(v.stageTime,stageTime);assert.deepEqual(s,before);
  disposeTree(v.scene);
});
test('combat camera keeps feet and the storm head visible at both arena edges and all engagement distances',()=>{
  const v=viewHarness();
  for(const [x,ex] of [[65,1170],[1210,110],[65,170],[1100,1205],[500,605],[800,690]]) {
    v.setStage('battle');v.snapCamera=true;const s=state({x,ex});v.update(s,1/60);
    for(const [wx,wy] of [[worldX(x),0],[worldX(x),3.6],[worldX(ex),0],[worldX(ex),4.8]]) {
      const p=new T.Vector3(wx,wy,0).project(v.camera);
      assert.ok(Math.abs(p.x)<.95,`${x}/${ex} clipped horizontally at ${p.x}`);
      assert.ok(p.y>-.85&&p.y<.85,`${x}/${ex} clipped vertically at ${p.y}`);
    }
  }
  disposeTree(v.scene);
});
test('3D quality changes bound pixel density and disable expensive passes without touching gameplay',()=>{
  const v=viewHarness();let stored;
  globalThis.window={devicePixelRatio:3};globalThis.localStorage={setItem:(k,value)=>{stored=[k,value];}};
  Object.assign(v,{host:{getBoundingClientRect:()=>({width:1600,height:900})},renderer:{ratio:1,shadowMap:{enabled:true},setPixelRatio(n){this.ratio=n;},getPixelRatio(){return this.ratio;},setSize(){}},bloom:{enabled:true},composer:{setPixelRatio(){},setSize(){}}});
  v.toggleQuality();assert.equal(v.qualityName,'performance');assert.equal(v.renderer.ratio,1);assert.equal(v.renderer.shadowMap.enabled,false);assert.equal(v.bloom.enabled,false);assert.deepEqual(stored,['olympus-3d-quality','performance']);
  v.toggleQuality();assert.equal(v.renderer.ratio,1.6);assert.equal(v.renderer.shadowMap.enabled,true);assert.equal(v.bloom.enabled,true);assert.equal(v.autoQuality,false);
  disposeTree(v.scene);
});
test('disposing a 3D view releases listeners, geometry, environment and postprocessing once',()=>{
  const v=viewHarness(),calls=[];
  Object.assign(v,{observer:{disconnect:()=>calls.push('observer')},environment:{dispose:()=>calls.push('environment')},composer:{passes:[{dispose:()=>calls.push('pass')}],dispose:()=>calls.push('composer')},renderer:{domElement:{removeEventListener:()=>calls.push('listener')},dispose:()=>calls.push('renderer')},host:{replaceChildren:()=>calls.push('dom')}});
  v.dispose();v.dispose();assert.deepEqual(calls,['observer','listener','environment','pass','composer','renderer','dom']);assert.equal(v.enabled,false);
});
