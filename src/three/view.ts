import * as T from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createFighter, poseFighter } from "./fighters";
import { createWorld, animateWorld } from "./world";
import { createStorm } from "./storm";
import { createEffects } from "./effects";
import { disposeTree, mat } from "./geometry";
import { worldX, worldY, type BattleView, type Stage } from "./types";
import type { Beat } from "../story";

export type Quality = "cinematic" | "performance";
/** The Three.js view consumes the same fixed-step combat state as the pixel renderer. */
export class Olympus3D {
  readonly scene = new T.Scene();
  readonly camera = new T.PerspectiveCamera(42, 16 / 9, .1, 240);
  readonly renderer: T.WebGLRenderer;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private environment: T.WebGLRenderTarget;
  readonly world = createWorld();
  readonly fighters = [0, 1, 2, 3].map(createFighter);
  readonly storm = createStorm();
  readonly effects = createEffects();
  private coin = new T.Mesh(new T.CylinderGeometry(.16, .16, .025, 32), mat(0xe2c06d, .2, .85));
  private observer: ResizeObserver;
  private announcement = document.createElement("div");
  private banner = document.createElement("strong");
  private warning = document.createElement("span");
  private callouts: HTMLSpanElement[] = [];
  private cameraTarget = new T.Vector3();
  private lookTarget = new T.Vector3(0, 1.7, 0);
  private desiredLook = new T.Vector3();
  private projection = new T.Vector3();
  private active = false;
  private stage: Stage = "title";
  private hero = 0;
  private beat?: Beat;
  private time = 0;
  private stageTime = 0;
  private snapCamera = true;
  private width = 1280;
  private height = 720;
  private disposed = false;
  private slowFrames = 0;
  private quality: Quality;
  private autoQuality: boolean;
  private lost = (event: Event) => { event.preventDefault(); if (this.active) this.onFailure("The 3D graphics context was interrupted. Your game continues in 2D."); };
  constructor(private host: HTMLElement, private onFailure: (message: string) => void) {
    this.renderer = new T.WebGLRenderer({ antialias: true, powerPreference: "high-performance", alpha: false });
    this.renderer.domElement.setAttribute("aria-label", "Three-dimensional game arena");
    this.renderer.domElement.addEventListener("webglcontextlost", this.lost);
    this.renderer.setClearColor(0x080e18);
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    const studio = new RoomEnvironment(), pmrem = new T.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(studio, .04);
    this.scene.environment = this.environment.texture;
    this.scene.environmentIntensity = .55;
    studio.dispose(); pmrem.dispose();
    this.scene.fog = new T.FogExp2(0x282e3c, .013);
    this.scene.add(this.world.root, this.storm.root, this.effects.root, this.coin);
    this.fighters.forEach(f => this.scene.add(f.root));
    this.camera.position.set(0, 4.4, 16);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new T.Vector2(1280, 720), .35, .5, 1.05);
    this.composer.addPass(this.bloom); this.composer.addPass(new OutputPass());
    const saved = localStorage.getItem("olympus-3d-quality");
    this.autoQuality = saved !== "cinematic" && saved !== "performance";
    this.quality = saved === "performance" || (this.autoQuality && matchMedia("(pointer: coarse)").matches) ? "performance" : "cinematic";
    this.announcement.className = "three-announcements";
    this.announcement.setAttribute("aria-hidden", "true");
    this.announcement.append(this.banner, this.warning);
    for (let i = 0; i < 10; i++) {
      const span = document.createElement("span"); span.className = "three-callout"; this.callouts.push(span); this.announcement.append(span);
    }
    this.host.append(this.renderer.domElement, this.announcement);
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host);
    this.applyQuality(); this.resize();
  }
  async prepare() {
    // Compile both sets while the loading message is visible, before controls unlock.
    this.world.bus.visible = true;
    await this.renderer.compileAsync(this.scene, this.camera);
    this.world.bus.visible = false;
  }
  setEnabled(enabled: boolean) {
    this.active = enabled; this.host.hidden = !enabled;
    if (enabled) { this.snapCamera = true; this.resize(); }
  }
  get enabled() { return this.active; }
  get qualityName() { return this.quality; }
  toggleQuality() {
    this.quality = this.quality === "cinematic" ? "performance" : "cinematic";
    this.autoQuality = false; localStorage.setItem("olympus-3d-quality", this.quality);
    this.applyQuality();
  }
  private applyQuality() {
    const performance = this.quality === "performance";
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, performance ? 1 : 1.6));
    this.renderer.shadowMap.enabled = !performance;
    this.bloom.enabled = !performance;
    this.resize();
  }
  setStage(stage: string, hero = 0, beat?: Beat) {
    if (stage === "story" && !beat) return;
    const next = (beat?.scene || stage) as Stage;
    if (next !== this.stage) { this.stageTime = 0; this.snapCamera = next === "battle" || next === "bus"; }
    this.stage = next; this.hero = hero; this.beat = beat;
  }
  resize() {
    if (this.disposed) return;
    const rect = this.host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.width = Math.floor(Math.min(rect.width, rect.height * 16 / 9)); this.height = Math.floor(this.width * 9 / 16);
    this.renderer.setSize(this.width, this.height);
    this.composer.setPixelRatio(this.renderer.getPixelRatio()); this.composer.setSize(this.width, this.height);
    this.announcement.style.width = `${this.width}px`; this.announcement.style.height = `${this.height}px`;
  }
  update(s: BattleView, dt: number) {
    if (!this.active || this.disposed || document.hidden) return;
    // Combat poses use simulation attack time; pause freezes the atmosphere too.
    const fight = ["battle", "pause", "defeat"].includes(this.stage);
    if (!fight || s.mode === "battle") { this.time += dt; this.stageTime += dt; }
    const t = fight ? s.clock : this.time, reduced = s.reduced;
    const activeFight = this.stage === "battle";
    this.world.bus.visible = this.stage === "bus";
    this.world.museum.visible = !this.world.bus.visible;
    this.coin.visible = false;
    this.effects.root.visible = fight;
    this.storm.root.visible = fight || this.stage === "reveal" || this.stage === "rescue";
    this.fighters.forEach(f => { f.root.visible = false; f.root.scale.setScalar(f.id === 3 ? .88 : 1); f.root.rotation.set(0, 0, 0); f.weapon.visible = true; });
    animateWorld(this.world, t, fight ? s.storm : 1, reduced);
    if (fight) {
      const f = this.fighters[s.heroIndex]; f.root.visible = true; f.root.position.set(worldX(s.x), worldY(s.y), 0);
      poseFighter(f, t, s);
      this.storm.root.position.set(worldX(s.ex), 0, 0); this.storm.update(t, s, reduced);
      this.effects.update(s);
      const center = (worldX(s.x) + worldX(s.ex)) * .5;
      const span = Math.abs(worldX(s.x) - worldX(s.ex));
      const distance = T.MathUtils.clamp(10.3 + span * .53, 12, 17.8);
      this.cameraTarget.set(center * .62, 4.1 + span * .06, distance);
      this.desiredLook.set(center * .65, 1.8, 0);
      if (!reduced && s.enemyRecoil > 0 && s.move !== "quick") {
        this.cameraTarget.x += Math.sin(t * 95) * s.enemyRecoil * .16;
        this.cameraTarget.y += Math.cos(t * 80) * s.enemyRecoil * .1;
      }
    } else this.stageScene(t, s);
    const blend = this.snapCamera || reduced ? 1 : 1 - Math.exp(-dt * (fight ? 5 : 2.2));
    this.camera.position.lerp(this.cameraTarget, blend); this.lookTarget.lerp(this.desiredLook, blend);
    this.camera.lookAt(this.lookTarget); this.camera.updateMatrixWorld(); this.snapCamera = false;
    this.announcement.hidden = !activeFight;
    if (activeFight) {
      this.banner.textContent = s.label.text; this.warning.textContent = s.warning.text;
      this.warning.hidden = !s.warning.text;
      this.callouts.forEach((el, i) => {
        const c = s.callouts[i]; el.hidden = !c;
        if (!c) return;
        this.projection.set(worldX(c.obj.x), worldY(c.y) + (.9 - c.life) * .6, .5).project(this.camera);
        el.textContent = c.obj.text;
        el.style.left = `${(this.projection.x * .5 + .5) * 100}%`; el.style.top = `${(-this.projection.y * .5 + .5) * 100}%`;
        el.style.opacity = `${Math.min(1, Math.max(0, c.life / .3))}`;
      });
    }
    this.composer.render();
    // A sustained slow GPU falls back to a lighter preset, never changing combat speed.
    if (this.autoQuality && this.quality === "cinematic" && activeFight) {
      this.slowFrames = dt > .032 ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 2);
      if (this.slowFrames > 150) { this.quality = "performance"; this.applyQuality(); }
    }
  }
  private stageScene(t: number, s: BattleView) {
    const names = ["Jason", "Piper", "Leo", "Coach Hedge"], speaking = names.indexOf(this.beat?.speaker || "");
    const trio = this.fighters.slice(0, 3);
    if (this.stage === "bus") {
      trio.forEach((f, i) => {
        f.root.visible = true; f.weapon.visible = false;
        f.root.position.set([-1.05, -2.05, 1.55][i], -.48, [1.8,1.8,1.8][i]);
        f.root.rotation.y = [.22,.25,-.45][i]; poseFighter(f, t, undefined, true, speaking === i);
      });
      const coach = this.fighters[3]; coach.root.visible = true; coach.root.position.set(.2, 0, -4); coach.weapon.visible = false; poseFighter(coach, t, undefined, false, speaking === 3);
      this.cameraTarget.set(6.8, 3.8, 8.5); this.desiredLook.set(-.1, 1.5, .6);
      return;
    }
    if (this.stage === "reveal") {
      const j = this.fighters[0]; j.root.visible = true; j.root.position.set(-3.5, 0, 0); j.root.rotation.y = 1;
      poseFighter(j, t); j.weapon.visible = this.beat?.effect === "sword";
      trio.slice(1).forEach((f, i) => { f.root.visible = true; f.root.position.set(-5.2 - i * 1.1, 0, -.6); f.root.rotation.y = .65; f.weapon.visible = false; poseFighter(f, t); });
      this.storm.root.position.set(3.1, 0, 0); this.storm.update(t, undefined, s.reduced);
      if (this.beat?.effect === "coin") {
        j.arms[0].rotation.x = -1.3; j.elbows[0].rotation.x = -.6;
        this.coin.visible = true; this.coin.position.set(-2.95, 2.15 + Math.abs(Math.sin(this.stageTime * 2)) * .55, .35); this.coin.rotation.set(Math.PI / 2, t * 5, t * 2);
      }
      if (j.weapon.visible) { j.arms[1].rotation.x = -1.1; j.elbows[1].rotation.x = -.7; }
      this.cameraTarget.set(-.7, 3.7, 14.4); this.desiredLook.set(-.4, 2, 0);
      return;
    }
    if (this.stage === "rescue") {
      const carried = this.beat?.speaker === "Leo";
      trio.forEach((f, i) => { f.root.visible = true; f.weapon.visible = false; poseFighter(f, t); f.root.position.set([-1.3,-.2,-4][i], i < 2 && !carried ? 1.2 + Math.sin(t * 1.5) * .12 : 0, i === 2 ? 0 : -1.8); });
      if (!carried) {
        this.fighters[0].root.rotation.z = -.18; this.fighters[0].arms[1].rotation.z = -1.1;
        this.fighters[1].root.rotation.z = -.4; this.fighters[1].arms[0].rotation.z = -.95;
      }
      const coach = this.fighters[3]; coach.root.visible = true; poseFighter(coach, t);
      coach.root.position.set(4.1, carried ? 1.7 + Math.sin(t * 2) * .2 : .1, -.9); coach.root.rotation.z = carried ? .5 : -.1;
      this.storm.root.position.set(carried ? 4.5 : 5.5, carried ? 1 : 0, -1.1); this.storm.update(t, undefined, s.reduced);
      this.cameraTarget.set(1.5, 4.4, 15); this.desiredLook.set(0, 2, -1);
      return;
    }
    const menu = ["title", "books", "select", "complete", "prophecy"].includes(this.stage);
    trio.forEach((f, i) => {
      f.root.visible = this.stage !== "prophecy";
      f.root.position.set(this.stage === "title" ? 2.4 + i * 1.35 : menu ? (i - 1) * 2.1 : (i - 1) * 1.9, 0, this.stage === "title" ? 1 - i * .6 : menu ? -.3 : -1);
      f.root.rotation.y = menu ? -.12 : (i - 1) * -.25;
      f.weapon.visible = menu;
      poseFighter(f, t, undefined, false, speaking === i);
    });
    if (this.stage === "museum") {
      const coach = this.fighters[3]; coach.root.visible = true; coach.root.position.set(3.5, 0, -1); coach.root.rotation.y = -.6; poseFighter(coach, t, undefined, false, speaking === 3);
    }
    if (menu) { this.cameraTarget.set(s.reduced ? 0 : Math.sin(t * .08) * .4, 3.9, this.stage === "title" ? 12.5 : 15.7); this.desiredLook.set(0, 1.5, -1); }
    else { this.cameraTarget.set(4 + (s.reduced ? 0 : Math.sin(t * .1) * .4), 3.8, 12); this.desiredLook.set(.2, 1.7, -1); }
  }
  diagnostics() {
    return { quality: this.quality, stage: this.stage, drawCalls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, geometries: this.renderer.info.memory.geometries };
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.active = false; this.observer.disconnect();
    this.renderer.domElement.removeEventListener("webglcontextlost", this.lost);
    disposeTree(this.scene); this.environment.dispose();
    this.composer.passes.forEach(pass => pass.dispose()); this.composer.dispose(); this.renderer.dispose(); this.host.replaceChildren();
  }
}
