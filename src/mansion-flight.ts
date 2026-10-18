import type { Beat } from "./story";
import { mansionPartyFrames as party } from "./mansion-frames";

export const BLUE_STRIKE_TIME = 2.4;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => { const t = clamp(n); return t*t*(3-2*t); };

/** A single scene clock synchronizes the wing hit, stopped wingbeat, beam and fall. */
export function sampleMansionFlight(shot: string, seconds: number, reduced = false) {
  const time = Math.max(0, seconds);
  let frame = 1 + Math.floor(time * 5) % 2, left = 7, top = -5, scale = .95, angle = 0, beam = 0, impact = 0, smoke = 0;
  if (shot === "mansion-departure") {
    const p = ease((time-1.8)/5.7);
    frame = time < 1.8 ? 0 : frame;
    left = -6 + p*13; top = 20-p*25; scale = .95;
  } else if (shot === "mansion-relief") {
    top += reduced ? 0 : Math.sin(time * 1.3)*.7;
    angle = reduced ? 0 : Math.sin(time)*.4;
  } else if (shot === "mansion-blue-strike") {
    const p = ease((time-BLUE_STRIKE_TIME)/4.6);
    if (time >= BLUE_STRIKE_TIME) { frame = 3; smoke = 1; }
    beam = time >= BLUE_STRIKE_TIME && time < BLUE_STRIKE_TIME+.65 ? 1 : 0;
    impact = time >= BLUE_STRIKE_TIME ? clamp(1-(time-BLUE_STRIKE_TIME)/1.2) : 0;
    left += p*12; top += p*19; angle = p*15; scale -= p*.1;
  } else if (shot === "mansion-descent") {
    const p = ease(time/8);
    frame = 3; smoke = 1; left = 19+p*22; top = 14+p*17; angle = 15+p*7; scale = .85-p*.4;
  } else if (shot === "mansion-reveal") {
    const p = ease(time/8);
    frame = 3; smoke = 1; left = 15+p*23; top = -16+p*28; angle = 16-p*7; scale = .55-p*.22;
  }
  if (reduced) {
    frame = shot === "mansion-departure" ? 0 : ["mansion-relief"].includes(shot) ? 1 : 3;
    left = shot === "mansion-reveal" ? 30 : 7; top = shot === "mansion-departure" ? 20 : 0;
    scale = shot === "mansion-reveal" ? .5 : .9; angle = 0; impact = 0;
    if (shot === "mansion-blue-strike") { beam = .5; smoke = 1; }
  }
  return { frame, left, top, scale, angle, beam, impact, smoke };
}

let cropId = 0;
export function mansionFlightTableau(b: Beat) {
  const shot = b.shot!, id = `mansion-party-${++cropId}`;
  const f = party.frames[0], o = party.offsets[0], s = party.scales[0];
  const smoke = Array.from({length:8},(_,i)=>`<i style="--i:${i}"></i>`).join("");
  return `<div class="story-shot ${shot} mansion-sequence" data-mansion-scene="${shot}" aria-hidden="true"><div class="mansion-sky"></div><div class="mansion-flight-cloud far"></div><div class="mansion-party" data-mansion-party><svg viewBox="0 0 ${party.logical.join(" ")}" preserveAspectRatio="xMidYMid meet"><defs><clipPath id="${id}"><rect x="${o[0]}" y="${o[1]}" width="${f[2]*s}" height="${f[3]*s}"/></clipPath></defs><g clip-path="url(#${id})"><image href="/assets/art/${party.file}" x="${o[0]-f[0]*s}" y="${o[1]-f[1]*s}" width="${party.size[0]*s}" height="${party.size[1]*s}"/></g><g data-wing-smoke opacity="0">${Array.from({length:8},(_,i)=>`<circle cx="${384-i*20}" cy="${263-i*13}" r="${8+i*2}" fill="${i%2 ? "#495267" : "#77849a"}" opacity="${.55-i*.045}"/>`).join("")}</g></svg></div><svg class="mansion-blue-beam" viewBox="0 0 1280 720" data-blue-beam opacity="0"><path d="M1260 650L535 167" stroke="#1276ef" stroke-width="52" opacity=".3"/><path d="M1260 650L535 167" stroke="#37baff" stroke-width="22" opacity=".85"/><path d="M1260 650L535 167" stroke="#e7fdff" stroke-width="6"/></svg><svg class="mansion-wing-impact" viewBox="0 0 1280 720" data-wing-impact opacity="0"><circle cx="535" cy="167" r="37" fill="none" stroke="#b6f4ff" stroke-width="5"/>${Array.from({length:14},(_,i)=>{const a=i*Math.PI/7;return `<path d="M${535+Math.cos(a)*45} ${167+Math.sin(a)*45}l${Math.cos(a)*33} ${Math.sin(a)*33}" stroke="${i%2?"#4ec9ff":"#e4fcff"}" stroke-width="${i%2?3:5}"/>`;}).join("")}</svg><div class="mansion-flight-cloud near"></div><div class="mansion-fall-streaks">${smoke}</div></div>`;
}

export function startMansionFlight(root: HTMLElement, shot: string, reduced: boolean) {
  const dragon = root.querySelector<HTMLElement>("[data-mansion-party]");
  if (!dragon) return () => {};
  const rect = dragon.querySelector("rect")!, image = dragon.querySelector("image")!;
  const beam = root.querySelector("[data-blue-beam]")!, impact = root.querySelector("[data-wing-impact]")!, smoke = dragon.querySelector("[data-wing-smoke]")!;
  let start: number | undefined, handle = 0, disposed = false;
  const paint = (time: number) => {
    const state = sampleMansionFlight(shot, time, reduced), frame = party.frames[state.frame], offset = party.offsets[state.frame], scale = party.scales[state.frame];
    dragon.style.left = `${state.left}%`; dragon.style.top = `${state.top}%`;
    dragon.style.transform = `scale(${state.scale}) rotate(${state.angle}deg)`;
    for(const [key,value]of Object.entries({x:offset[0],y:offset[1],width:frame[2]*scale,height:frame[3]*scale}))rect.setAttribute(key,String(value));
    for(const [key,value]of Object.entries({x:offset[0]-frame[0]*scale,y:offset[1]-frame[1]*scale,width:party.size[0]*scale,height:party.size[1]*scale}))image.setAttribute(key,String(value));
    beam.setAttribute("opacity",String(state.beam)); impact.setAttribute("opacity",String(state.impact)); smoke.setAttribute("opacity",String(state.smoke));
  };
  const tick: FrameRequestCallback = now => {
    if(disposed)return;start??=now;paint((now-start)/1000);handle=requestAnimationFrame(tick);
  };
  paint(0);
  if(!reduced)handle=requestAnimationFrame(tick);
  return ()=>{disposed=true;cancelAnimationFrame(handle);};
}
