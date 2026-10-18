import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path) {
 const scope={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,scope);
 return scope.exports;
}
const {spriteSvg}=load('src/sprite-svg.ts');
const {storyFrames}=load('src/story-frames.ts');
const {storyProps}=load('src/story-props.ts');
const {storyWalkFrames}=load('src/story-walk-frames.ts');
test('every sheet crop masks the source image even when the display box has a different aspect ratio',()=>{
 const frames=[...Object.values(storyFrames),...Object.values(storyProps),...Object.values(storyWalkFrames).flatMap(a=>a.frames.map(rect=>({file:'camp-walk-v1.png',size:a.size,rect})))];
 const ids=new Set();
 for(const f of frames){
  const [x,y,w,h]=f.rect,html=spriteSvg(f.file,f.size,f.rect);
  assert.ok(html.includes(`viewBox="0 0 ${w} ${h}"`));
  const id=html.match(/<clipPath id="([^"]+)" clipPathUnits="userSpaceOnUse">/)[1];
  assert.ok(!ids.has(id));ids.add(id);
  assert.ok(html.includes(`<rect width="${w}" height="${h}"/>`));
  assert.ok(html.includes(`<g clip-path="url(#${id})"><image `));
  assert.ok(html.includes(`x="${-x}" y="${-y}"`));
 }
});
