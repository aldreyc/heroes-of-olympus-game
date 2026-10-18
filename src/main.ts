import Phaser from "phaser";
import "./style.css";
import { OlympusScene } from "./battle";
import { audio } from "./audio";
import { playProphecy } from "./prophecy";
import { HEROES } from "./combat-model.mjs";
import { opening, interruption, ending, type Beat } from "./story";
import type { Olympus3D } from "./three/view";
const ui = document.querySelector<HTMLElement>("#ui")!;
const persistent = document.querySelector<HTMLElement>("#persistent")!;
const app = document.querySelector<HTMLElement>("#app")!;
const scene = new OlympusScene();
const threeHost = document.createElement("div");
threeHost.id = "game-3d";
threeHost.hidden = true;
app.insertBefore(threeHost, ui);
let visualMode: "2d" | "3d" = "2d";
let threeView: Olympus3D | null = null;
let loading3d = false;
let modeMessage = "";
let selected = Math.max(
  0,
  Math.min(2, Number(localStorage.getItem("olympus-hero") || 0)),
);
let page = "loading";
let timers: number[] = [];
let storyNext: (() => void) | null = null;
let prophecyNext: (() => void) | null = null;
let prophecyPlayback: ReturnType<typeof playProphecy> | null = null;
let prophecySession = 0;
let menuChoice = selected;
let gameStarted = false;
let lastHud = "";
const touch = matchMedia("(pointer:coarse)").matches;
if (touch) app.classList.add("touch");
function later(fn: () => void, ms: number) {
  const id = window.setTimeout(fn, ms);
  timers.push(id);
  return id;
}
function clearTimers() {
  prophecyPlayback?.cancel();
  prophecyPlayback = null;
  prophecyNext = null;
  timers.forEach(clearTimeout);
  timers = [];
  storyNext = null;
}
function setPage(name: string, html: string) {
  clearTimers();
  page = name;
  app.dataset.page = name;
  threeView?.setStage(name, selected);
  ui.innerHTML = html;
  toolbar();
  requestAnimationFrame(() =>
    ui.querySelector<HTMLButtonElement>("[autofocus]")?.focus(),
  );
}
function button(label: string, id: string, cls = "primary") {
  return `<button class="${cls}" id="${id}">${label}</button>`;
}
function on(id: string, fn: () => void) {
  document.getElementById(id)?.addEventListener("click", () => {
    audio.init();
    audio.sfx("ui");
    fn();
  });
}
function toolbar() {
  const restoreSoundFocus = document.activeElement?.id === "sound";
  const soundIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4Z"/>${audio.muted ? '<path d="m16 9 6 6m0-6-6 6"/>' : '<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'}</svg>`;
  const sound = `<button class="sound-toggle ${audio.muted ? "is-muted" : "is-on"}" id="sound" aria-pressed="${!audio.muted}" aria-label="Sound ${audio.muted ? "off. Unmute" : "on. Mute"} sound (M)" title="${audio.muted ? "Turn sound on" : "Turn sound off"} (M)">${soundIcon}<span>SOUND <strong>${audio.muted ? "OFF" : "ON"}</strong></span><kbd aria-hidden="true">M</kbd></button>`;
  persistent.innerHTML = page === "loading"
    ? ""
    : `<nav class="toolbar ${page === "battle" ? "battle-toolbar" : ""}" aria-label="Game settings">${visualMode === "3d" && page !== "prophecy" ? `<button class="quality-toggle" id="quality" title="Switch 3D graphics quality">3D · ${threeView?.qualityName === "performance" ? "PERFORMANCE" : "CINEMATIC"}</button>` : ""}${sound}${page === "prophecy" ? "" : '<button class="icon-button" id="fullscreen" title="Fullscreen" aria-label="Toggle fullscreen">⛶</button>'}${page === "battle" ? '<button class="icon-button" id="controls" title="On-screen controls" aria-label="Toggle on-screen controls">⌨</button><button class="icon-button" id="pause" title="Pause (Escape)" aria-label="Pause game">Ⅱ</button>' : ""}</nav>`;
  on("quality", () => { threeView?.toggleQuality(); toolbar(); });
  on("sound", () => {
    audio.setMute();
    toolbar();
  });
  on("fullscreen", () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void app.requestFullscreen().catch(() => {});
  });
  on("pause", pauseMenu);
  on("controls", () => {
    app.classList.toggle("touch");
    lastHud = "";
    updateHud();
  });
  if (restoreSoundFocus) document.getElementById("sound")?.focus({ preventScroll: true });
}
function title() {
  audio.stopVoice();
  audio.wind(false);
  scene.scenery();
  setPage(
    "title",
    `<section class="screen title-screen"><div class="made-for"><span class="seal">✦</span> A LEGEND FOR RODRIGO</div><div class="eyebrow">A demigod’s journey begins</div><h1>HEROES<span>OF OLYMPUS</span></h1><p class="title-copy">Some heroes are born from legends.<br>Others wake up with no memory of one.</p><div class="chapter-label">BOOK I &nbsp; / &nbsp; THE LOST HERO</div><div class="mode-picker" role="group" aria-label="Choose your visual experience"><button id="mode-2d" aria-pressed="${visualMode === "2d"}" ${loading3d ? "disabled" : ""}><span class="mode-glyph" aria-hidden="true">▦</span><span><strong>2D PIXEL ART</strong><small>Rodrigo’s original heroes</small></span></button><button id="mode-3d" aria-pressed="${visualMode === "3d"}" ${loading3d ? "disabled" : ""}><span class="mode-glyph" aria-hidden="true">◇</span><span><strong>3D CINEMATIC</strong><small>Step into the storm</small></span></button></div><p class="mode-status" role="status">${loading3d ? "Bringing the 3D world to life…" : modeMessage || "One story. Two ways to become a hero."}</p><button class="primary" id="play" ${loading3d ? "disabled" : ""}>PLAY ${visualMode.toUpperCase()} &nbsp; →</button><div class="title-footer"><span>AN ADVENTURE INSPIRED BY RICK RIORDAN’S WORLD</span><span>YOUR HEROES · YOUR ADVENTURE</span></div></section>`,
  );
  on("mode-2d", () => { void chooseVisualMode("2d"); });
  on("mode-3d", () => { void chooseVisualMode("3d"); });
  on("play", () => {
    audio.playMusic();
    books();
  });
}
async function chooseVisualMode(mode: "2d" | "3d") {
  if (loading3d) return;
  modeMessage = "";
  if (mode === "3d" && !threeView) {
    loading3d = true;
    title();
    try {
      const { Olympus3D } = await import("./three/view");
      threeHost.hidden = false;
      threeView = new Olympus3D(threeHost, (message) => {
        queueMicrotask(() => {
          visualMode = "2d"; localStorage.setItem("olympus-visual-mode", "2d");
          threeView?.dispose(); threeView = null; threeHost.hidden = true;
          app.classList.remove("mode-3d"); scene.cameras.main.setVisible(true);
          const toast = document.getElementById("toast")!; toast.hidden = false; toast.className = "toast visible"; toast.textContent = message;
          window.setTimeout(() => { toast.hidden = true; }, 7000);
          toolbar();
        });
      });
      await threeView.prepare();
    } catch (error) {
      console.error("3D initialization failed", error);
      threeView?.dispose(); threeView = null; threeHost.hidden = true;
      modeMessage = "3D needs WebGL 2 on this device. You can keep playing in 2D.";
      mode = "2d";
    } finally { loading3d = false; }
  }
  visualMode = mode; localStorage.setItem("olympus-visual-mode", mode);
  app.classList.toggle("mode-3d", mode === "3d");
  threeView?.setEnabled(mode === "3d");
  scene.cameras.main.setVisible(mode === "2d");
  title();
}
function books() {
  scene.scenery();
  setPage(
    "books",
    `<section class="screen"><button class="back" id="back">← BACK</button><div class="screen-heading"><div class="eyebrow">The chronicles</div><h2>Choose your story</h2><p>Every legend has a beginning.</p></div><article class="book"><div class="book-art"><b>ϟ</b><span>THE<br>LOST HERO</span></div><div><span class="chip">BOOK I · OPENING CHAPTER</span><h3 style="margin-top:16px">The Lost Hero</h3><p>A boy without a past. Two friends he cannot remember. And a storm with a face.</p><div class="eyebrow" style="font-size:9px;margin-bottom:22px">GRAND CANYON · THREE PLAYABLE HEROES</div>${button("ENTER THE STORY →", "choose")}</div></article></section>`,
  );
  on("back", title);
  on("choose", selectHero);
}
function selectHero() {
  scene.scenery();
  menuChoice = selected;
  drawSelect();
}
function drawSelect() {
  setPage(
    "select",
    `<section class="screen"><button class="back" id="back">← BOOKS</button><div class="screen-heading"><div class="eyebrow">Three heroes. One destiny.</div><h2>Who will face the storm?</h2><p>Choose your courage. Each hero fights their own way.</p></div><div class="roster" role="group" aria-label="Choose a hero">${HEROES.map((h, i) => `<button class="hero-card ${menuChoice === i ? "selected" : ""}" id="hero-${i}" aria-pressed="${menuChoice === i}" aria-label="Choose ${h.name}"><div class="portrait ${h.id}" aria-hidden="true"><img src="/assets/art/portraits/${h.id}.png" alt="" draggable="false"></div><div class="card-info"><div class="eyebrow">${h.title}</div><h3>${h.name}</h3><p>${h.description}</p><div class="stat-row"><span>${h.weapon.toUpperCase()}</span>${[0, 1, 2, 3, 4].map((x) => `<i class="pip ${x < h.stats[0] ? "on" : ""}"></i>`).join("")}</div></div></button>`).join("")}</div><div class="select-bottom"><div class="legend"><span><kbd>←</kbd> <kbd>→</kbd> CHOOSE</span><span><kbd>ENTER</kbd> CONFIRM</span></div>${button(`PLAY AS ${HEROES[menuChoice].short} →`, "confirm")}</div><p class="memory-note">Character designs by Rodrigo · An original game adaptation</p></section>`,
  );
  threeView?.setStage("select", menuChoice);
  HEROES.forEach((_, i) =>
    on(`hero-${i}`, () => {
      menuChoice = i;
      drawSelect();
    }),
  );
  on("back", books);
  on("confirm", confirmHero);
}
function confirmHero() {
  selected = menuChoice;
  localStorage.setItem("olympus-hero", String(selected));
  audio.sfx("confirm");
  void prophecy();
}
async function prophecy() {
  const session = ++prophecySession;
  gameStarted = false;
  scene.scenery();
  audio.stopVoice();
  audio.music?.pause();
  setPage(
    "prophecy",
    '<section class="prophecy"><p id="prophecy-line" aria-live="polite"></p><button class="prophecy-skip small-button" id="skip-prophecy">SKIP PROPHECY → <kbd>ESC</kbd></button></section>',
  );
  const finish = () => {
    if (page !== "prophecy" || session !== prophecySession) return;
    prophecyPlayback?.cancel();
    audio.stopVoice();
    runStory(opening, beginBattle);
  };
  prophecyNext = finish;
  on("skip-prophecy", finish);
  try {
    const response = await fetch("/assets/prophecy.json");
    if (!response.ok) throw new Error("Prophecy unavailable");
    const lines: string[] = await response.json();
    if (page !== "prophecy" || session !== prophecySession) return;
    const text = document.getElementById("prophecy-line")!;
    prophecyPlayback = playProphecy(lines, {
      show: (line) => { text.textContent = line; text.classList.add("visible"); },
      hide: () => text.classList.remove("visible"),
      clear: () => { text.textContent = ""; },
      speak: (key) => audio.narration(key),
      stopVoice: () => audio.stopVoice(),
      done: finish,
      schedule: (fn, ms) => window.setTimeout(fn, ms),
      unschedule: (id) => window.clearTimeout(id),
    });
  } catch {
    finish();
  }
}
function runStory(beats: Beat[], done: () => void) {
  audio.stopVoice();
  let idx = 0;
  const render = () => {
    const b = beats[idx];
    if (!b) {
      audio.stopVoice();
      done();
      return;
    }
    const special = b.scene === "reveal";
    if (special && !gameStarted) {
      scene.startFight(0);
      scene.pause();
      scene.reveal = true;
      scene.label.setText("");
      audio.music?.pause();
      gameStarted = true;
      scene.player.setVisible(false);
      scene.ground.setVisible(false);
    }
    const windScene = special || b.scene === "rescue" || b.effect === "wind";
    const windArt = windScene ? `<div class="story-wind" aria-hidden="true">${Array.from({length: 12}, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>` : "";
    setPage(
      "story",
      `<section class="story-stage ${b.scene}" ${b.scene === "rescue" ? 'style="background-image:url(/assets/art/rescue.png)"' : special ? 'style="background:none"' : ""}>${windArt}<div class="cinema-bar top"></div><div class="cinema-bar bottom"></div><div class="scene-tag"><div class="eyebrow">THE LOST HERO · CHAPTER ONE</div><h3>${b.title}</h3></div><button class="small-button skip" id="skip">SKIP SCENE ↗</button>${b.effect === "coin" ? '<div class="coin-scene"><div class="coin"></div></div>' : b.effect === "sword" ? '<div class="coin-scene sword-moment"><svg class="gold-sword" viewBox="0 0 100 160" width="130" height="200"><path d="M50 3L61 25L56 110H44L39 25Z" fill="#f6d477" stroke="#fff0b8" stroke-width="2"/><path d="M50 10V110" stroke="#fff3cb"/><path d="M25 111Q50 98 75 111L73 119H27Z" fill="#b78836"/><path d="M45 118H55V147H45Z" fill="#72502d"/><circle cx="50" cy="150" r="8" fill="#e5be60"/></svg></div>' : ""}<div class="dialogue">${["Jason", "Piper", "Leo", "Coach Hedge"].includes(b.speaker) ? `<div class="speaker-portrait ${b.speaker === "Coach Hedge" ? "hedge" : b.speaker.toLowerCase()}" aria-hidden="true"></div>` : ""}<div class="speaker">${b.speaker}</div><p>${b.text}</p><div class="dialogue-footer"><span>${String(idx + 1).padStart(2, "0")} / ${String(beats.length).padStart(2, "0")} &nbsp; · &nbsp; SPACE TO CONTINUE</span><button class="small-button" id="next">${idx === beats.length - 1 ? "CONTINUE" : "NEXT"} <span aria-hidden="true">→</span></button></div></div><div class="story-progress" style="width:${((idx + 1) / beats.length) * 100}%"></div></section>`,
    );
    threeView?.setStage("story", selected, b);
    if (b.scene === "bus") audio.ambience("bus");
    else if (b.scene === "canyon") audio.wind();
    if (b.voice) audio.narration(b.voice);
    if (b.speaker === "Dylan") audio.sfx("reveal");
    if (b.effect === "wind" || special) audio.wind();
    if (b.effect === "coin") audio.sfx("coin");
    if (b.effect === "sword") {
      audio.sfx("coin");
      scene.player.setVisible(true);
      scene.ground.setVisible(true);
      scene.renderHero(0);
    }
    const advance = () => {
      audio.stopVoice();
      idx++;
      render();
    };
    storyNext = advance;
    on("next", advance);
    on("skip", () => {
      audio.stopVoice();
      done();
    });
    later(advance, b.duration || Math.max(5500, b.text.length * 50));
  };
  render();
}
function beginBattle() {
  gameStarted = false;
  app.classList.remove("played");
  setPage("battle", battleHTML());
  scene.startFight(selected);
  bindBattle();
}
function battleHTML() {
  return `<section class="hud" aria-label="Battle status">
    <div><div class="fighter-label"><span>${HEROES[selected].short}</span><small>${HEROES[selected].weapon}</small></div>
      <div class="health" id="hero-hp-bar" role="progressbar" aria-label="Hero health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><i class="damage-trail" id="hero-trail"></i><i id="hero-health"></i></div>
      <div class="meter" id="spirit-bar" role="progressbar" aria-label="Spirit" aria-valuemin="0" aria-valuemax="100" aria-valuenow="35"><i id="hero-meter"></i></div>
      <div class="meter-label"><span id="spirit-status">BUILD SPIRIT</span><span>${HEROES[selected].special.toUpperCase()}</span></div>
    </div>
    <div class="hud-center"><small>SURVIVE THE</small>STORM</div>
    <div class="enemy-hud"><div class="fighter-label"><small>VENTUS · WIND SPIRIT</small><span>DYLAN</span></div>
      <div class="health" id="enemy-hp-bar" role="progressbar" aria-label="Wind spirit health" aria-valuemin="0" aria-valuemax="160" aria-valuenow="160"><i class="damage-trail" id="enemy-trail"></i><i id="enemy-health"></i></div>
      <div class="storm-stage" id="storm-stage">I · PROTECT YOUR FRIENDS</div>
    </div>
  </section>
  <div class="combat-caption" id="combat-caption">PROTECT YOUR FRIENDS · SPECIAL REQUIRES 50 SPIRIT</div>
  <div class="chain-readout" id="chain-readout" aria-hidden="true"><strong id="chain-count">2</strong><span>HIT CHAIN<i id="chain-time"></i></span></div>
  <div class="combat-help"><span class="hint"><kbd>A</kbd><kbd>D</kbd> MOVE</span><span class="hint"><kbd>W</kbd> JUMP</span><span class="hint"><kbd>S</kbd> BLOCK</span><span class="hint"><kbd>J</kbd> QUICK</span><span class="hint"><kbd>K</kbd> STRONG</span><span class="hint"><kbd>L</kbd> SPECIAL</span></div>
  <div class="touch-controls"><div class="touch-group"><button data-hold="a" aria-label="Move left">◀</button><button data-hold="d" aria-label="Move right">▶</button><button data-action="jump" aria-label="Jump">↑</button><button data-hold="s" aria-label="Block">GUARD</button></div><div class="touch-group"><button class="attack" data-action="quick">QUICK</button><button class="attack" data-action="strong">HEAVY</button><button class="attack special" data-action="special">SPIRIT</button></div></div>`;
}
function bindBattle() {
  lastHud = "";
  const markInput = () => {
    app.classList.add("played");
    audio.init();
  };
  document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((b) => {
    const activate = () => {
      markInput();
      scene.queue(b.dataset.action!);
    };
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      activate();
    });
    b.addEventListener("click", (e) => {
      if (e.detail === 0) activate();
    });
  });
  document.querySelectorAll<HTMLButtonElement>("[data-hold]").forEach((b) => {
    const down = () => {
      markInput();
      scene.keys.add(b.dataset.hold!);
      b.classList.add("held");
    };
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      down();
    });
    const up = () => {
      scene.keys.delete(b.dataset.hold!);
      b.classList.remove("held");
    };
    b.addEventListener("pointerup", up);
    b.addEventListener("pointercancel", up);
    b.addEventListener("lostpointercapture", up);
    b.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        down();
      }
    });
    b.addEventListener("keyup", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        up();
      }
    });
    b.addEventListener("blur", up);
  });
  updateHud();
}
function updateHud() {
  if (page !== "battle") return;
  const stamp = `${scene.health},${scene.enemyHealth},${scene.meter},${scene.streak},${Math.ceil(scene.streakTimer * 10)},${scene.storyTriggered}`;
  if (stamp === lastHud) return;
  lastHud = stamp;
  for (const [id, width] of [
    ["hero-health", scene.health], ["hero-trail", scene.health],
    ["enemy-health", scene.enemyHealth / 160 * 100], ["enemy-trail", scene.enemyHealth / 160 * 100],
    ["hero-meter", scene.meter],
  ] as [string, number][]) {
    const el = document.getElementById(id);
    if (el) el.style.width = `${width}%`;
  }
  document.getElementById("hero-hp-bar")?.setAttribute("aria-valuenow", String(scene.health));
  document.getElementById("enemy-hp-bar")?.setAttribute("aria-valuenow", String(scene.enemyHealth));
  document.getElementById("spirit-bar")?.setAttribute("aria-valuenow", String(scene.meter));
  document.getElementById("hero-hp-bar")?.classList.toggle("low-health", scene.health <= 25);
  const ready = scene.meter >= 50;
  document.getElementById("spirit-bar")?.classList.toggle("ready", ready);
  const status = document.getElementById("spirit-status");
  if (status) status.textContent = ready ? "L · READY" : `${Math.round(scene.meter)} / 50`;
  document.querySelector('[data-action="special"]')?.classList.toggle("ready", ready);
  const stage = document.getElementById("storm-stage");
  if (stage) stage.textContent = scene.storyTriggered ? "II · HOLD THE LINE" : "I · PROTECT YOUR FRIENDS";
  const chain = document.getElementById("chain-readout");
  const chained = scene.streak >= 2 && scene.streakTimer > 0;
  chain?.classList.toggle("visible", chained);
  const count = document.getElementById("chain-count");
  if (count) count.textContent = String(scene.streak);
  const chainTime = document.getElementById("chain-time");
  if (chainTime) chainTime.style.transform = `scaleX(${Math.max(0, scene.streakTimer) / 1.6})`;
  const caption = document.getElementById("combat-caption");
  if (caption) {
    caption.classList.toggle("ready", ready);
    caption.textContent = ready
      ? `${HEROES[selected].special.toUpperCase()} READY · ${app.classList.contains("touch") ? "TAP SPIRIT" : "PRESS L"}`
      : `JUMP LOW GUSTS · BLOCK SWEEPS · STRIKE DURING RECOVERY`;
  }
}
function resumeBattle() {
  setPage("battle", battleHTML());
  scene.player.setVisible(true);
  scene.enemy.setVisible(true);
  scene.resume();
  bindBattle();
  audio.playMusic();
}
function pauseMenu() {
  if (page !== "battle") return;
  scene.pause();
  setPage(
    "pause",
    `<div class="modal"><div class="modal-card"><div class="eyebrow">Take a breath, demigod</div><h2>Paused</h2><p>Move with A / D. Jump with W or Space.<br>Hold S to block. J: quick · K: strong · L: special.<br>Time your guard just before impact for a perfect block.<br>Connect J → K → L to chain your attacks.<br>Strike during recovery for bonus counter damage.</p><div class="button-row">${button("RESUME", "resume")}${button("RESTART", "retry", "secondary")}${button("CHARACTERS", "characters", "secondary")}</div></div></div>`,
  );
  on("resume", resumeBattle);
  on("retry", beginBattle);
  on("characters", selectHero);
}
function finishBattle(won: boolean) {
  if (won) {
    audio.wind(false);
    runStory(ending, chapterComplete);
  } else {
    setPage(
      "defeat",
      `<div class="modal"><div class="modal-card"><div class="eyebrow">Even heroes fall</div><h2>Rise again</h2><p>The storm is fierce, but you’ve learned its rhythm.<br>Jump the low gust. Block the sweep.<br>Strike when the wind spirit recovers.</p><div class="button-row">${button("TRY AGAIN", "retry")}${button("CHANGE HERO", "characters", "secondary")}</div></div></div>`,
    );
    on("retry", beginBattle);
    on("characters", selectHero);
  }
}
function chapterComplete() {
  scene.scenery();
  localStorage.setItem("olympus-complete", "true");
  const stats = scene.stats;
  setPage(
    "complete",
    `<section class="screen complete"><div class="eyebrow">THE LOST HERO · CHAPTER ONE</div><div class="crest">✦</div><h2>You stood against the storm.</h2><p>Jason, Piper, and Leo are safe. Coach Hedge is still out there.<br>This chapter ends. Your legend has only begun.</p><div class="results"><div><strong>${stats.hits}</strong><span>STRIKES LANDED</span></div><div><strong>${stats.perfectBlocks}</strong><span>PERFECT GUARDS</span></div><div><strong>${stats.counters}</strong><span>COUNTERATTACKS</span></div><div><strong>${stats.bestCombo}</strong><span>BEST HIT CHAIN</span></div></div><div class="button-row">${button("PLAY AGAIN", "replay")}${button("CHOOSE HERO", "characters", "secondary")}</div><button class="small-button" style="margin-top:18px" id="home">RETURN TO TITLE</button><p class="memory-note">For Rodrigo. Your heroes. Your adventure.</p></section>`,
  );
  on("replay", beginBattle);
  on("characters", selectHero);
  on("home", title);
}
scene.onUpdate = updateHud;
scene.onFrame = (dt) => {
  threeView?.update(scene, dt);
  const quality = document.getElementById("quality");
  if (quality && threeView) {
    const label = `3D · ${threeView.qualityName.toUpperCase()}`;
    if (quality.textContent !== label) quality.textContent = label;
  }
};
scene.onEnd = finishBattle;
scene.onStory = () => runStory(interruption, resumeBattle);
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "m" && !e.repeat) {
    audio.setMute();
    toolbar();
  }
  if (
    page === "battle" &&
    ["a", "d", "w", "s", "j", "k", "l", " "].includes(e.key.toLowerCase())
  )
    app.classList.add("played");
  if (page === "select" && ["ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
    menuChoice = (menuChoice + (e.key === "ArrowRight" ? 1 : 2)) % 3;
    drawSelect();
  } else if (
    page === "select" &&
    e.key === "Enter" &&
    !(document.activeElement instanceof HTMLButtonElement)
  ) {
    e.preventDefault();
    confirmHero();
  } else if (
    page === "story" &&
    (e.code === "Space" || e.key === "Enter") &&
    !(document.activeElement instanceof HTMLButtonElement)
  ) {
    e.preventDefault();
    storyNext?.();
  } else if (e.key === "Escape") {
    if (page === "prophecy") { e.preventDefault(); prophecyNext?.(); }
    else if (page === "battle") pauseMenu();
    else if (page === "pause") resumeBattle();
  }
});
window.addEventListener("blur", () => {
  if (page === "battle") pauseMenu();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && page === "battle") pauseMenu();
});
window.addEventListener("game-ready", () => {
  title();
  if (localStorage.getItem("olympus-visual-mode") === "3d") void chooseVisualMode("3d");
}, { once: true });
setPage(
  "loading",
  '<section class="loading"><span>HEROES OF OLYMPUS</span><p>Gathering the heroes…</p></section>',
);
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#080e18",
  pixelArt: true,
  antialias: false,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [scene],
  input: { keyboard: true, touch: true },
  audio: { noAudio: false },
});
// Read-only diagnostics support repeatable browser verification.
Object.defineProperty(window, "olympus", {
  get: () => ({
    page,
    visualMode,
    graphics: threeView?.enabled ? threeView.diagnostics() : null,
    hero: HEROES[selected].id,
    mode: scene.mode,
    hp: scene.health,
    enemyHp: scene.enemyHealth,
    meter: scene.meter,
    x: scene.x,
    y: scene.y,
    enemyX: scene.ex,
    enemyPhase: scene.enemyPhase,
    enemyMove: scene.enemyMove,
    stats: { ...scene.stats },
  }),
});
