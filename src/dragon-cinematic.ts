import { chaseFrames } from "./chase-frames";
let nextSequenceId = 0;
type Sequence = keyof typeof chaseFrames;
export function dragonSequence(which: Sequence, className: string) {
  const a = chaseFrames[which], r = a.frames[0], o = a.offsets[0], id = `dragon-sequence-${++nextSequenceId}`;
  return `<svg class="${className}" data-sequence="${which}" viewBox="0 0 ${a.logical.join(" ")}" style="aspect-ratio:${a.logical[0]}/${a.logical[1]}" preserveAspectRatio="xMidYMax meet" role="presentation"><defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><rect x="${o[0]}" y="${o[1]}" width="${r[2]}" height="${r[3]}"/></clipPath></defs><g clip-path="url(#${id})"><image href="/assets/art/${a.file}" x="${o[0]-r[0]}" y="${o[1]-r[1]}" width="${a.size[0]}" height="${a.size[1]}"/></g></svg>`;
}
export function startDragonCinematic(root: HTMLElement, shot: string, reduced: boolean) {
  const elements = Array.from(root.querySelectorAll<SVGElement>("[data-sequence]"));
  if (!elements.length) return () => {};
  let handle = 0, first: number | undefined, disposed = false;
  const paint = (elapsed: number) => {
    for (const el of elements) {
      const landed = shot === "camp-dragon-return" && (elapsed >= 6 || reduced);
      const which = landed ? "mount" : el.dataset.sequence as Sequence, a = chaseFrames[which];
      let frame = landed ? 3 : which === "mount" ? Math.min(3, Math.floor(elapsed / 1.45)) : which === "flight" ? Math.floor(elapsed * 6) % 4 : 0;
      if (reduced) frame = which === "mount" ? 3 : 0;
      const r = a.frames[frame], o = a.offsets[frame], rect = el.querySelector("rect")!, image = el.querySelector("image")!;
      image.setAttribute("href", `/assets/art/${a.file}`);
      for (const [key, value] of Object.entries({x:o[0],y:o[1],width:r[2],height:r[3]})) rect.setAttribute(key,String(value));
      image.setAttribute("x",String(o[0]-r[0])); image.setAttribute("y",String(o[1]-r[1]));
    }
  };
  const tick: FrameRequestCallback = now => {
    if(disposed)return;first??=now;paint((now-first)/1000);
    if(shot!=="dragon-calm")handle=requestAnimationFrame(tick);
  };
  paint(0);
  if(!reduced&&shot!=="dragon-calm")handle=requestAnimationFrame(tick);
  return ()=>{disposed=true;cancelAnimationFrame(handle);};
}
