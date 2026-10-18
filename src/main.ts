import Phaser from "phaser";
import "./style.css";
import { OlympusScene } from "./battle";
import { audio } from "./audio";
import { playProphecy } from "./prophecy";
import { HEROES, BATTLE_RULES } from "./combat-model.mjs";
import { opening, ending, type Beat } from "./story";
import { storyTableau } from "./story-tableau";
import { campArrival, dragonReturn } from "./camp-story";
import { startStoryMotion } from "./story-walk";
import { startDragonChase, dragonChaseHTML } from "./dragon-chase";
import { startDragonCinematic } from "./dragon-cinematic";
import { chaseFrames } from "./chase-frames";
import { questBriefing, questJourney, medeaEnding, goldenDragonEnding, mansionJourney } from "./quest-story";
import { questTableau, startQuestCinematic } from "./quest-tableau";
import { mansionFlightTableau, startMansionFlight, BLUE_STRIKE_TIME } from "./mansion-flight";
import { midasArrival, midasEnding } from "./midas-story";
import { midasTableau } from "./midas-tableau";
import { MIDAS_RULES, GOLD_STAGES } from "./midas-model.mjs";
const ui = document.querySelector<HTMLElement>("#ui")!;
const persistent = document.querySelector<HTMLElement>("#persistent")!;
const app = document.querySelector<HTMLElement>("#app")!;
const scene = new OlympusScene();
let selected = Math.max(
  0,
  Math.min(2, Number(localStorage.getItem("olympus-hero") || 0)),
);
let page = "loading";
let timers: number[] = [];
let stopStoryMotion: (() => void) | null = null;
let dragonChase: ReturnType<typeof startDragonChase> | null = null;
let storyNext: (() => void) | null = null;
let storyShot = "";
let prophecyNext: (() => void) | null = null;
let prophecyPlayback: ReturnType<typeof playProphecy> | null = null;
let prophecySession = 0;
let menuChoice = selected;
let gameStarted = false;
let activeEncounter: "dylan" | "medea" | "golden-dragon" | "midas" = "dylan";
let lastHud = "";
const touch = matchMedia("(pointer:coarse)").matches;
if (touch) app.classList.add("touch");
function later(fn: () => void, ms: number) {
  const id = window.setTimeout(fn, ms);
  timers.push(id);
  return id;
}
function clearTimers() {
  dragonChase?.dispose();
  dragonChase = null;
  stopStoryMotion?.();
  stopStoryMotion = null;
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
  ui.innerHTML = html;
  toolbar();
  requestAnimationFrame(() =>
    ui.querySelector<HTMLButtonElement>("[autofocus]")?.focus(),
  );
}
function button(label: string, id: string, cls = "primary") {
  return `<button class="${cls}" id="${id}">${label}</button>`;
}
function studioBrand() {
  return `<div class="studio-brand"><img class="studio-mark" src="/assets/branding/olympian-games-mark.svg" alt="" width="56" height="56"><div class="studio-wordmark"><span class="studio-kicker">A LEGEND BY</span><strong>OLYMPIAN GAMES</strong><span class="studio-founder">Created by Rodrigo Cabrera</span></div></div>`;
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
    : `<nav class="toolbar ${["battle", "chase"].includes(page) ? "battle-toolbar" : ""}" aria-label="Game settings">${sound}${page === "prophecy" ? "" : '<button class="icon-button" id="fullscreen" title="Fullscreen" aria-label="Toggle fullscreen">⛶</button>'}${page === "battle" ? '<button class="battle-skip" id="skip-battle" title="Skip the fight and continue the story">SKIP BATTLE →</button><button class="icon-button" id="controls" title="On-screen controls" aria-label="Toggle on-screen controls">⌨</button><button class="icon-button" id="pause" title="Pause (Escape)" aria-label="Pause game">Ⅱ</button>' : page === "chase" ? '<button class="battle-skip" id="skip-chase">SKIP CHASE →</button><button class="icon-button" id="pause" aria-label="Pause chase">Ⅱ</button>' : ""}</nav>`;
  on("sound", () => {
    audio.setMute();
    toolbar();
  });
  on("fullscreen", () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void app.requestFullscreen().catch(() => {});
  });
  on("pause", pauseMenu);
  on("skip-battle", skipBattle);
  on("skip-chase", returnWithFestus);
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
    `<section class="screen title-screen">${studioBrand()}<div class="eyebrow">A demigod’s journey begins</div><h1>HEROES<span>OF OLYMPUS</span></h1><p class="title-copy">Some heroes are born from legends.<br>Others wake up with no memory of one.</p><div class="chapter-label">BOOK I &nbsp; / &nbsp; THE LOST HERO</div>${button("PLAY &nbsp; →", "play")}<div class="title-checkpoints" id="title-checkpoints"></div><div class="title-footer"><span>AN ADVENTURE INSPIRED BY RICK RIORDAN’S WORLD</span><span>PIXEL ART · STORY · COMBAT</span></div></section>`,
  );
  if (localStorage.getItem("olympus-complete") === "true" || localStorage.getItem("olympus-mansion-unlocked") === "true" || localStorage.getItem("olympus-midas-unlocked") === "true") {
    document.getElementById("title-checkpoints")?.insertAdjacentHTML("beforeend", '<button class="small-button continue-camp" id="continue-midas">PLAY CRASH & KING MIDAS →</button>');
    on("continue-midas", beginMidasStory);
  }
  if (localStorage.getItem("olympus-complete") === "true" || localStorage.getItem("olympus-quest-unlocked") === "true" || localStorage.getItem("olympus-mansion-unlocked") === "true") {
    document.getElementById("title-checkpoints")?.insertAdjacentHTML("beforeend", '<button class="small-button continue-camp" id="continue-mansion">PLAY NEW FLIGHT SCENE →</button>');
    on("continue-mansion", beginMansionFlight);
  }
  if (localStorage.getItem("olympus-complete") === "true" || localStorage.getItem("olympus-camp-unlocked") === "true" || localStorage.getItem("olympus-quest-unlocked") === "true") {
    document.getElementById("title-checkpoints")?.insertAdjacentHTML("beforeend", '<button class="small-button continue-camp" id="continue-quest">CONTINUE THE QUEST →</button>');
    on("continue-quest", beginQuest);
  }
  on("play", () => {
    audio.playMusic();
    books();
  });
  if (localStorage.getItem("olympus-camp-unlocked") === "true" || localStorage.getItem("olympus-complete") === "true") {
    document.getElementById("title-checkpoints")?.insertAdjacentHTML("beforeend", '<button class="small-button continue-camp" id="continue-camp">CONTINUE AT CAMP →</button>');
    on("continue-camp", arriveAtCamp);
    if (localStorage.getItem("olympus-chase-unlocked") === "true" || localStorage.getItem("olympus-complete") === "true") {
      document.getElementById("title-checkpoints")?.insertAdjacentHTML("beforeend", '<button class="small-button continue-camp" id="continue-chase">PLAY DRAGON CHASE →</button>');
      on("continue-chase", beginDragonChase);
    }
  }
}
function books() {
  scene.scenery();
  setPage(
    "books",
    `<section class="screen"><button class="back" id="back">← BACK</button><div class="screen-heading"><div class="eyebrow">The chronicles</div><h2>Choose your story</h2><p>Every legend has a beginning.</p></div><article class="book"><div class="book-art"><img class="book-cover" src="/assets/art/lost-hero-cover-pixel-v1.png" alt="Pixel-art adaptation of The Lost Hero cover by Rick Riordan" width="1024" height="1536"></div><div><span class="chip">BOOK I · OPENING CHAPTER</span><h3 style="margin-top:16px">The Lost Hero</h3><p>A boy without a past. Two friends he cannot remember. And a storm with a face.</p><div class="eyebrow" style="font-size:9px;margin-bottom:22px">GRAND CANYON · THREE PLAYABLE HEROES</div>${button("ENTER THE STORY →", "choose")}</div></article></section>`,
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
    `<section class="screen"><button class="back" id="back">← BOOKS</button><div class="screen-heading"><div class="eyebrow">Three heroes. One destiny.</div><h2>Who will face the storm?</h2><p>Choose your courage. Each hero fights their own way.</p></div><div class="roster" role="group" aria-label="Choose a hero">${HEROES.map((h, i) => `<button class="hero-card ${menuChoice === i ? "selected" : ""}" id="hero-${i}" aria-pressed="${menuChoice === i}" aria-label="Choose ${h.name}"><div class="portrait ${h.id}" aria-hidden="true"><img src="/assets/art/portraits/${h.id}.png" alt="" draggable="false"></div><div class="card-info"><div class="eyebrow">${h.title}</div><h3>${h.name}</h3><p>${h.description}</p><div class="stat-row"><span>${h.weapon.toUpperCase()}</span>${[0, 1, 2, 3, 4].map((x) => `<i class="pip ${x < h.stats[0] ? "on" : ""}"></i>`).join("")}</div></div></button>`).join("")}</div><div class="select-bottom"><div class="legend"><span><kbd>←</kbd> <kbd>→</kbd> CHOOSE</span><span><kbd>ENTER</kbd> CONFIRM</span></div>${button(`PLAY AS ${HEROES[menuChoice].short} →`, "confirm")}</div><p class="memory-note">Game creation &amp; character designs by Rodrigo Cabrera · Olympian Games</p></section>`,
  );
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
    storyShot = b.shot || "";
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
      `<section class="story-stage ${b.scene} ${b.shot ? "has-tableau" : ""}" ${special ? 'style="background:none"' : ""}>${windArt}${b.scene === "midas-story" ? midasTableau(b) : b.shot?.startsWith("mansion-") ? mansionFlightTableau(b) : b.scene === "quest" ? questTableau(b) : storyTableau(b)}<div class="cinema-bar top"></div><div class="cinema-bar bottom"></div><div class="scene-tag"><div class="eyebrow">THE LOST HERO · ${b.chapter || "CHAPTER ONE"}</div><h3>${b.title}</h3></div><button class="small-button skip" id="skip">SKIP SCENE ↗</button>${b.effect === "coin" ? '<div class="coin-scene"><div class="coin"></div></div>' : b.effect === "sword" ? '<div class="coin-scene sword-moment"><svg class="gold-sword" viewBox="0 0 100 160" width="130" height="200"><path d="M50 3L61 25L56 110H44L39 25Z" fill="#f6d477" stroke="#fff0b8" stroke-width="2"/><path d="M50 10V110" stroke="#fff3cb"/><path d="M25 111Q50 98 75 111L73 119H27Z" fill="#b78836"/><path d="M45 118H55V147H45Z" fill="#72502d"/><circle cx="50" cy="150" r="8" fill="#e5be60"/></svg></div>' : ""}<div class="dialogue ${b.kind === "prophecy" ? "oracle-dialogue" : ""}">${["Jason", "Piper", "Leo", "Coach Hedge"].includes(b.speaker) ? `<div class="speaker-portrait ${b.speaker === "Coach Hedge" ? "hedge" : b.speaker.toLowerCase()}" aria-hidden="true"></div>` : ""}<div class="speaker">${b.kind === "action" ? "" : b.speaker}</div><p class="${b.kind === "action" ? "action-caption" : ""}">${b.text}</p><div class="dialogue-footer"><span>${String(idx + 1).padStart(2, "0")} / ${String(beats.length).padStart(2, "0")} &nbsp; · &nbsp; SPACE TO CONTINUE</span><button class="small-button" id="next">${b.kind === "prophecy" ? "CONTINUE / SKIP" : idx === beats.length - 1 ? "CONTINUE" : "NEXT"} <span aria-hidden="true">→</span></button></div></div><div class="story-progress" style="width:${((idx + 1) / beats.length) * 100}%"></div></section>`,
    );
    const stopWalk = startStoryMotion(ui, b.shot || "", { reduced: scene.reduced, step: () => audio.sfx("step") });
    const stopDragon = startDragonCinematic(ui, b.shot || "", scene.reduced);
    const stopQuest = startQuestCinematic(ui, scene.reduced);
    const stopMansion = startMansionFlight(ui, b.shot || "", scene.reduced);
    stopStoryMotion = () => { stopWalk(); stopDragon(); stopQuest(); stopMansion(); };
    if (b.scene === "camp" || b.scene === "woods" || b.scene === "quest") {
      audio.wind(false);
      audio.playMusic();
    }
    if (b.shot?.startsWith("mansion-")) {
      audio.music?.pause();
      audio.wind();
      if (b.shot === "mansion-departure") later(() => audio.sfx("gust"), 1800);
      if (b.shot === "mansion-blue-strike") later(() => { audio.sfx("lightning"); audio.sfx("heavy"); }, BLUE_STRIKE_TIME*1000);
      if (b.shot === "mansion-descent") audio.sfx("gust");
    }
    if(b.scene === "midas-story") {
      audio.music?.pause();
      if(["midas-crash","midas-repair","midas-hephaestus","midas-forge-words","midas-ascension","midas-enter"].includes(b.shot||""))audio.wind();else audio.wind(false);
      if(b.shot==="midas-crash")later(()=>{audio.sfx("heavy");audio.sfx("fire");},650);
      if(b.shot==="midas-hephaestus")audio.sfx("reveal");
      if(b.shot==="midas-ascension")[1000,4000].forEach(ms=>later(()=>audio.sfx("charm"),ms));
      if(b.shot==="midas-friends-gold")[1500,2300].forEach(ms=>later(()=>audio.sfx("coin"),ms));
    }
    if (b.shot === "camp-touchdown") later(() => audio.sfx("land"), 5800);
    if (b.shot === "camp-claiming") [1000, 2400, 3800].forEach(ms => later(() => audio.sfx("charm"), ms));
    if (b.shot === "dragon-discovery") audio.sfx("coin");
    if (b.scene === "bus") audio.ambience("bus");
    else if (b.scene === "canyon") audio.wind();
    if (b.voice) audio.narration(b.voice);
    if (["quest-rachel", "quest-oracle", "mall-spell"].includes(b.shot || "")) audio.sfx("charm");
    if (["quest-takeoff", "quest-horizon", "mall-landing"].includes(b.shot || "")) audio.sfx("gust");
    if (b.shot === "mall-golden-dragon") audio.sfx("heavy");
    if (b.shot === "mall-festus-window") {
      audio.sfx("gust");
      later(() => { audio.sfx("heavy"); audio.sfx("land"); }, 1100);
    }
    if (b.shot === "mall-festus-fire") [900, 1900, 2900].forEach(ms => later(() => audio.sfx("fire"), ms));
    if (b.shot === "mall-dragon-fallen") audio.sfx("heavy");
    if (b.shot === "mall-hedge") audio.sfx("coin");
    if (b.shot === "mall-landing") later(() => audio.sfx("land"), 6500);
    if (b.shot === "transform") audio.sfx("reveal");
    if (["piper-fall", "leo-ledge", "departure"].includes(b.shot || "")) audio.sfx("gust");
    if (b.shot === "departure") audio.wind();
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
function beginBattle(encounter: "dylan" | "medea" | "golden-dragon" | "midas" = "dylan") {
  activeEncounter = encounter;
  if(encounter === "midas")selected=0;
  audio.stopVoice();
  gameStarted = false;
  app.classList.remove("played");
  setPage("battle", battleHTML());
  scene.startFight(selected, activeEncounter);
  bindBattle();
}
function battleHTML() {
  const midas = activeEncounter === "midas";
  const heroHealth = midas ? MIDAS_RULES.hitLimit : BATTLE_RULES.heroHealth;
  const medea = activeEncounter === "medea";
  const dragon = activeEncounter === "golden-dragon";
  const enemyHealth = midas ? MIDAS_RULES.health : dragon ? 1800 : medea ? 1900 : BATTLE_RULES.spiritHealth;
  return `<section class="hud" aria-label="Battle status">
    <div><div class="fighter-label"><span>${HEROES[selected].short}</span><small>${HEROES[selected].weapon}</small></div>
      <div class="health" id="hero-hp-bar" role="progressbar" aria-label="${midas ? "Golden curse resistance" : "Hero health"}" aria-valuemin="0" aria-valuemax="${heroHealth}" aria-valuenow="${heroHealth}"><i class="damage-trail" id="hero-trail"></i><i id="hero-health"></i></div>
      <div class="meter" id="spirit-bar" role="progressbar" aria-label="Spirit" aria-valuemin="0" aria-valuemax="100" aria-valuenow="35"><i id="hero-meter"></i></div>
      <div class="meter-label"><span id="spirit-status">BUILD SPIRIT</span><span>${HEROES[selected].special.toUpperCase()}</span></div>
    </div>
    <div class="hud-center"><small>${midas ? "RESIST THE" : dragon ? "HOLD YOUR" : medea ? "BREAK THE" : "SURVIVE THE"}</small>${midas ? "GOLD" : dragon ? "GROUND" : medea ? "SPELL" : "STORM"}</div>
    <div class="enemy-hud"><div class="fighter-label"><small>${midas ? "THE GOLDEN HAND" : dragon ? "MECHANICAL · PURE GOLD" : medea ? "SORCERESS · ENCHANTRESS" : "VENTUS · WIND SPIRIT"}</small><span>${midas ? "KING MIDAS" : dragon ? "GOLDEN DRAGON" : medea ? "MEDEA" : "DYLAN"}</span></div>
      <div class="health" id="enemy-hp-bar" role="progressbar" aria-label="${midas ? "King Midas health" : dragon ? "Golden dragon health" : medea ? "Medea enchantment" : "Wind spirit health"}" aria-valuemin="0" aria-valuemax="${enemyHealth}" aria-valuenow="${enemyHealth}"><i class="damage-trail" id="enemy-trail"></i><i id="enemy-health"></i>${dragon ? '<b class="festus-health-mark" title="Festus arrives at one third health" aria-hidden="true"></b>' : ""}</div>
      <div class="storm-stage" id="storm-stage">${midas ? "TEN GOLD HITS WILL TURN JASON TO GOLD" : dragon ? "WEAKEN IT TO ⅓ · FESTUS WILL HELP" : medea ? "I · RESIST THE ENCHANTMENT" : "I · PROTECT YOUR FRIENDS"}</div>
    </div>
  </section>
  ${midas ? `<div class="gold-curse-hud"><strong id="gold-curse-status" role="status">GOLD HITS · 0 / 10</strong><div class="gold-curse-pips" aria-hidden="true">${Array.from({length:10},(_,i)=>`<i id="gold-pip-${i}"></i>`).join("")}</div><small id="gold-body-status">DODGE LOW GOLD · BLOCK HIGH SHARDS</small></div>` : ""}
  ${medea ? '<div class="enchantment-status"><span id="charm-status">ENCHANTMENT 0%</span><i><b id="charm-meter"></b></i><button data-action="rally" id="rally"><kbd>Q</kbd> PIPER · RALLY</button><small id="rally-status">BREAK THE SPELL · STUN MEDEA</small></div>' : ""}
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
  const stamp = `${scene.health},${scene.enemyHealth},${scene.meter},${scene.streak},${Math.ceil(scene.streakTimer * 10)},${scene.storyTriggered},${Math.round(scene.charm)},${Math.ceil(scene.rallyCooldown)},${scene.goldHits}`;
  if (stamp === lastHud) return;
  lastHud = stamp;
  for (const [id, width] of [
    ["hero-health", scene.health / scene.heroMaxHealth * 100], ["hero-trail", scene.health / scene.heroMaxHealth * 100],
    ["enemy-health", scene.enemyHealth / scene.enemyMaxHealth * 100], ["enemy-trail", scene.enemyHealth / scene.enemyMaxHealth * 100],
    ["hero-meter", scene.meter],
  ] as [string, number][]) {
    const el = document.getElementById(id);
    if (el) el.style.width = `${width}%`;
  }
  document.getElementById("hero-hp-bar")?.setAttribute("aria-valuenow", String(scene.health));
  document.getElementById("enemy-hp-bar")?.setAttribute("aria-valuenow", String(scene.enemyHealth));
  document.getElementById("spirit-bar")?.setAttribute("aria-valuenow", String(scene.meter));
  document.getElementById("hero-hp-bar")?.classList.toggle("low-health", scene.health <= scene.heroMaxHealth * .25);
  const ready = scene.meter >= 50;
  document.getElementById("spirit-bar")?.classList.toggle("ready", ready);
  const status = document.getElementById("spirit-status");
  if (status) status.textContent = ready ? "L · READY" : `${Math.round(scene.meter)} / 50`;
  document.querySelector('[data-action="special"]')?.classList.toggle("ready", ready);
  const stage = document.getElementById("storm-stage");
  if (stage) stage.textContent = activeEncounter === "midas" ? "TEN GOLD HITS WILL TURN JASON TO GOLD" : activeEncounter === "golden-dragon" ? "WEAKEN IT TO ⅓ · FESTUS WILL HELP" : activeEncounter === "medea" ? (scene.storyTriggered ? "II · SHATTER THE WARD" : "I · RESIST THE ENCHANTMENT") : scene.storyTriggered ? "II · HOLD THE LINE" : "I · PROTECT YOUR FRIENDS";
  if(activeEncounter === "midas") {
    const gold=document.getElementById("gold-curse-status"),body=document.getElementById("gold-body-status");
    if(gold)gold.textContent=`GOLD HITS · ${scene.goldHits} / 10${scene.goldHits===9?" · ONE HIT LEFT":""}`;
    if(body)body.textContent=scene.goldHits?`TRANSFORMED · ${GOLD_STAGES[scene.goldHits]}`:"DODGE LOW GOLD · BLOCK HIGH SHARDS";
    for(let i=0;i<10;i++)document.getElementById(`gold-pip-${i}`)?.classList.toggle("filled",i<scene.goldHits);
  }
  if (activeEncounter === "medea") {
    const charm = document.getElementById("charm-status"), meter = document.getElementById("charm-meter"), rally = document.getElementById("rally-status");
    if (charm) charm.textContent = `ENCHANTMENT ${Math.round(scene.charm)}%${scene.charm >= 60 ? " · ATTACK WEAKENED" : ""}`;
    if (meter) meter.style.width = `${scene.charm}%`;
    if (rally) rally.textContent = scene.rallyCooldown > 0 ? `READY IN ${Math.ceil(scene.rallyCooldown)}s` : "READY · BREAK THE SPELL";
    const rallyButton = document.getElementById("rally") as HTMLButtonElement | null;
    if (rallyButton) { rallyButton.disabled = scene.rallyCooldown > 0; rallyButton.classList.toggle("ready", scene.rallyCooldown <= 0); }
  }
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
      : activeEncounter === "midas" ? "JUMP LOW GOLD · BLOCK SHARDS · TEN HITS = FULL GOLD" : activeEncounter === "golden-dragon" ? "JUMP FLOOR FIRE · BLOCK CLAWS · WEAKEN THE DRAGON TO ONE THIRD" : activeEncounter === "medea" ? "JUMP POTIONS · BLOCK CRYSTALS · Q RALLIES YOUR FRIENDS" : "JUMP LOW GUSTS · BLOCK SWEEPS · STRIKE DURING RECOVERY";
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
  if (page === "chase") { dragonChase?.togglePause(); return; }
  if (page !== "battle") return;
  scene.pause();
  setPage(
    "pause",
    `<div class="modal"><div class="modal-card"><div class="eyebrow">Take a breath, demigod</div><h2>Paused</h2><p>Move with A / D. Jump with W or Space.<br>Hold S to block. J: quick · K: strong · L: special.<br>Time your guard just before impact for a perfect block.<br>Connect J → K → L to chain your attacks.<br>Strike during recovery for bonus counter damage.</p><div class="button-row">${button("RESUME", "resume")}${button("RESTART", "retry", "secondary")}${button("CHARACTERS", "characters", "secondary")}</div><button class="small-button" id="skip-battle-paused" style="margin-top:18px">SKIP BATTLE · CONTINUE STORY →</button></div></div>`,
  );
  on("skip-battle-paused", skipBattle);
  on("resume", resumeBattle);
  on("retry", () => beginBattle(activeEncounter));
  on("characters", selectHero);
}
function afterMedea() {
  runStory(medeaEnding, () => beginBattle("golden-dragon"));
}
function finishBattle(won: boolean) {
  if(activeEncounter === "midas") {
    audio.wind(false);
    if(won){scene.scenery();runStory(midasEnding,chapterComplete);return;}
    setPage("defeat",`<div class="modal"><div class="modal-card"><div class="eyebrow">THE TENTH GOLDEN HIT</div><h2>Jason has turned to gold</h2><p>Jump over low golden pieces. Hold S to deflect higher shards.<br>Only unblocked hits spread the curse. The tenth hit completes it.</p><div class="button-row">${button("TRY AGAIN AS JASON","retry")}${button("REPLAY ARRIVAL","replay-midas-arrival","secondary")}</div></div></div>`);
    on("retry",()=>beginBattle("midas"));on("replay-midas-arrival",beginMidasStory);return;
  }
  if (activeEncounter === "golden-dragon") {
    scene.scenery();
    audio.wind(false);
    if (won) { scene.enemyHealth = scene.enemyMaxHealth / 3; runStory(goldenDragonEnding, beginMansionFlight); return; }
    setPage("defeat", `<div class="modal"><div class="modal-card"><div class="eyebrow">THE GOLDEN GUARDIAN</div><h2>Hold your ground</h2><p>Jump floor fire. Block the claws and charge.<br>Weaken the dragon to one third health—Festus will do the rest.</p>${button("TRY AGAIN", "retry")}${button("CONTINUE STORY", "skip-golden-dragon", "secondary")}</div></div>`);
    on("retry", () => beginBattle("golden-dragon"));
    on("skip-golden-dragon", () => { scene.enemyHealth = scene.enemyMaxHealth / 3; runStory(goldenDragonEnding, beginMansionFlight); });
    return;
  }
  if (activeEncounter === "medea") {
    scene.scenery();
    audio.wind(false);
    if (won) { afterMedea(); return; }
    setPage("defeat", `<div class="modal"><div class="modal-card"><div class="eyebrow">STAND TOGETHER</div><h2>Break the spell</h2><p>Jump over rolling potions. Block the crystal fan and charmspeak.<br>Press Q to rally with Piper: clear enchantment and stun Medea.<br>Attack during her recovery.</p>${button("TRY AGAIN", "retry")}${button("CONTINUE STORY", "skip-medea", "secondary")}</div></div>`);
    on("retry", () => beginBattle("medea"));
    on("skip-medea", afterMedea);
    return;
  }
  if (won) {
    localStorage.setItem("olympus-camp-unlocked", "true");
    audio.wind(false);
    scene.scenery();
    audio.music?.pause();
    runStory(ending, arriveAtCamp);
  } else {
    setPage(
      "defeat",
      `<div class="modal"><div class="modal-card"><div class="eyebrow">Even heroes fall</div><h2>Rise again</h2><p>The storm is fierce, but you’ve learned its rhythm.<br>Jump the low gust. Block the sweep.<br>Strike when the wind spirit recovers.</p><div class="button-row">${button("TRY AGAIN", "retry")}${button("CHANGE HERO", "characters", "secondary")}</div></div></div>`,
    );
    on("retry", () => beginBattle(activeEncounter));
    on("characters", selectHero);
  }
}
function skipBattle() {
  if (page !== "battle" && page !== "pause") return;
  scene.pause();
  scene.keys.clear();
  scene.buffer = "";
  scene.pendingResult = null;
  finishBattle(true);
}
function arriveAtCamp() {
  gameStarted = false;
  scene.scenery();
  audio.wind(false);
  runStory(campArrival, beginDragonChase);
}
function beginDragonChase() {
  scene.scenery();
  audio.wind(false);
  audio.playMusic();
  localStorage.setItem("olympus-chase-unlocked", "true");
  setPage("chase", dragonChaseHTML());
  const images: Record<string, CanvasImageSource> = {};
  for (const file of ["camp-woods-v2.png", "chase-trees-v1.png", ...Object.values(chaseFrames).map(a => a.file)])
    images[file] = scene.textures.get(file.replace(/\.png$/, "")).getSourceImage() as HTMLImageElement;
  dragonChase = startDragonChase(ui, { images, reduced: scene.reduced, sound: name => audio.sfx(name), done: returnWithFestus });
}
function returnWithFestus() {
  if (page !== "chase") return;
  runStory(dragonReturn, beginQuest);
}
function beginQuest() {
  scene.scenery();
  audio.wind(false);
  localStorage.setItem("olympus-quest-unlocked", "true");
  runStory(questBriefing, () => runStory(questJourney, () => beginBattle("medea")));
}
function beginMansionFlight() {
  scene.scenery();
  localStorage.setItem("olympus-mansion-unlocked", "true");
  runStory(mansionJourney, beginMidasStory);
}
function beginMidasStory() {
  scene.scenery();
  localStorage.setItem("olympus-midas-unlocked", "true");
  runStory(midasArrival,()=>beginBattle("midas"));
}
function chapterComplete() {
  scene.scenery();
  localStorage.setItem("olympus-complete", "true");
  const stats = scene.stats;
  const battleResults = stats.hits ? `<div class="results"><div><strong>${stats.hits}</strong><span>STRIKES LANDED</span></div><div><strong>${stats.perfectBlocks}</strong><span>PERFECT GUARDS</span></div><div><strong>${stats.counters}</strong><span>COUNTERATTACKS</span></div><div><strong>${stats.bestCombo}</strong><span>BEST HIT CHAIN</span></div></div>` : "";
  setPage(
    "complete",
    `<section class="screen complete"><div class="eyebrow">THE LOST HERO · THE QUEST</div><div class="crest">✦</div><h2>Against the golden king.</h2><p>Jason has defeated King Midas.<br>Piper and Leo still need his help to break the golden curse.<br>The quest continues.</p>${battleResults}<div class="button-row">${button("FIGHT MIDAS", "replay-midas")}${button("REPLAY CRASH", "replay-midas-story", "secondary")}${button("REPLAY FLIGHT", "replay-flight", "secondary")}${button("REPLAY QUEST", "replay-quest", "secondary")}${button("FIGHT MEDEA", "replay-medea", "secondary")}${button("FIGHT GOLDEN DRAGON", "replay-golden-dragon", "secondary")}${button("REPLAY CHASE", "replay-chase", "secondary")}${button("REPLAY CAMP", "replay-camp", "secondary")}${button("REPLAY BATTLE", "replay", "secondary")}${button("CHOOSE HERO", "characters", "secondary")}</div><button class="small-button" style="margin-top:18px" id="home">RETURN TO TITLE</button><p class="memory-note">An Olympian Games adventure · Created by Rodrigo Cabrera</p></section>`,
  );
  on("replay-midas",()=>beginBattle("midas"));
  on("replay-midas-story",beginMidasStory);
  on("replay-flight", beginMansionFlight);
  on("replay-quest", beginQuest);
  on("replay-medea", () => beginBattle("medea"));
  on("replay-golden-dragon", () => beginBattle("golden-dragon"));
  on("replay-chase", beginDragonChase);
  on("replay-camp", arriveAtCamp);
  on("replay", beginBattle);
  on("characters", selectHero);
  on("home", title);
}
scene.onUpdate = updateHud;
scene.onEnd = finishBattle;
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
    else if (page === "story" && storyShot === "quest-oracle") { e.preventDefault(); storyNext?.(); }
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
window.addEventListener("game-ready", title, { once: true });
setPage(
  "loading",
  `<section class="loading">${studioBrand()}<span>HEROES OF OLYMPUS</span><p>Gathering the heroes…</p></section>`,
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
    encounter: activeEncounter,
    charm: scene.charm,
    goldHits: scene.goldHits,
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
