import Phaser from "phaser";
import { audio, AUDIO_FILES } from "./audio";
import { HEROES, MOVES, attackDamage, hitOutcome } from "./combat-model.mjs";
export type BattleStats = {
  hits: number;
  blocks: number;
  combo: number;
  bestCombo: number;
  time: number;
  damage: number;
};
type Mode = "scenery" | "battle" | "pause";
export class OlympusScene extends Phaser.Scene {
  mode: Mode = "scenery";
  heroIndex = 0;
  player!: Phaser.GameObjects.Sprite;
  enemy!: Phaser.GameObjects.Container;
  smoke!: Phaser.GameObjects.Graphics;
  effects!: Phaser.GameObjects.Graphics;
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
  health = 100;
  enemyHealth = 160;
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
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  stats: BattleStats = {
    hits: 0,
    blocks: 0,
    combo: 0,
    bestCombo: 0,
    time: 0,
    damage: 0,
  };
  onUpdate: () => void = () => {};
  onStory: () => void = () => {};
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
    this.load.image("heroes", "/assets/art/heroes.png");
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
    this.ground = this.add.ellipse(300, 593, 150, 24, 0x050b12, 0.48);
    this.shadow = this.add.ellipse(950, 597, 155, 24, 0x050b12, 0.5);
    this.atlas = this.cache.json.get("frames");
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
    this.smoke = this.add.graphics();
    this.enemy.add(this.smoke);
    this.effects = this.add.graphics();
    this.label = this.add
      .text(640, 300, "", {
        fontFamily: "Georgia",
        fontSize: "48px",
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
    this.enemy?.setVisible(false);
    this.shadow?.setVisible(false);
    this.ground?.setVisible(false);
    this.label?.setText("");
    this.warning?.setVisible(false);
    this.particles = [];
    this.effects?.clear();
    if (this.textures.exists("title"))
      this.backdrop?.setTexture("title").setDisplaySize(1280, 720);
  }
  startFight(hero: number) {
    this.heroIndex = hero;
    this.mode = "battle";
    this.x = 300;
    this.y = 590;
    this.vy = 0;
    this.ex = 950;
    this.health = 100;
    this.enemyHealth = 160;
    this.meter = 35;
    this.move = "";
    this.moveTime = 0;
    this.connected = false;
    this.facing = 1;
    this.acc = 0;
    this.streak = 0;
    this.streakTimer = 0;
    this.enemyHit = false;
    this.bufferAge = 0;
    this.hurt = 0;
    this.enemyTimer = 2.8;
    this.enemyPhase = "wait";
    this.elapsed = 0;
    this.freeze = 0;
    this.storyTriggered = false;
    this.particles = [];
    this.keys.clear();
    this.buffer = "";
    this.stats = {
      hits: 0,
      blocks: 0,
      combo: 0,
      bestCombo: 0,
      time: 0,
      damage: 0,
    };
    this.player.setVisible(true).clearTint();
    this.enemy.setVisible(true);
    this.ground.setVisible(true);
    this.shadow.setVisible(true);
    this.backdrop.setTexture("arena").setDisplaySize(1280, 720);
    this.label.setText("STAND TOGETHER");
    this.flashTimer = 1.6;
    this.warning.setVisible(true).setText("");
    audio.playMusic("combat");
    audio.wind();
    this.renderHero(0);
    this.onUpdate();
  }
  queue(move: string) {
    if (this.mode !== "battle") return;
    this.buffer = move;
    this.bufferAge = 0.22;
  }
  pause() {
    if (this.mode === "battle") {
      this.mode = "pause";
      this.keys.clear();
    }
  }
  resume() {
    if (this.mode === "pause") {
      this.mode = "battle";
      this.keys.clear();
    }
  }
  burst(x: number, y: number, color: number, count = 20) {
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
    const obj = this.add
      .text(x, y, text, {
        fontFamily: "Arial",
        fontSize: "19px",
        fontStyle: "bold",
        color,
        stroke: "#091322",
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: obj,
      y: y - 60,
      alpha: 0,
      duration: 900,
      onComplete: () => obj.destroy(),
    });
  }
  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.05);
    this.clock += dt;
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
    if (this.mode === "scenery") {
      this.backdrop
        .setX(640 + Math.sin(this.clock * 0.12) * 8)
        .setDisplaySize(1300, 732);
    } else this.backdrop.setX(640);
  }
  step(dt: number) {
    if (this.mode !== "battle") return;
    if (this.freeze > 0) {
      this.freeze -= dt;
      return;
    }
    this.elapsed += dt;
    this.stats.time = Math.floor(this.elapsed);
    this.hurt = Math.max(0, this.hurt - dt);
    this.streakTimer -= dt;
    if (this.streakTimer <= 0) this.streak = 0;
    this.bufferAge -= dt;
    if (this.bufferAge <= 0) this.buffer = "";
    this.flashTimer -= dt;
    if (this.flashTimer <= 0) this.label.setText("");
    this.facing = this.ex > this.x ? 1 : -1;
    const block =
      this.keys.has("s") ||
      this.keys.has("arrowdown") ||
      this.keys.has("shift");
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
    this.x = Phaser.Math.Clamp(this.x, 65, 1210);
    if (Math.abs(this.x - this.ex) < 105 && this.y > 450)
      this.x = this.ex - this.facing * 105;
    if (this.move) {
      const m = MOVES[this.move as keyof typeof MOVES];
      this.moveTime += dt;
      if (
        this.moveTime >= m.windup &&
        this.moveTime <= m.windup + m.active &&
        !this.connected
      ) {
        if (Math.abs(this.ex - this.x) < m.range && this.y > 370) {
          this.connected = true;
          const damage = attackDamage(
            HEROES[this.heroIndex].id,
            this.move,
            this.streak,
          );
          this.enemyHealth = Math.max(0, this.enemyHealth - damage);
          this.meter = Math.min(100, this.meter + m.meter);
          this.stats.hits++;
          this.streak++;
          this.streakTimer = 1.6;
          this.stats.bestCombo = Math.max(this.stats.bestCombo, this.streak);
          this.stats.damage += damage;
          this.freeze = this.move === "strong" ? 0.055 : 0.025;
          this.ex = Phaser.Math.Clamp(
            this.ex + this.facing * (this.move === "strong" ? 45 : 20),
            110,
            1170,
          );
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
            this.enemyPhase = "wait";
            this.enemyTimer = 2.5;
            this.warning.setText("THE WIND HESITATES");
          }
          if (
            this.enemyHealth <= 80 &&
            !this.storyTriggered &&
            this.enemyHealth > 0
          ) {
            this.storyTriggered = true;
            this.mode = "pause";
            this.keys.clear();
            this.onStory();
            return;
          }
          if (this.enemyHealth <= 0) {
            this.mode = "pause";
            audio.sfx("victory");
            this.onEnd(true);
            return;
          }
        }
      }
      if (this.moveTime >= m.windup + m.active + m.recovery) this.move = "";
    }
    this.enemyTimer -= dt;
    if (this.enemyPhase === "wait") {
      this.warning.setText("");
      if (this.enemyTimer < 0.9) {
        const goal = this.x + this.facing * 260;
        this.ex += Phaser.Math.Clamp(goal - this.ex, -90 * dt, 90 * dt);
      }
      if (this.enemyTimer <= 0) {
        this.enemyMove = ["low", "sweep", "charge"][
          Math.floor(this.elapsed / 2.1) % 3
        ];
        this.enemyPhase = "tell";
        this.enemyTimer = this.enemyMove === "charge" ? 1.05 : 0.85;
        this.enemyHit = false;
        this.warning.setText(
          this.enemyMove === "low"
            ? "LOW GUST · JUMP"
            : this.enemyMove === "sweep"
              ? "WIND SWEEP · HOLD BLOCK"
              : "CHARGE · BLOCK, THEN COUNTER",
        );
        audio.sfx("gust");
      }
    } else if (this.enemyPhase === "tell" && this.enemyTimer <= 0) {
      this.enemyPhase = "attack";
      this.enemyTimer = this.enemyMove === "charge" ? 0.4 : 0.28;
    } else if (this.enemyPhase === "attack") {
      if (this.enemyMove === "charge")
        this.ex += (this.x - this.ex) * Math.min(1, dt * 8);
      if (
        !this.enemyHit &&
        (this.enemyMove !== "charge" || Math.abs(this.ex - this.x) < 205)
      ) {
        this.enemyHit = true;
        const outcome = hitOutcome({
          attack: this.enemyMove,
          blocking: block && !this.move,
          jumping: this.y < 520,
          distance: Math.abs(this.ex - this.x),
        });
        if (outcome === "block") {
          this.health = Math.max(1, this.health - 2);
          this.meter = Math.min(100, this.meter + 12);
          this.stats.blocks++;
          audio.sfx("block");
          this.burst(this.x + this.facing * 45, 460, 0x9edbfa, 12);
          this.floating("BLOCK", this.x, 330, "#b0e4fa");
        } else if (outcome === "hit") {
          const dmg = this.enemyMove === "charge" ? 13 : 9;
          this.health = Math.max(0, this.health - dmg);
          this.hurt = 0.28;
          this.streak = 0;
          this.x -= this.facing * 28;
          audio.sfx("hit");
          this.burst(this.x, 450, 0xc4b19a, 14);
          if (!this.reduced) this.cameras.main.shake(80, 0.003);
          if (this.health <= 0) {
            this.mode = "pause";
            audio.sfx("defeat");
            this.onEnd(false);
            return;
          }
        } else if (outcome === "evade") {
          this.meter = Math.min(100, this.meter + 8);
          this.floating("EVADED", this.x, 330, "#b0e4fa");
        }
      }
      if (this.enemyTimer <= 0) {
        this.enemyPhase = "recover";
        this.enemyTimer = 1.3;
        this.warning.setText("COUNTERATTACK");
      }
    } else if (this.enemyPhase === "recover" && this.enemyTimer <= 0) {
      this.enemyPhase = "wait";
      this.enemyTimer = 1.1;
    }
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
    this.enemy.setPosition(this.ex, 450 + Math.sin(this.clock * 3) * 6);
    this.onUpdate();
  }
  renderHero(pose: number) {
    if (pose === 1) {
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
    this.player.setOrigin(pose === 4 ? (this.facing > 0 ? 0.32 : 0.68) : 0.5, 1);
    this.player.setPosition(
      this.x,
      this.y +
        (pose === 0
          ? Math.sin(this.clock * 3) * 2
          : pose === 1
            ? Math.sin(this.clock * 16) * 5
            : 0),
    );
    this.player.setAngle(
      this.move
        ? (this.moveTime < 0.12 ? -7 : Math.max(0, 8 - this.moveTime * 15)) *
            this.facing
        : 0,
    );
    this.player.setTint(this.hurt > 0 ? 0xffaaa4 : 0xffffff);
  }
  drawEnemy() {
    const g = this.smoke,
      t = this.clock;
    g.clear();
    const angry = this.enemyPhase === "tell";
    for (let i = 0; i < 28; i++) {
      const y = -120 + i * 9;
      const w = 145 - i * 3.5;
      const x = Math.sin(t * 4 + i * 0.65) * (15 + i * 0.4);
      g.fillStyle(i % 3 === 0 ? 0x536776 : 0x243744, 0.72);
      g.fillEllipse(x, y, w, 31);
      g.lineStyle(2, angry ? 0xa5c4cd : 0x728896, 0.35);
      g.beginPath();
      g.arc(x, y, w / 2, t * 3 + i * 0.2, t * 3 + i * 0.2 + 1.9);
      g.strokePath();
    }
    g.fillStyle(0x0b1822, 0.92);
    g.fillEllipse(2, -93, 94, 64);
    g.fillStyle(0xd8dfba, 1);
    g.fillTriangle(-30, -105, -7, -99, -15, -91);
    g.fillTriangle(10, -99, 32, -107, 23, -92);
    g.lineStyle(3, 0xa6b9b5, 0.9);
    g.beginPath();
    g.moveTo(-20, -72);
    g.lineTo(-9, -78);
    g.lineTo(0, -72);
    g.lineTo(10, -78);
    g.lineTo(22, -73);
    g.strokePath();
    for (let i = 0; i < 8; i++) {
      const a = t * 2 + i * 0.8;
      g.fillStyle(0xa3afb1, 0.35);
      g.fillRect(Math.cos(a) * (60 + i * 7), Math.sin(a) * 75 - 15, 9, 3);
    }
    if (this.enemyPhase === "recover") {
      g.lineStyle(2, 0xe3c589, 0.6);
      g.strokeCircle(0, -100, 62);
    }
  }
  drawEffects(dt: number) {
    const g = this.effects;
    g.clear();
    for (const p of this.particles) {
      const particleDt = this.mode === "pause" ? 0 : dt;
      p.life -= particleDt;
      p.x += p.vx * particleDt;
      p.y += p.vy * particleDt;
      p.vy += 220 * particleDt;
      g.fillStyle(p.color, Math.max(0, p.life / p.max));
      g.fillRect(p.x, p.y, p.size, p.size);
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    if (this.mode === "scenery") return;
    if (this.move) {
      const m = MOVES[this.move as keyof typeof MOVES];
      if (this.moveTime >= m.windup && this.moveTime <= m.windup + m.active) {
        const color =
          this.heroIndex === 0
            ? 0xffdf87
            : this.heroIndex === 1
              ? 0xe8b0dd
              : 0x80e5ed;
        const power = this.move === "special";
        g.lineStyle(power ? 7 : 4, color, 0.8);
        const sx = this.x + this.facing * 50;
        g.beginPath();
        g.arc(
          sx,
          445,
          power ? 180 : 105,
          this.facing > 0 ? -1.1 : 2,
          this.facing > 0 ? 1.1 : 4.2,
        );
        g.strokePath();
        if (power && this.heroIndex === 0) {
          g.lineStyle(8, 0xffe4a2, 0.9);
          g.beginPath();
          g.moveTo(this.x, 410);
          g.lineTo(this.ex, 420);
          g.strokePath();
        }
        if (power && this.heroIndex === 2) {
          g.fillStyle(0x7be3e8, 0.9);
          g.fillCircle(this.ex, 445, 22);
          g.lineStyle(3, 0xffffff, 0.7);
          g.strokeCircle(this.ex, 445, 35);
        }
        if (power && this.heroIndex === 1) {
          for (let i = 0; i < 4; i++) {
            g.lineStyle(2, color, 0.5 - i * 0.1);
            g.strokeEllipse(
              this.x + this.facing * (100 + i * 90),
              445,
              60 + i * 35,
              110 + i * 24,
            );
          }
        }
      }
    }
    if (this.enemyPhase === "attack") {
      const y = this.enemyMove === "low" ? 570 : 460;
      for (let i = 0; i < 9; i++) {
        g.lineStyle(2, 0xc8d6d7, 0.35);
        g.beginPath();
        g.moveTo(this.ex, y + i * 6);
        g.lineTo(this.x - 70 + Math.sin(i) * 50, y + i * 6 - 10);
        g.strokePath();
      }
    }
  }
}
