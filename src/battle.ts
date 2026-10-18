import Phaser from "phaser";
import { audio, AUDIO_FILES } from "./audio";
import { HEROES, MOVES, BATTLE_RULES, attackDamage, hitOutcome } from "./combat-model.mjs";
import { drawStorm, drawSpirit, drawMove, drawGust, HERO_INK } from "./combat-vfx";
import { CAMP_ART } from "./camp-story";
import { CHASE_ART } from "./chase-frames";
import { MANSION_ART } from "./mansion-frames";
import { QUEST_ART } from "./quest-story";
import { drawMedeaAtmosphere, drawMedeaSpell } from "./medea-vfx";
import { questFrames } from "./quest-frames";
import { drawGoldenAtmosphere, drawGoldenAttack } from "./golden-dragon-vfx";
import { midasFrames, MIDAS_ART } from "./midas-frames";
import { MIDAS_RULES, goldVolley, advanceGoldBolts, goldenHit } from "./midas-model.mjs";
import { ensureGoldTexture, applyGoldCurse } from "./gold-render";
import { drawMidasAtmosphere, drawMidasBolts } from "./midas-vfx";
import { storyFrames } from "./story-frames";
export type BattleStats = {
  hits: number;
  blocks: number;
  combo: number;
  bestCombo: number;
  time: number;
  damage: number;
  counters: number;
  perfectBlocks: number;
};
type Mode = "scenery" | "battle" | "pause";
export class OlympusScene extends Phaser.Scene {
  mode: Mode = "scenery";
  encounter: "dylan" | "medea" | "golden-dragon" | "midas" = "dylan";
  goldHits = 0;
  goldBolts: ReturnType<typeof goldVolley> = [];
  goldStatues: Phaser.GameObjects.Sprite[] = [];
  charm = 0;
  rallyCooldown = 0;
  rallyFlash = 0;
  heroIndex = 0;
  player!: Phaser.GameObjects.Sprite;
  enemy!: Phaser.GameObjects.Container;
  spirit!: Phaser.GameObjects.Sprite;
  smoke!: Phaser.GameObjects.Graphics;
  effects!: Phaser.GameObjects.Graphics;
  weather!: Phaser.GameObjects.Graphics;
  floorFX!: Phaser.GameObjects.Graphics;
  backdrop!: Phaser.GameObjects.Image;
  ground!: Phaser.GameObjects.Ellipse;
  shadow!: Phaser.GameObjects.Ellipse;
  particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    max: number;
    color: number;
    size: number;
  }[] = [];
  x = 300;
  y = 590;
  vy = 0;
  ex = 950;
  heroMaxHealth = BATTLE_RULES.heroHealth;
  health = this.heroMaxHealth;
  enemyMaxHealth = BATTLE_RULES.spiritHealth;
  enemyHealth = this.enemyMaxHealth;
  meter = 35;
  facing = 1;
  elapsed = 0;
  acc = 0;
  clock = 0;
  enemyTimer = 2;
  enemyPhase = "wait";
  enemyMove = "low";
  move = "";
  moveTime = 0;
  connected = false;
  hurt = 0;
  freeze = 0;
  storyTriggered = false;
  keys = new Set<string>();
  buffer = "";
  bufferAge = 0;
  streak = 0;
  streakTimer = 0;
  enemyHit = false;
  enemyCycle = 0;
  enemyRecoil = 0;
  guardFlash = 0;
  guardAge = 0;
  guarding = false;
  guardHeld = false;
  counterClaimed = false;
  storm = 1;
  pendingResult: boolean | null = null;
  finishTimer = 0;
  reveal = false;
  impacts: { x: number; y: number; color: number; life: number; power: number }[] = [];
  callouts: { obj: Phaser.GameObjects.Text; life: number; y: number }[] = [];
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  stats: BattleStats = {
    hits: 0,
    blocks: 0,
    combo: 0,
    bestCombo: 0,
    time: 0,
    damage: 0,
    counters: 0,
    perfectBlocks: 0,
  };
  onUpdate: () => void = () => {};
  onEnd: (won: boolean) => void = () => {};
  label!: Phaser.GameObjects.Text;
  warning!: Phaser.GameObjects.Text;
  flashTimer = 0;
  atlas: any;
  constructor() {
    super("Olympus");
  }
  preload() {
    for (const [key, file] of Object.entries(AUDIO_FILES))
      this.load.audio(key, `/assets/audio/${file}`);
    this.load.on("progress", (value: number) => {
      const status = document.querySelector(".loading p");
      if (status) status.textContent = `Gathering the heroes… ${Math.round(value * 100)}%`;
    });
    this.load.image("arena", "/assets/art/arena.png");
    this.load.image("title", "/assets/art/title.png");
    this.load.image("bus", "/assets/art/bus.png");
    this.load.image("rescue", "/assets/art/rescue.png");
    for (const name of [...MIDAS_ART, ...MANSION_ART, ...QUEST_ART, ...CHASE_ART, ...CAMP_ART, "story-cast-v1", "story-heroes-v1", "story-chariot-v1", "story-ledge-v2", "story-cliff-rescue-v2", "story-flight-embrace-v2", "story-chariot-arrival-v2", "story-chariot-landed-v2", "story-chariot-departure-v2"])
      this.load.image(name, `/assets/art/${name}.png`);
    this.load.image("heroes", "/assets/art/heroes.png");
    this.load.atlas("jason-idle", "/assets/art/jason-idle-v2.png", "/assets/art/jason-idle-v2-atlas.json");
    this.load.image("wind-spirit", "/assets/art/wind-spirit-v2.png");
    this.load.atlas("strikes", "/assets/art/heroes-strikes-v2.png", "/assets/art/heroes-strikes-v2-atlas.json");
    this.load.atlas(
      "walking",
      "/assets/art/heroes-walk.png",
      "/assets/art/heroes-walk-atlas.json",
    );
    this.load.json("frames", "/assets/art/heroes-atlas.json");
  }
  create() {
    audio.attach(this.sound);
    this.backdrop = this.add.image(640, 360, "arena").setDisplaySize(1280, 720);
    const veil = this.add.rectangle(640, 360, 1280, 720, 0x06101c, 0.18);
    void veil;
    this.weather = this.add.graphics();
    this.floorFX = this.add.graphics();
    this.ground = this.add.ellipse(300, 593, 150, 24, 0x050b12, 0.48);
    this.shadow = this.add.ellipse(950, 597, 155, 24, 0x050b12, 0.5);
    this.atlas = this.cache.json.get("frames");
    midasFrames.king.frames.forEach((r,i)=>this.textures.get("king-midas-combat-v1").add(String(i),0,r[0],r[1],r[2],r[3]));
    questFrames.golden.frames.forEach((r, i) => this.textures.get("golden-dragon-v2").add(String(i), 0, r[0], r[1], r[2], r[3]));
    questFrames.medea.frames.forEach((r, i) => this.textures.get("medea-combat-v1").add(String(i), 0, r[0], r[1], r[2], r[3]));
    const tex = this.textures.get("heroes");
    const img = tex.getSourceImage() as HTMLImageElement;
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 6; c++) {
        const rect = this.getRect(r, c, img.width, img.height);
        tex.add(`${r}-${c}`, 0, rect.x, rect.y, rect.w, rect.h);
      }
    this.player = this.add
      .sprite(300, 590, "heroes", "0-0")
      .setOrigin(0.5, 1)
      .setDisplaySize(235, 290);
    this.enemy = this.add.container(950, 450);
    this.spirit = this.add.sprite(0, 150, "wind-spirit").setOrigin(0.5, 1).setDisplaySize(272, 408);
    this.enemy.add(this.spirit);
    this.smoke = this.add.graphics();
    this.enemy.add(this.smoke);
    this.effects = this.add.graphics();
    this.label = this.add
      .text(640, 245, "", {
        fontFamily: "Georgia",
        fontSize: "38px",
        color: "#f2d397",
        align: "center",
        stroke: "#091221",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(10);
    this.warning = this.add
      .text(640, 170, "", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#edd19b",
        backgroundColor: "#0a1520",
        padding: { x: 16, y: 9 },
      })
      .setOrigin(0.5);
    this.player.setVisible(false);
    this.enemy.setVisible(false);
    this.ground.setVisible(false);
    this.shadow.setVisible(false);
    this.warning.setVisible(false);
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => this.handleKeyDown(e));
    this.input.keyboard?.on("keyup", (e: KeyboardEvent) =>
      this.keys.delete(e.key.toLowerCase()),
    );
    window.addEventListener("blur", () => this.keys.clear());
    window.dispatchEvent(new Event("game-ready"));
  }
  handleKeyDown(e: KeyboardEvent) {
    // Menus retain native keyboard navigation and Space button activation.
    if (this.mode !== "battle") return;
    const k = e.key.toLowerCase();
    if (k === " " && (e.target as HTMLElement | null)?.closest?.("button")) return;
    if (["arrowleft", "arrowright", "arrowup", " ", "arrowdown"].includes(k))
      e.preventDefault();
    if (!e.repeat) {
      if (k === "j") this.queue("quick");
      if (k === "k") this.queue("strong");
      if (k === "l") this.queue("special");
      if (k === "q") this.rally();
      if (k === "w" || k === "arrowup" || k === " ") this.queue("jump");
    }
    this.keys.add(k);
  }
  getRect(r: number, c: number, w: number, h: number) {
    const frames = this.atlas?.frames;
    const key = `${HEROES[r].id}-${["idle", "walk", "jump", "block", "quick", "strong"][c]}`;
    const f =
      frames?.[key]?.frame ||
      frames?.[key] ||
      frames?.[`${r}-${c}`]?.frame ||
      frames?.[`${r}-${c}`];
    if (f) return { x: f.x, y: f.y, w: f.w || f.width, h: f.h || f.height };
    return {
      x: Math.floor((c * w) / 6),
      y: Math.floor((r * h) / 3),
      w: Math.floor(w / 6),
      h: Math.floor(h / 3),
    };
  }
  scenery() {
    this.mode = "scenery";
    this.player?.setVisible(false);
    this.goldStatues.forEach(s=>s.setVisible(false));
    this.goldBolts=[];
    this.enemy?.setVisible(false);
    this.shadow?.setVisible(false);
    this.ground?.setVisible(false);
    this.label?.setText("");
    this.warning?.setVisible(false);
    this.particles = [];
    this.impacts = [];
    this.clearCallouts();
    this.weather?.clear();
    this.floorFX?.clear();
    this.effects?.clear();
    this.reveal = false;
    if (this.textures.exists("title"))
      this.backdrop?.setTexture("title").setDisplaySize(1280, 720);
  }
  startFight(hero: number, encounter: "dylan" | "medea" | "golden-dragon" | "midas" = "dylan") {
    this.encounter = encounter;
    this.charm = 0;
    this.rallyCooldown = 0;
    this.rallyFlash = 0;
    this.goldHits=0;
    this.goldBolts=[];
    this.heroIndex = encounter === "midas" ? 0 : hero;
    this.mode = "battle";
    this.x = 300;
    this.y = 590;
    this.vy = 0;
    this.ex = 950;
    this.heroMaxHealth = encounter === "midas" ? MIDAS_RULES.hitLimit : BATTLE_RULES.heroHealth;
    this.health = this.heroMaxHealth;
    this.enemyMaxHealth = encounter === "midas" ? MIDAS_RULES.health : encounter === "golden-dragon" ? 1800 : encounter === "medea" ? 1900 : BATTLE_RULES.spiritHealth;
    this.enemyHealth = this.enemyMaxHealth;
    this.meter = 35;
    this.move = "";
    this.moveTime = 0;
    this.connected = false;
    this.facing = 1;
    this.acc = 0;
    this.streak = 0;
    this.streakTimer = 0;
    this.enemyHit = false;
    this.enemyCycle = 0;
    this.enemyRecoil = 0;
    this.guardFlash = 0;
    this.guardAge = 0;
    this.guarding = false;
    this.guardHeld = false;
    this.counterClaimed = false;
    this.storm = 1;
    this.pendingResult = null;
    this.finishTimer = 0;
    this.reveal = false;
    this.bufferAge = 0;
    this.hurt = 0;
    this.enemyTimer = 2.8;
    this.enemyPhase = "wait";
    this.elapsed = 0;
    this.freeze = 0;
    this.storyTriggered = false;
    this.particles = [];
    this.impacts = [];
    this.clearCallouts();
    this.keys.clear();
    this.buffer = "";
    this.stats = {
      hits: 0,
      blocks: 0,
      combo: 0,
      bestCombo: 0,
      time: 0,
      damage: 0,
      counters: 0,
      perfectBlocks: 0,
    };
    this.player.setVisible(true).clearTint();
    this.enemy.setVisible(true).setPosition(this.ex, 450);
    this.ground.setVisible(true).setPosition(this.x, 594).setScale(1);
    this.shadow.setVisible(true).setX(this.ex);
    this.backdrop.setTexture(encounter === "midas" ? "midas-mansion-arena-v1" : encounter !== "dylan" ? "medea-mall-arena-v1" : "arena").setDisplaySize(1280, 720);
    this.spirit.setTexture(encounter === "midas" ? "king-midas-combat-v1" : encounter === "golden-dragon" ? "golden-dragon-v2" : encounter === "medea" ? "medea-combat-v1" : "wind-spirit", encounter !== "dylan" ? "0" : undefined).setAlpha(1);
    this.label.setText(encounter === "midas" ? "JASON · RESIST THE GOLD" : encounter === "golden-dragon" ? "THE GOLDEN GUARDIAN" : encounter === "medea" ? "BREAK THE ENCHANTMENT" : "STAND TOGETHER");
    if(encounter==="midas")this.prepareGoldStatues();
    this.goldStatues.forEach(s=>s.setVisible(encounter==="midas"));
    this.flashTimer = 1.6;
    this.warning.setVisible(true).setText("");
    audio.playMusic("combat");
    audio.setStorm(0);
    audio.wind(encounter === "dylan");
    this.renderHero(0);
    this.onUpdate();
  }
  prepareGoldStatues() {
    if(this.goldStatues.length)return;
    const texture=this.textures.get("story-heroes-v1");
    for(const [i,name]of (["piper","leo"] as const).entries()) {
      const r=storyFrames[name].rect;texture.add(`statue-${name}`,0,r[0],r[1],r[2],r[3]);
      const key=ensureGoldTexture(this,"story-heroes-v1");
      // A second added frame also needs registering on an already generated gold sheet.
      if(!this.textures.get(key).getFrameNames().includes(`statue-${name}`))this.textures.get(key).add(`statue-${name}`,0,r[0],r[1],r[2],r[3]);
      const statue=this.add.sprite(i?510:95,560,key,`statue-${name}`).setOrigin(.5,1).setScale(220/r[3]);
      this.children.moveBelow(statue,this.ground);this.goldStatues.push(statue);
    }
  }
  stepGoldBolts(dt: number) {
    const result=advanceGoldBolts(this.goldBolts,dt,{x:this.x,y:this.y,blocking:this.guarding,invulnerable:this.hurt>0});
    this.goldBolts=result.bolts;
    for(const event of result.events) {
      if(event.type==="block") {
        const perfect=this.guardAge<=.18;this.stats.blocks++;if(perfect)this.stats.perfectBlocks++;
        this.meter=Math.min(100,this.meter+(perfect?20:12));this.guardFlash=.3;
        this.impact(this.x,450,0xffe8a1,1);audio.sfx("block");
        this.floating(perfect?"PERFECT GUARD":"GOLD DEFLECTED",this.x,305,"#ffe9ae");
      } else if(event.type==="hit") {
        this.goldHits=goldenHit(this.goldHits);this.health=MIDAS_RULES.hitLimit-this.goldHits;
        this.hurt=MIDAS_RULES.invulnerability;this.streak=0;
        this.burst(this.x,460,0xffdc68,26);this.impact(this.x,460,0xffdc68,1.3);audio.sfx("coin");
        this.floating(`GOLD · ${this.goldHits} / 10`,this.x,305,"#ffde75");
        if(this.goldHits===MIDAS_RULES.hitLimit) {
          this.resolveBattle(false);this.renderHero(0);this.onUpdate();return true;
        }
      }
    }
    return false;
  }
  queue(move: string) {
    if (this.mode !== "battle" || this.pendingResult !== null) return;
    if (move === "rally") { this.rally(); return; }
    this.buffer = move;
    this.bufferAge = 0.22;
  }
  rally() {
    if (this.encounter !== "medea" || this.mode !== "battle" || this.pendingResult !== null || this.rallyCooldown > 0) return;
    this.charm = 0;
    this.rallyCooldown = 8;
    this.rallyFlash = .8;
    this.enemyPhase = "stunned";
    this.enemyTimer = 3;
    this.meter = Math.min(100, this.meter + 15);
    this.health = Math.min(this.heroMaxHealth, this.health + 60);
    this.label.setText("PIPER BREAKS THE SPELL");
    this.flashTimer = 1.5;
    this.warning.setText("TOGETHER · STRIKE NOW");
    this.burst(this.x, 440, 0xffc9ec, 40);
    audio.sfx("charm");
    this.onUpdate();
  }
  pause() {
    if (this.mode === "battle") {
      this.mode = "pause";
      this.keys.clear();
      this.guardHeld = false;
      this.guarding = false;
    }
  }
  resume() {
    if (this.mode === "pause") {
      this.mode = "battle";
      this.keys.clear();
      this.reveal = false;
      if (this.storyTriggered && this.pendingResult === null && this.encounter === "dylan") {
        audio.setStorm(1);
        this.label.setText("HOLD THE LINE");
        this.flashTimer = 1.4;
      }
    }
  }
  burst(x: number, y: number, color: number, count = 20) {
    count = Math.min(this.reduced ? Math.ceil(count / 3) : count, 240 - this.particles.length);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2,
        v = 70 + Math.random() * 300;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.25 + Math.random() * 0.45,
        max: 0.7,
        color,
        size: 2 + Math.random() * 5,
      });
    }
  }
  floating(text: string, x: number, y: number, color = "#f0d9a7") {
    if (this.callouts.length >= 10) this.callouts.shift()?.obj.destroy();
    const obj = this.add
      .text(x, y, text, {
        fontFamily: "Arial",
        fontSize: "19px",
        fontStyle: "bold",
        color,
        stroke: "#091322",
        strokeThickness: 4,
      })
      .setOrigin(0.5).setDepth(9);
    this.callouts.push({ obj, life: 0.9, y });
  }
  clearCallouts() {
    for (const c of this.callouts) c.obj.destroy();
    this.callouts = [];
  }
  impact(x: number, y: number, color: number, power = 1) {
    if (this.impacts.length >= 12) this.impacts.shift();
    this.impacts.push({ x, y, color, power, life: 0.38 });
  }
  resolveBattle(won: boolean) {
    this.pendingResult = won;
    this.finishTimer = won ? 0.72 : this.encounter==="midas" ? 1.8 : 0.45;
    this.goldBolts=[];
    this.keys.clear();
    this.buffer = "";
    this.move = "";
    this.warning.setText("");
    this.label.setText(this.encounter==="midas" ? won?"KING MIDAS YIELDS":"JASON HAS TURNED TO GOLD" : won ? (this.encounter === "golden-dragon" ? "FESTUS IS COMING" : this.encounter === "medea" ? "THE ENCHANTMENT SHATTERS" : "THE WIND RECOILS") : "STAND AGAIN, HERO");
    audio.sfx(won ? "victory" : "defeat");
  }
  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.05);
    if (this.mode !== "pause" || this.reveal) this.clock += dt;
    if (!this.smoke) return;
    if (this.mode === "battle") {
      this.acc += dt;
      while (this.acc >= 1 / 60) {
        this.step(1 / 60);
        this.acc -= 1 / 60;
      }
    }
    this.drawEnemy();
    this.drawEffects(dt);
    if (this.mode !== "scenery") {
      if (this.encounter === "midas") drawMidasAtmosphere(this.weather,this.floorFX,this);
      else if (this.encounter === "golden-dragon") drawGoldenAtmosphere(this.weather, this.floorFX, this);
      else if (this.encounter === "medea") drawMedeaAtmosphere(this.weather, this.floorFX, this);
      else drawStorm(this.weather, this.floorFX, this);
    }
    if (this.mode === "scenery") {
      this.backdrop
        .setX(640 + Math.sin(this.clock * 0.12) * 8)
        .setDisplaySize(1300, 732);
    } else this.backdrop.setX(640);
  }
  step(dt: number) {
    if (this.mode !== "battle") return;
    if (this.pendingResult !== null) {
      this.finishTimer -= dt;
      this.onUpdate();
      if (this.finishTimer <= 0) {
        this.mode = "pause";
        this.onEnd(this.pendingResult);
      }
      return;
    }
    if (this.freeze > 0) {
      this.freeze -= dt;
      return;
    }
    this.elapsed += dt;
    if (this.encounter === "medea") {
      this.rallyCooldown = Math.max(0, this.rallyCooldown - dt);
      this.rallyFlash = Math.max(0, this.rallyFlash - dt);
      this.charm = Math.max(0, this.charm - dt * 2);
    }
    this.storm += ((this.storyTriggered ? 1.8 : 1) - this.storm) * dt * 0.9;
    this.stats.time = Math.floor(this.elapsed);
    this.hurt = Math.max(0, this.hurt - dt);
    this.streakTimer = Math.max(0, this.streakTimer - dt);
    if (this.streakTimer <= 0) this.streak = 0;
    this.bufferAge -= dt;
    if (this.bufferAge <= 0) this.buffer = "";
    this.flashTimer -= dt;
    if (this.flashTimer <= 0) this.label.setText("");
    if (!this.move) this.facing = this.ex > this.x ? 1 : -1;
    const block =
      this.keys.has("s") ||
      this.keys.has("arrowdown") ||
      this.keys.has("shift");
    this.guardAge = block ? (this.guardHeld ? this.guardAge + dt : 0) : 0;
    this.guardHeld = block;
    this.guarding = block && !this.move && this.y >= 580;
    // A connected quick strike can flow into a heavy, then into a special.
    // Each next attack still has its own windup and active hit window.
    if (this.move && this.connected &&
      this.moveTime >= MOVES[this.move as keyof typeof MOVES].windup + MOVES[this.move as keyof typeof MOVES].active &&
      ((this.move === "quick" && this.buffer === "strong") ||
       (this.move === "strong" && this.buffer === "special" && this.meter >= 50))) this.move = "";
    if (this.buffer === "jump" && this.y >= 589 && !this.move) {
      this.vy = -690;
      audio.sfx("jump");
      this.buffer = "";
    }
    if (this.buffer && this.buffer !== "jump" && !this.move && this.hurt <= 0) {
      if (this.buffer !== "special" || this.meter >= 50) {
        this.move = this.buffer;
        this.moveTime = 0;
        this.connected = false;
        if (this.move === "special") {
          this.meter -= 50;
          this.label.setText(HEROES[this.heroIndex].special.toUpperCase());
          this.flashTimer = 0.95;
          audio.sfx(
            this.heroIndex === 0
              ? "lightning"
              : this.heroIndex === 1
                ? "charm"
                : "heavy",
          );
        } else audio.sfx("slash");
        this.buffer = "";
      } else {
        this.floating("BUILD 50 SPIRIT", this.x, 320, "#97bfe8");
        this.buffer = "";
      }
    }
    this.guarding = block && !this.move && this.y >= 580;
    let walk = false;
    if (!this.move && this.hurt <= 0) {
      const dir =
        (this.keys.has("d") || this.keys.has("arrowright") ? 1 : 0) -
        (this.keys.has("a") || this.keys.has("arrowleft") ? 1 : 0);
      this.x += dir * (block ? 115 : this.heroIndex === 1 ? 335 : 295) * dt;
      walk = !!dir;
    }
    this.vy += 1750 * dt;
    this.y += this.vy * dt;
    if (this.y > 590) {
      if (this.vy > 400) {
        this.burst(this.x, 589, 0xbda984, 8);
        audio.sfx("land");
      }
      this.y = 590;
      this.vy = 0;
    }
    if (Math.abs(this.x - this.ex) < 105 && this.y > 450)
      this.x = this.ex - this.facing * 105;
    this.x = Phaser.Math.Clamp(this.x, 65, 1210);
    if (this.move) {
      const m = MOVES[this.move as keyof typeof MOVES];
      this.moveTime += dt;
      if (
        this.moveTime >= m.windup &&
        this.moveTime <= m.windup + m.active &&
        !this.connected
      ) {
        if ((this.ex - this.x) * this.facing > 0 && Math.abs(this.ex - this.x) < m.range && this.y > 370) {
          this.connected = true;
          const counter = this.enemyPhase === "recover" && !this.counterClaimed;
          let damage = attackDamage(
            HEROES[this.heroIndex].id,
            this.move,
            this.streak,
            counter,
          );
          if (this.encounter === "medea") {
            // The ward is weakest after a spell or Piper's rally. It never blocks all damage.
            if (this.enemyPhase === "tell") damage = Math.max(1, Math.round(damage * .65));
            if (this.charm >= 60) damage = Math.max(1, Math.round(damage * .7));
          }
          if (this.encounter === "golden-dragon") damage = Math.min(damage, Math.max(0, this.enemyHealth - this.enemyMaxHealth / 3));
          this.enemyHealth = Math.max(0, this.enemyHealth - damage);
          this.meter = Math.min(100, this.meter + m.meter + (counter ? 8 : 0));
          if (counter) {
            this.stats.counters++;
            this.counterClaimed = true;
            this.floating("COUNTER!", this.ex, 275, "#ffe5a6");
          }
          this.stats.hits++;
          this.streak++;
          this.streakTimer = 1.6;
          this.stats.bestCombo = Math.max(this.stats.bestCombo, this.streak);
          this.stats.damage += damage;
          this.freeze = this.move === "special" ? 0.09 : this.move === "strong" ? 0.07 : 0.035;
          this.enemyRecoil = 0.22;
          this.ex = Phaser.Math.Clamp(
            this.ex + this.facing * (this.move === "strong" ? 45 : 20),
            this.encounter === "golden-dragon" ? 300 : 110,
            this.encounter === "golden-dragon" ? 980 : 1170,
          );
          this.impact(this.ex, this.y - 150, HERO_INK[this.heroIndex], this.move === "special" ? 2 : this.move === "strong" ? 1.4 : 1);
          this.burst(
            this.ex,
            435,
            this.heroIndex === 0
              ? 0xf7d37a
              : this.heroIndex === 1
                ? 0xe3a2d2
                : 0x7be3e8,
            28,
          );
          this.floating(`−${damage}`, this.ex, 315);
          audio.sfx(this.move === "strong" ? "heavy" : "hit");
          if (this.streak >= 3)
            this.floating(`${this.streak} HIT CHAIN`, this.x, 330);
          if (!this.reduced && this.move !== "quick")
            this.cameras.main.shake(90, 0.004);
          if (this.heroIndex === 1 && this.move === "special") {
            this.enemyPhase = "stunned";
            this.enemyTimer = 2.5;
            this.warning.setText(this.encounter === "golden-dragon" ? "THE GEARS FALTER" : this.encounter === "medea" ? "MEDEA'S VOICE FALTERS" : "THE WIND HESITATES");
            if (this.encounter === "medea") this.charm = 0;
          }
          if (
            this.enemyHealth <= this.enemyMaxHealth / 2 &&
            !this.storyTriggered &&
            this.enemyHealth > 0
          ) {
            this.storyTriggered = true;
            // Escalate the fight here; the rescue plays only after victory.
          }
          if (this.enemyHealth <= 0 || (this.encounter === "golden-dragon" && this.enemyHealth <= this.enemyMaxHealth / 3)) {
            this.resolveBattle(true);
            this.onUpdate();
            return;
          }
        }
      }
      if (this.moveTime >= m.windup + m.active + m.recovery) this.move = "";
    }
    this.guarding = block && !this.move && this.y >= 580;
    if(this.encounter==="midas"&&this.stepGoldBolts(dt))return;
    this.enemyTimer -= dt;
    if (this.enemyPhase === "wait") {
      this.warning.setText("");
      if (this.enemyTimer < 0.9) {
        const goal = this.x + this.facing * (this.encounter==="midas"?420:260);
        this.ex += Phaser.Math.Clamp(goal - this.ex, -90 * dt, 90 * dt);
      }
      if (this.enemyTimer <= 0) {
        this.enemyMove = ["low", "sweep", "charge"][this.enemyCycle++ % 3];
        this.enemyPhase = "tell";
        this.enemyTimer = this.encounter==="midas" ? 1.25 : this.encounter === "golden-dragon" ? 1.1 : this.encounter === "medea" ? 1.2 : this.enemyMove === "charge" ? 1.05 : 0.85;
        this.enemyHit = false;
        this.counterClaimed = false;
        this.warning.setText(this.encounter==="midas" ? (this.enemyMove==="low"?"LOW GOLD · JUMP":this.enemyMove==="sweep"?"GOLDEN SHARD · BLOCK":"DOUBLE GOLD · GUARD BOTH SHOTS") : this.encounter === "golden-dragon" ?
          (this.enemyMove === "low" ? "FLOOR FIRE · JUMP" : this.enemyMove === "sweep" ? "GOLDEN CLAWS · HOLD BLOCK" : "GEAR CHARGE · BLOCK, THEN COUNTER") : this.encounter === "medea" ?
          (this.enemyMove === "low" ? "ROLLING POTION · JUMP" : this.enemyMove === "sweep" ? "CRYSTAL FAN · HOLD BLOCK" : "CHARMSPEAK · BLOCK OR Q TO RALLY") :
          this.enemyMove === "low"
            ? "LOW GUST · JUMP"
            : this.enemyMove === "sweep"
              ? "WIND SWEEP · HOLD BLOCK"
              : "CHARGE · BLOCK, THEN COUNTER",
        );
        audio.sfx(this.encounter==="midas" ? "coin" : this.encounter === "golden-dragon" ? this.enemyMove === "low" ? "fire" : "heavy" : this.encounter === "medea" ? "charm" : "gust");
      }
    } else if (this.enemyPhase === "tell" && this.enemyTimer <= 0) {
      this.enemyPhase = "attack";
      if(this.encounter==="midas")this.goldBolts.push(...goldVolley(this.enemyMove,this.ex,this.x));
      this.enemyTimer = this.encounter === "golden-dragon" ? .55 : this.encounter === "medea" ? .6 : this.enemyMove === "charge" ? 0.4 : 0.28;
    } else if (this.enemyPhase === "attack") {
      if(this.encounter!=="midas") {
      if (this.encounter !== "dylan" && this.enemyMove === "low" && this.enemyTimer > .3)
        this.warning.setText(this.encounter === "golden-dragon" ? "FIRE INCOMING · JUMP NOW" : "POTION INCOMING · JUMP NOW");
      if (this.enemyMove === "charge" && this.encounter !== "medea")
        this.ex += (this.x - this.ex) * Math.min(1, dt * 8);
      if (
        !this.enemyHit &&
        (this.encounter === "medea" || (this.encounter === "golden-dragon" && this.enemyMove !== "charge") ? this.enemyTimer <= .3 : (this.enemyMove !== "charge" || Math.abs(this.ex - this.x) < 205))
      ) {
        this.enemyHit = true;
        const fireproof = this.encounter === "golden-dragon" && this.enemyMove === "low" && this.heroIndex === 2;
        const outcome = fireproof ? "evade" : hitOutcome({
          attack: this.enemyMove,
          blocking: this.guarding,
          jumping: this.y < 520,
          distance: this.encounter === "medea" && this.enemyMove === "charge" ? 100 : Math.abs(this.ex - this.x),
        });
        if (outcome === "block") {
          const perfect = this.guardAge <= 0.18;
          this.health = Math.max(1, this.health - (perfect ? 0 : 2));
          this.meter = Math.min(100, this.meter + (perfect ? 20 : 12));
          this.stats.blocks++;
          if (perfect) {
            this.stats.perfectBlocks++;
            this.enemyPhase = "recover";
            this.enemyTimer = 1.3;
            this.freeze = 0.045;
            this.warning.setText("PERFECT GUARD · COUNTER NOW");
          }
          this.guardFlash = perfect ? 0.4 : 0.23;
          this.impact(this.x + this.facing * 50, 450, 0xb3e6f2, perfect ? 1.4 : 0.8);
          audio.sfx("block");
          this.burst(this.x + this.facing * 45, 460, 0x9edbfa, 12);
          this.floating(perfect ? "PERFECT GUARD" : "BLOCK", this.x, 305, "#b0e4fa");
        } else if (outcome === "hit") {
          const dmg = this.encounter === "golden-dragon" ? (this.enemyMove === "charge" ? 36 : 24) : this.enemyMove === "charge" ? 13 : 9;
          this.health = Math.max(0, this.health - dmg);
          if (this.encounter === "medea") this.charm = Math.min(100, this.charm + (this.enemyMove === "charge" ? 75 : 18));
          this.hurt = 0.28;
          this.streak = 0;
          this.x = Phaser.Math.Clamp(this.x - this.facing * 28, 65, 1210);
          audio.sfx("hit");
          this.burst(this.x, 450, 0xc4b19a, 14);
          this.impact(this.x, 450, 0xd0c5b5, 0.8);
          if (!this.reduced) this.cameras.main.shake(80, 0.003);
          if (this.health <= 0) {
            this.resolveBattle(false);
            this.onUpdate();
            return;
          }
        } else if (outcome === "evade") {
          this.meter = Math.min(100, this.meter + 8);
          this.floating(fireproof ? "LEO · FIREPROOF" : "EVADED", this.x, 330, "#b0e4fa");
        }
      }
      }
      if (this.enemyTimer <= 0) {
        this.enemyPhase = "recover";
        this.enemyTimer = 1.3;
        this.warning.setText("COUNTERATTACK");
      }
    } else if (this.enemyPhase === "recover" && this.enemyTimer <= 0) {
      this.enemyPhase = "wait";
      this.enemyTimer = this.storyTriggered ? 0.8 : 1.1;
    } else if (this.enemyPhase === "stunned" && this.enemyTimer <= 0) {
      this.enemyPhase = "wait";
      this.enemyTimer = 0.9;
    }
    this.ex = Phaser.Math.Clamp(this.ex, this.encounter === "midas" ? 240 : this.encounter === "golden-dragon" ? 300 : 110, this.encounter === "midas" ? 1040 : this.encounter === "golden-dragon" ? 980 : 1170);
    let pose = walk ? 1 : 0;
    if (this.y < 580) pose = 2;
    else if (block && !this.move) pose = 3;
    if (this.move) {
      const m = MOVES[this.move as keyof typeof MOVES];
      pose = this.move === "quick" ? 4 : this.moveTime < m.windup ? 5 : 4;
    }
    this.renderHero(pose);
    this.ground.setPosition(this.x, 594).setScale(1 - (590 - this.y) / 700);
    this.shadow.setX(this.ex);
    this.enemy.setPosition(this.ex, 450 + (this.encounter !== "dylan" ? 0 : Math.sin(this.clock * 3) * 6));
    this.onUpdate();
  }
  renderHero(pose: number) {
    if (this.heroIndex === 0 && pose === 0) {
      this.player.setTexture("jason-idle", "jason-idle");
      const targetHeight = this.getRect(0, 0, 1536, 1024).h * 1.08;
      this.player.setScale(targetHeight / this.player.frame.height);
    } else if (pose === 4) {
      this.player.setTexture("strikes", `${HEROES[this.heroIndex].id}-quick`);
      const targetHeight = this.getRect(this.heroIndex, 4, 1536, 1024).h * 1.08;
      this.player.setScale(targetHeight / this.player.frame.height);
    } else if (pose === 1) {
      this.player
        .setTexture(
          "walking",
          `${HEROES[this.heroIndex].id}-walk${Math.floor(this.clock * 9) % 4}`,
        )
        .setScale(0.95);
    } else {
      this.player
        .setTexture("heroes", `${this.heroIndex}-${pose}`)
        .setScale(1.08);
    }
    this.player.setFlipX(this.facing < 0);
    // Anchor an extended thrust at the torso instead of at the weapon tip.
    this.player.setOrigin(pose === 4 ? (this.facing > 0 ? 0.4 : 0.6) : 0.5, 1);
    const m = MOVES[this.move as keyof typeof MOVES];
    const swing = m ? Math.min(1, this.moveTime / m.windup) : 0;
    const followThrough = m ? Math.max(0, 1 - (this.moveTime - m.windup) / (m.active + m.recovery)) : 0;
    const lunge = !m ? 0 : this.moveTime < m.windup ? -5 * swing : 14 * followThrough;
    this.player.setPosition(
      this.x + lunge * this.facing,
      this.y,
    );
    this.player.setAngle(
      this.move
        ? (this.moveTime < (m?.windup ?? 0.12) ? -5 * swing : 6 * followThrough) * this.facing
        : this.hurt > 0 ? -6 * this.facing : 0,
    );
    this.player.setTint(this.hurt > 0 ? 0xffaaa4 : 0xffffff);
    if(this.encounter==="midas")applyGoldCurse(this);
  }
  drawEnemy() {
    if(this.encounter==="midas") {
      this.smoke.clear();
      const pose=this.enemyRecoil>0?3:["tell","attack"].includes(this.enemyPhase)?this.enemyMove==="low"?2:1:0;
      const anchor=midasFrames.king.anchors[pose];
      this.spirit.setTexture("king-midas-combat-v1",String(pose)).setScale(.6).setOrigin(this.ex<this.x?1-anchor:anchor,1).setPosition(0,140).setFlipX(this.ex<this.x).setAlpha(1).setTint(this.enemyRecoil>0?0xffe5a1:0xffffff);
      return;
    }
    if (this.encounter === "golden-dragon") {
      this.smoke.clear();
      const pose = this.enemyRecoil > 0 || this.enemyPhase === "stunned" || this.pendingResult === true ? 3 : ["tell", "attack"].includes(this.enemyPhase) ? this.enemyMove === "low" ? 2 : 1 : this.enemyTimer < .9 ? Math.floor(this.clock * 6) % 2 : 0;
      this.spirit.setTexture("golden-dragon-v2", String(pose)).setScale(.5).setOrigin(this.ex > this.x ? .23 : .77, 1).setPosition(this.enemyRecoil > 0 ? Math.sin(this.enemyRecoil * 42) * 7 : 0, 140).setFlipX(this.ex < this.x).setAlpha(1).setTint(this.enemyRecoil > 0 ? 0xffefb6 : 0xffffff);
      return;
    }
    if (this.encounter === "medea") {
      this.smoke.clear();
      const pose = this.enemyRecoil > 0 || this.enemyPhase === "stunned" ? 3 : ["tell", "attack"].includes(this.enemyPhase) ? this.enemyMove === "charge" ? 2 : 1 : 0;
      const anchor = pose === 0 ? .42 : pose === 1 ? .38 : .5;
      this.spirit.setTexture("medea-combat-v1", String(pose)).setScale(.43).setOrigin(this.ex > this.x ? 1-anchor : anchor, 1).setPosition(this.enemyRecoil > 0 ? Math.sin(this.enemyRecoil * 42) * 8 : 0, 140).setFlipX(this.ex > this.x).setAlpha(this.pendingResult === true ? Math.max(0, this.finishTimer / .72) : 1).setTint(this.enemyRecoil > 0 ? 0xffe4fa : 0xffffff);
      return;
    }
    drawSpirit(this.smoke, this);
    const disperse = this.pendingResult === true ? Math.min(1, Math.max(0, 1 - this.finishTimer / 0.72)) : 0;
    const breath = this.reduced ? 1 : 1 + Math.sin(this.clock * 3) * 0.018;
    const coil = this.enemyPhase === "tell" ? 0.94 : 1;
    this.spirit.setOrigin(.5, 1).setDisplaySize(272 * breath / coil * (1 + disperse * 0.4), 408 * coil);
    this.spirit.setPosition(this.enemyRecoil > 0 ? -this.facing * Math.sin(this.enemyRecoil * 42) * 8 : 0, 150 - disperse * 140);
    this.spirit.setFlipX(this.ex < this.x).setAlpha(1 - disperse);
    this.spirit.setTint(this.enemyRecoil > 0 ? 0xe3dbbc : this.enemyPhase === "stunned" ? 0xe7bde7 : 0xffffff);
  }
  drawEffects(dt: number) {
    const g = this.effects;
    g.clear();
    const visualDt = this.mode === "pause" ? 0 : dt;
    this.enemyRecoil = Math.max(0, this.enemyRecoil - visualDt);
    this.guardFlash = Math.max(0, this.guardFlash - visualDt);
    for (const c of this.callouts) {
      c.life -= visualDt;
      c.obj.setY(c.y - (0.9 - c.life) * (this.reduced ? 12 : 48));
      c.obj.setAlpha(Math.min(1, Math.max(0, c.life / 0.3)));
      if (c.life <= 0) c.obj.destroy();
    }
    this.callouts = this.callouts.filter(c => c.life > 0);
    for (const p of this.particles) {
      p.life -= visualDt;
      p.x += p.vx * visualDt;
      p.y += p.vy * visualDt;
      p.vy += 220 * visualDt;
      g.fillStyle(p.color, Math.max(0, p.life / p.max));
      g.fillRect(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2, p.size, p.size);
    }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const hit of this.impacts) {
      hit.life -= visualDt;
      const p = 1 - hit.life / 0.38;
      const a = Math.max(0, 1 - p);
      const r = (14 + p * (this.reduced ? 30 : 75)) * hit.power;
      g.lineStyle(3 * a + 1, hit.color, a * 0.8);
      g.strokeEllipse(hit.x, hit.y, r * 2, r * 1.2);
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        g.lineStyle(i % 2 ? 2 : 4, hit.color, a);
        g.beginPath();
        g.moveTo(hit.x + Math.cos(angle) * r * 0.5, hit.y + Math.sin(angle) * r * 0.4);
        g.lineTo(hit.x + Math.cos(angle) * r, hit.y + Math.sin(angle) * r * 0.8);
        g.strokePath();
      }
      if (p < 0.22) {
        g.fillStyle(0xfff5d7, (1 - p / 0.22) * 0.9);
        g.fillRect(hit.x - 6, hit.y - 6, 12, 12);
      }
    }
    this.impacts = this.impacts.filter(h => h.life > 0);
    if (this.mode === "scenery") return;
    const m = MOVES[this.move as keyof typeof MOVES];
    drawMove(g, this, m?.windup ?? 0, m?.active ?? 1);
    if (this.pendingResult === null) {
      if (this.encounter === "midas") drawMidasBolts(g,this);
      else if (this.encounter === "golden-dragon") drawGoldenAttack(g, this);
      else if (this.encounter === "medea") drawMedeaSpell(g, this);
      else drawGust(g, this);
    }
  }
}
