import { storyWalkFrames } from "./story-walk-frames";
import { spriteSvg } from "./sprite-svg";

export type Walker = keyof typeof storyWalkFrames;
type WalkPath = { from: number; to: number; seconds: number; delay?: number; bottom?: number; endBottom?: number; endScale?: number };
export const walkPaths: Record<string, Partial<Record<Walker, WalkPath>>> = {
  "midas-enter": {
    jason: {from:22,to:63,seconds:7,endBottom:42,endScale:.58},
    piper: {from:11,to:58,seconds:7.2,delay:.35,endBottom:42,endScale:.58},
    leo: {from:0,to:53,seconds:7.4,delay:.7,endBottom:42,endScale:.58},
  },
  "mall-enter": {
    jason: { from: 35, to: 70, seconds: 7.5, endBottom: 37, endScale: .62 },
    piper: { from: 26, to: 65, seconds: 7.8, delay: .3, endBottom: 37, endScale: .62 },
    leo: { from: 17, to: 60, seconds: 8, delay: .6, endBottom: 37, endScale: .62 },
  },
  "camp-tour": {
    jason: { from: -18, to: 32, seconds: 6.5 },
    piper: { from: -6, to: 44, seconds: 6.5 },
    leo: { from: 6, to: 56, seconds: 6.5 },
    drew: { from: 18, to: 68, seconds: 6.5 },
  },
  "camp-jason-cabin": { jason: { from: 15, to: 71, seconds: 6, endBottom: 39, endScale: 0.55 }, drew: { from: 29, to: 81, seconds: 6, endBottom: 38, endScale: 0.55 } },
  "camp-piper-cabin": { piper: { from: 13, to: 55, seconds: 6, endBottom: 39, endScale: 0.55 }, drew: { from: 27, to: 65, seconds: 6, endBottom: 38, endScale: 0.55 } },
  "camp-leo-cabin": { leo: { from: 19, to: 84, seconds: 6, endBottom: 38, endScale: 0.55 }, drew: { from: 33, to: 78, seconds: 6, endBottom: 37, endScale: 0.55 } },
  "forest-walk": { leo: { from: 8, to: 49, seconds: 11 } },
  "dragon-approach": { leo: { from: 13, to: 34, seconds: 7, delay: 1.2 } },
};

/** Derive gait from ground distance, so an unmoving actor never keeps walking. */
export function sampleWalk(path: WalkPath, seconds: number, reduced = false) {
  const progress = reduced ? 1 : Math.max(0, Math.min(1, (seconds - (path.delay || 0)) / path.seconds));
  const left = path.from + (path.to - path.from) * progress;
  const walking = progress > 0 && progress < 1;
  const distance = Math.abs(left - path.from);
  return { left, bottom: (path.bottom ?? 24) + ((path.endBottom ?? 24) - (path.bottom ?? 24)) * progress,
    scale: 1 + ((path.endScale ?? 1) - 1) * progress,
    frame: walking ? Math.floor(distance / 1.4) % 4 : 0, walking, progress };
}

export function walkingActor(name: Walker) {
  const f = storyWalkFrames[name];
  return `<div class="story-walker ${name}" data-walk="${name}" aria-hidden="true">${spriteSvg("camp-walk-v1.png", f.size, f.frames[0])}</div>`;
}

export function startStoryMotion(root: HTMLElement, shot: string, options: {
  reduced: boolean; step?: () => void;
  request?: (callback: FrameRequestCallback) => number; cancel?: (id: number) => void;
}) {
  const paths = walkPaths[shot];
  if (!paths) return () => {};
  const request = options.request ?? requestAnimationFrame;
  const cancel = options.cancel ?? cancelAnimationFrame;
  const actors = Array.from(root.querySelectorAll<HTMLElement>("[data-walk]")).map(el => {
    const name = el.dataset.walk as Walker;
    return { el, name, image: el.querySelector("image")!, path: paths[name]!, lastContact: -1 };
  }).filter(a => a.path);
  let start: number | undefined, handle = 0, disposed = false, lastStep = -1;
  const render = (seconds: number) => {
    let moving = false;
    for (const a of actors) {
      const state = sampleWalk(a.path, seconds, options.reduced);
      a.el.style.left = `${state.left}%`;
      a.el.style.bottom = `${state.bottom}%`;
      a.el.style.transform = `scale(${state.scale})`;
      const [x, y] = storyWalkFrames[a.name].frames[state.frame];
      a.image.setAttribute("x", String(-x));
      a.image.setAttribute("y", String(-y));
      a.el.classList.toggle("taking-step", state.walking);
      // Heel contacts occur twice per four-frame gait. One group cue avoids a noisy crowd.
      const contact = Math.floor(Math.abs(state.left - a.path.from) / 2.8);
      if (state.walking && contact !== a.lastContact && seconds - lastStep > 0.28) {
        options.step?.(); lastStep = seconds;
      }
      a.lastContact = contact;
      moving ||= seconds < a.path.seconds + (a.path.delay || 0);
    }
    return moving;
  };
  const tick: FrameRequestCallback = (now) => {
    if (disposed) return;
    start ??= now;
    if (render((now - start) / 1000)) handle = request(tick);
  };
  render(0);
  if (!options.reduced) handle = request(tick);
  return () => { disposed = true; cancel(handle); };
}
