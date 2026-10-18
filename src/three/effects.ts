import * as T from "three";
import { worldX, worldY, heroColors, type BattleView } from "./types";
import { MOVES } from "../combat-model.mjs";

const glowMaterial = (color: number, opacity = 1) => new T.MeshBasicMaterial({color: new T.Color(color).multiplyScalar(1.6), transparent: true, opacity, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
export function createEffects() {
  const root = new T.Group(), action = new T.Group(); root.add(action);
  const sparks = new T.InstancedMesh(new T.SphereGeometry(.025, 5, 4), new T.MeshBasicMaterial({color: 0xffffff, toneMapped: false}), 240);
  sparks.instanceMatrix.setUsage(T.DynamicDrawUsage); sparks.frustumCulled = false; root.add(sparks);
  const rings = Array.from({length: 12}, () => {
    const m = new T.Mesh(new T.TorusGeometry(1, .016, 5, 48), glowMaterial(0xffd17a)); root.add(m); return m;
  });
  const slash = new T.Mesh(new T.RingGeometry(.9, 1.04, 48, 1, -.9, 2.1), glowMaterial(0xffd17a, .7)); action.add(slash);
  const slashCore = new T.Mesh(new T.RingGeometry(1.01, 1.035, 48, 1, -.9, 2.1), glowMaterial(0xfff1cd)); action.add(slashCore);
  const shield = new T.Mesh(new T.SphereGeometry(.9, 24, 16, 0, Math.PI), glowMaterial(0x83cced, .13)); root.add(shield);
  const shieldRing = new T.Mesh(new T.TorusGeometry(.87, .018, 6, 48), glowMaterial(0x83cced, .65)); root.add(shieldRing);
  const warning = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({color: 0xd5b373, transparent: true, opacity: .12, depthWrite: false, side: T.DoubleSide})); warning.rotation.x = -Math.PI / 2; root.add(warning);
  const warningEdges: T.Mesh[] = [];
  for (let i = 0; i < 9; i++) {
    const shape = new T.Shape(); shape.moveTo(-.16,-.2); shape.lineTo(.14,0); shape.lineTo(-.16,.2); shape.lineTo(-.08,0); shape.closePath();
    const m = new T.Mesh(new T.ShapeGeometry(shape), glowMaterial(0xd5b373, .75)); m.rotation.x = -Math.PI / 2; root.add(m); warningEdges.push(m);
  }
  const waves = Array.from({length: 6}, () => {
    const m = new T.Mesh(new T.TorusGeometry(1, .024, 6, 56), glowMaterial(0xf1a4df)); root.add(m); return m;
  });
  const gusts = Array.from({length: 8}, (_, i) => {
    const pts = Array.from({length: 35}, (_, j) => new T.Vector3(j / 34 * 11, Math.sin(j * .42 + i) * .13, Math.cos(j * .33 + i) * .17));
    const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, .012 + i % 3 * .006, 4, false), glowMaterial(0x94b8c6, .35)); root.add(m); return m;
  });
  const lightningGeometry = new T.BufferGeometry(); lightningGeometry.setAttribute("position", new T.Float32BufferAttribute(new Float32Array(200 * 3), 3));
  const lightning = new T.LineSegments(lightningGeometry, new T.LineBasicMaterial({ color: new T.Color(0xffe8a9).multiplyScalar(3), transparent: true, depthWrite: false, blending: T.AdditiveBlending })); lightning.frustumCulled = false; root.add(lightning);
  const gadget = new T.Group();
  gadget.add(new T.Mesh(new T.TorusGeometry(.21, .06, 8, 16), new T.MeshStandardMaterial({color: 0xc1a871, metalness: .8, roughness: .3})));
  for (let i = 0; i < 8; i++) {
    const tooth = new T.Mesh(new T.BoxGeometry(.09,.12,.1), new T.MeshStandardMaterial({color: 0xc1a871, metalness: .8, roughness: .3}));
    const a = i / 8 * Math.PI * 2; tooth.position.set(Math.cos(a) * .27, Math.sin(a) * .27, 0); tooth.rotation.z = a; gadget.add(tooth);
  }
  gadget.add(new T.Mesh(new T.SphereGeometry(.12, 12, 8), glowMaterial(0x74e5eb))); root.add(gadget);
  const flash = new T.PointLight(0xffd890, 0, 7); root.add(flash);
  const dummy = new T.Object3D(), color = new T.Color();
  return {
    root,
    update(s: BattleView) {
      const t = s.clock, x = worldX(s.x), ex = worldX(s.ex), y = worldY(s.y), ink = heroColors[s.heroIndex];
      sparks.count = s.particles.length;
      s.particles.forEach((p, i) => {
        dummy.position.set(worldX(p.x), worldY(p.y), Math.sin(i * 2.8) * .4);
        dummy.scale.setScalar(p.size / 3 * Math.max(0, p.life / p.max)); dummy.updateMatrix(); sparks.setMatrixAt(i, dummy.matrix); sparks.setColorAt(i, color.setHex(p.color));
      });
      sparks.instanceMatrix.needsUpdate = true; if (sparks.instanceColor) sparks.instanceColor.needsUpdate = true;
      rings.forEach((r, i) => {
        const hit = s.impacts[i]; r.visible = !!hit;
        if (hit) { const p = 1 - hit.life / .38; r.position.set(worldX(hit.x), worldY(hit.y), .3); r.scale.setScalar((.15 + p * .85) * hit.power); (r.material as T.MeshBasicMaterial).color.setHex(hit.color).multiplyScalar(2); (r.material as T.MeshBasicMaterial).opacity = Math.max(0, 1 - p); }
      });
      flash.position.set(ex, 2.2, 1); flash.color.setHex(ink); flash.intensity = s.reduced ? 0 : Math.min(10, s.enemyRecoil * 45);
      action.position.set(x, y + 1.8, .4); action.scale.x = s.facing;
      const m = MOVES[s.move as keyof typeof MOVES];
      const progress = m ? T.MathUtils.clamp((s.moveTime - m.windup) / m.active, 0, 1) : 0;
      const striking = !!m && s.moveTime >= m.windup && s.moveTime < m.windup + m.active;
      slash.visible = slashCore.visible = striking && s.move !== "special";
      [slash, slashCore].forEach(o => { o.rotation.set(-.2, -.3, -.4 + progress * .9); o.position.set(.45, 0, 0); o.scale.setScalar(s.move === "strong" ? 1.35 : 1); (o.material as T.MeshBasicMaterial).color.setHex(ink).multiplyScalar(o === slashCore ? 2.3 : 1.3); (o.material as T.MeshBasicMaterial).opacity = Math.sin(progress * Math.PI) * .8; });
      shield.visible = shieldRing.visible = s.guarding || s.guardFlash > 0;
      shield.position.set(x + s.facing * .4, y + 1.8, .2); shield.rotation.y = s.facing * Math.PI / 2;
      shieldRing.position.copy(shield.position); shieldRing.rotation.y = s.facing * .8;
      (shield.material as T.MeshBasicMaterial).opacity = .07 + s.guardFlash * .5;
      (shieldRing.material as T.MeshBasicMaterial).opacity = .35 + s.guardFlash;
      const telling = s.enemyPhase === "tell" && s.pendingResult === null;
      warning.visible = telling;
      const dir = Math.sign(x - ex) || -1, length = s.enemyMove === "charge" ? 2.7 : 10.9;
      warning.position.set(ex + dir * length / 2, .085, 0); warning.scale.set(length, s.enemyMove === "low" ? .5 : 1.5, 1);
      (warning.material as T.MeshBasicMaterial).opacity = s.reduced ? .18 : .1 + Math.sin(t * 15) ** 2 * .12;
      warningEdges.forEach((o, i) => { o.visible = telling; o.position.set(ex + dir * (.7 + i / 9 * length), .095, 0); o.rotation.z = dir > 0 ? 0 : Math.PI; });
      gusts.forEach((o, i) => {
        o.visible = s.enemyPhase === "attack" && s.pendingResult === null;
        const height = s.enemyMove === "low" ? .2 : s.enemyMove === "sweep" ? 1.2 : .6;
        o.position.set(ex, height + i * (s.enemyMove === "low" ? .035 : .14), Math.sin(i) * .35);
        o.scale.set(dir * (s.enemyMove === "charge" ? .24 : 1), 1, 1);
      });
      const special = s.move === "special" && striking;
      lightning.visible = special && s.heroIndex === 0;
      if (lightning.visible) {
        const positions = lightningGeometry.getAttribute("position"), target = x + s.facing * Math.min(7.65, Math.abs(ex - x));
        let count = 0;
        for (let branch = 0; branch < 3; branch++) for (let j = 0; j < 18; j++) {
          for (const k of [j, j + 1]) {
            const p = k / 18, jitter = k === 0 || k === 18 ? 0 : Math.sin(k * 127.3 + Math.floor(t * 32) * 4 + branch) * .2;
            positions.setXYZ(count++, T.MathUtils.lerp(x, target, p), y + 2.7 - p * .4 + jitter + branch * .07, .35 + Math.cos(k * 2) * .1);
          }
        }
        // Jason calls a bolt from the sky; electricity belongs exclusively to his power.
        for (let branch = 0; branch < 2; branch++) for (let j = 0; j < 18; j++) for (const k of [j, j + 1]) {
          const p = k / 18, jitter = Math.sin(k * 91 + Math.floor(t * 25)) * .22 * Math.sin(p * Math.PI);
          positions.setXYZ(count++, target + jitter + branch * .08, 2.3 + p * 6, .25);
        }
        lightningGeometry.setDrawRange(0, count); positions.needsUpdate = true;
      }
      waves.forEach((o, i) => {
        o.visible = special && s.heroIndex !== 0;
        const p = (progress + i / 6) % 1;
        o.position.set(x + s.facing * (.4 + p * 7.2), y + 1.8, 0); o.rotation.y = Math.PI / 2; o.scale.setScalar(.3 + p * .9);
        (o.material as T.MeshBasicMaterial).color.setHex(ink).multiplyScalar(1.6); (o.material as T.MeshBasicMaterial).opacity = (1 - p) * .75;
      });
      gadget.visible = special && s.heroIndex === 2;
      gadget.position.set(x + s.facing * progress * 7.6, y + 1.8 + Math.sin(progress * Math.PI) * .7, .4); gadget.rotation.z = t * 20;
    },
  };
}
