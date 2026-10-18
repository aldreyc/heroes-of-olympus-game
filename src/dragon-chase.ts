import { CHASE, createChase, startChase, pauseChase, resumeChase, queueChaseJump, setChaseDuck, stepChase, drainChaseEvents, currentWarning } from "./dragon-chase-model.mjs";
import { drawDragonChase, type ChaseImages } from "./dragon-chase-renderer";

export function dragonChaseHTML() {
  return `<section class="dragon-chase"><div class="chase-stage"><canvas id="chase-canvas" width="1280" height="720" tabindex="0" aria-label="Leo's dragon chase. Jump low fire with W or Space. Duck high fire by holding S."></canvas></div><div class="chase-hud"><div><span class="eyebrow">LEO · OUTRUN THE BRONZE DRAGON</span><strong id="chase-lead">LEAD · 6 / 6</strong></div><div class="chase-goal"><span>TABASCO + MOTOR OIL</span><progress id="chase-progress" max="52" value="0" aria-label="Distance to the vat"></progress></div></div><div id="chase-callout" class="chase-callout" aria-live="polite"></div><div class="chase-controls"><button id="chase-duck" class="chase-control">HOLD TO DUCK <kbd>S / ↓</kbd></button><button id="chase-jump" class="chase-control jump-control">JUMP <kbd>W / ↑ / SPACE</kbd></button></div><div class="chase-overlay" id="chase-overlay"><div class="chase-card"><div class="eyebrow">THE WOODS ARE WAKING UP</div><h2>Run, Leo!</h2><p>Festus is on your heels. Keep running until you reach the vat of Tabasco and motor oil.</p><div class="chase-instructions"><span>🔥 LOW FIRE<br><b>JUMP</b> · W / ↑ / SPACE</span><span>🔥 HIGH FIRE<br><b>DUCK</b> · HOLD S / ↓</span></div><p class="chase-note">Fire cannot burn Leo, but a blast can knock him off stride. Six stumbles let Festus catch up.</p><button class="primary" id="chase-start" autofocus>RUN FOR THE VAT →</button></div></div></section>`;
}

