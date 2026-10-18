import { goldRegions } from "./midas-model.mjs";

/** Runtime spell effect: preserve source alpha and shading while mapping pixels to gold. */
export function gildPixels(data: Uint8ClampedArray) {
  for(let i=0;i<data.length;i+=4) {
    if (!data[i+3]) continue;
    const light = data[i]*.2126 + data[i+1]*.7152 + data[i+2]*.0722;
    data[i] = Math.min(255,35+light*1.05);
    data[i+1] = Math.min(255,20+light*.76);
    data[i+2] = Math.min(255,6+light*.23);
  }
  return data;
}

export function ensureGoldTexture(scene: any, key: string) {
  const name = `gilded-${key}`;
  if (scene.textures.exists(name)) return name;
  const source = scene.textures.get(key), image = source.getSourceImage();
  const gold = scene.textures.createCanvas(name,image.width,image.height);
  if (!gold) return key;
  const context = gold.getContext();context.drawImage(image,0,0);
  const pixels = context.getImageData(0,0,image.width,image.height);
  gildPixels(pixels.data);context.putImageData(pixels,0,0);gold.refresh();
  for(const frame of source.getFrameNames()) {
    const f = source.get(frame);gold.add(frame,0,f.cutX,f.cutY,f.cutWidth,f.cutHeight);
  }
  return name;
}

export function gildFramePixels(data: Uint8ClampedArray, width: number, height: number, hits: number) {
  const regions = goldRegions(hits);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    if(!regions.some(([rx,ry,rw,rh]:number[])=>x/width>=rx&&x/width<rx+rw&&y/height>=ry&&y/height<ry+rh))continue;
    const offset=(y*width+x)*4;
    gildPixels(data.subarray(offset,offset+4));
  }
  return data;
}

/** Cache a gold version of the exact pose. This works in both Phaser renderers. */
export function applyGoldCurse(scene: any) {
  if(scene.encounter!=="midas"||scene.goldHits===0)return;
  const p=scene.player,key=p.texture.key,frame=p.frame;
  if(key.startsWith("curse-"))return;
  const name=`curse-${key}-${frame.name}-${scene.goldHits}`;
  // The idle source is over 1100px tall; the fighter is about 300px on screen.
  // Bound the spell cache while keeping its exact displayed size and foot anchor.
  const rasterScale=Math.min(1,384/frame.cutHeight);
  const width=Math.max(1,Math.round(frame.cutWidth*rasterScale)),height=Math.max(1,Math.round(frame.cutHeight*rasterScale));
  if(!scene.textures.exists(name)) {
    const texture=scene.textures.createCanvas(name,width,height);
    if(!texture)return;
    const context=texture.getContext();
    context.imageSmoothingEnabled=false;
    context.drawImage(p.texture.getSourceImage(),frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,width,height);
    const pixels=context.getImageData(0,0,width,height);
    gildFramePixels(pixels.data,width,height,scene.goldHits);context.putImageData(pixels,0,0);texture.refresh();
  }
  const ox=p.originX,oy=p.originY,sx=p.scaleX,sy=p.scaleY;
  p.setTexture(name).setOrigin(ox,oy).setScale(sx*frame.cutWidth/width,sy*frame.cutHeight/height);
  if(scene.goldHits===10)p.clearTint();
}