export function startDragonChase(root: HTMLElement, options: {
  images: ChaseImages; reduced: boolean; sound: (name: string) => void; done: () => void;
}) {
  const canvas = root.querySelector<HTMLCanvasElement>("#chase-canvas")!;
  const ctx = canvas.getContext("2d")!;
  const overlay = root.querySelector<HTMLElement>("#chase-overlay")!;
  const lead = root.querySelector<HTMLElement>("#chase-lead")!;
  const progress = root.querySelector<HTMLProgressElement>("#chase-progress")!;
  const callout = root.querySelector<HTMLElement>("#chase-callout")!;
  let state = createChase(), disposed = false, handle = 0, previous = 0, accumulator = 0, finishedAt = 0;
  let lastStride = 0, messageUntil = 0, message = "", lastAnnouncement = "";
  const listeners = new AbortController(), signal = listeners.signal;
  const listen = (target: EventTarget, type: string, fn: EventListener) => target.addEventListener(type, fn, { signal });
  const focusCanvas = () => canvas.focus({ preventScroll: true });
  const begin = () => { state = createChase(); startChase(state); overlay.hidden = true; finishedAt = 0; accumulator = 0; lastStride = 0; focusCanvas(); };
  const jump = () => { if(state.mode === "running" && state.y === 0) { options.sound("jump"); queueChaseJump(state); focusCanvas(); } };
  const showPause = () => {
    overlay.hidden = false;
    overlay.innerHTML = '<div class="chase-card"><div class="eyebrow">TAKE A BREATH</div><h2>Chase paused</h2><p>Jump low fire. Duck high fire. Keep your lead until the vat.</p><button class="primary" id="chase-resume">RESUME →</button></div>';
    overlay.querySelector("#chase-resume")!.addEventListener("click", () => { resumeChase(state); overlay.hidden = true; focusCanvas(); }, { once: true, signal });
    overlay.querySelector<HTMLButtonElement>("#chase-resume")!.focus();
  };
  const pause = () => { if (state.mode === "running") { pauseChase(state); showPause(); } };
  const togglePause = () => { if (state.mode === "paused") {resumeChase(state);overlay.hidden=true;focusCanvas();}else pause(); };
  listen(root.querySelector("#chase-start")!, "click", begin);
  const duck = root.querySelector<HTMLButtonElement>("#chase-duck")!;
  listen(duck, "pointerdown", ((e: PointerEvent) => {e.preventDefault();duck.setPointerCapture(e.pointerId);setChaseDuck(state,true);}) as EventListener);
  for (const event of ["pointerup", "pointercancel", "lostpointercapture", "blur"]) listen(duck,event,()=>setChaseDuck(state,false));
  listen(duck,"keydown",((e:KeyboardEvent)=>{if(e.code==="Space"||e.key==="Enter"){e.preventDefault();setChaseDuck(state,true);}}) as EventListener);
  listen(duck,"keyup",()=>setChaseDuck(state,false));
  listen(root.querySelector("#chase-jump")!, "click", jump);
  listen(window,"keydown",((e: KeyboardEvent) => {
    if(e.key === "Escape" && !e.repeat){e.preventDefault();togglePause();return;}
    if((e.target as HTMLElement)?.closest?.("button"))return;
    if(["w","W","ArrowUp"," "].includes(e.key)){e.preventDefault();if(!e.repeat)jump();}
    if(["s","S","ArrowDown"].includes(e.key)){e.preventDefault();setChaseDuck(state,true);}
  }) as EventListener);
  listen(window,"keyup",((e:KeyboardEvent)=>{if(["s","S","ArrowDown"].includes(e.key))setChaseDuck(state,false);}) as EventListener);
  listen(window,"blur",pause);
  listen(document,"visibilitychange",()=>{if(document.hidden)pause();});
  const consume = () => {
    for(const event of drainChaseEvents(state)) {
      if(event === "fire")options.sound("fire");
      if(event === "stumble"){options.sound("block");message="KEEP GOING · FIND YOUR STRIDE";messageUntil=state.time+1.2;}
      if(event.startsWith("clear-")){message=event==="clear-jump"?"CLEAN JUMP!":"PERFECT DUCK!";messageUntil=state.time+.9;}
      if(event === "finish"){options.sound("victory");finishedAt=performance.now();}
      if(event === "caught"){
        options.sound("heavy");overlay.hidden=false;
        overlay.innerHTML='<div class="chase-card"><div class="eyebrow">A LITTLE TOO CLOSE</div><h2>Find your stride.</h2><p>Festus caught up. Watch the warning: jump the low flames and duck under the high ones.</p><button class="primary" id="chase-retry">TRY THE CHASE AGAIN →</button></div>';
        overlay.querySelector("#chase-retry")!.addEventListener("click",begin,{once:true,signal});overlay.querySelector<HTMLButtonElement>("#chase-retry")!.focus();
      }
    }
  };
  const render = () => {
    drawDragonChase(ctx,state,options.images,options.reduced);
    lead.textContent=`LEAD · ${Math.max(0,CHASE.maxStumbles-state.stumbles)} / ${CHASE.maxStumbles}`;
    progress.value=state.time;
    const warning=currentWarning(state),announcement=state.mode==="won"?"YOU REACHED THE VAT!":warning?(warning.kind==="low"?"LOW FIRE · JUMP!":"HIGH FIRE · DUCK!"):state.time<messageUntil?message:"";
    callout.classList.toggle("warning-live", Boolean(warning));
    if(announcement!==lastAnnouncement){callout.textContent=announcement;lastAnnouncement=announcement;}
    duck.classList.toggle("held",state.duck);
  };
  const tick: FrameRequestCallback = now => {
    if(disposed)return;
    const elapsed=previous?Math.min(.1,(now-previous)/1000):0;previous=now;
    if(state.mode==="running"){
      accumulator+=elapsed;
      while(accumulator>=1/60){stepChase(state,1/60);consume();accumulator-=1/60;}
      const stride=Math.floor(state.time*3);if(stride!==lastStride){if(stride%2)options.sound("dragon-step");else if(state.y===0)options.sound("step");lastStride=stride;}
    }else accumulator=0;
    render();
    if(state.mode==="won"&&now-finishedAt>1100){options.done();return;}
    handle=requestAnimationFrame(tick);
  };
  render();handle=requestAnimationFrame(tick);
  return { state: () => state, pause, togglePause, dispose(){disposed=true;listeners.abort();cancelAnimationFrame(handle);setChaseDuck(state,false);} };
}
