import * as T from "three";
import { box, orb, rod, joint, mesh, mat, batchRigid } from "./geometry";
import { seeded, type BattleView } from "./types";
import { MOVES } from "../combat-model.mjs";

export interface Fighter {
  root: T.Group; body: T.Group; head: T.Group;
  arms: T.Group[]; elbows: T.Group[]; legs: T.Group[]; knees: T.Group[];
  weapon: T.Group; hair: T.Group; id: number;
}

/** Original articulated models following Rodrigo's clothing, colors and silhouettes. */
export function createFighter(id: number): Fighter {
  const root = new T.Group(); root.name = ["Jason Grace", "Piper McLean", "Leo Valdez", "Coach Hedge"][id];
  const skin = mat([0xd99a67, 0xb77b54, 0xc08750, 0xb87c4e][id], .78);
  const hairMat = mat([0xba7927, 0x251712, 0x23150e, 0x41291c][id]);
  const hairLight = mat([0xe2ad52, 0x493022, 0x51321e, 0x64412b][id]);
  const shirt = mat([0x51366f, 0x4a265b, 0x424c39, 0x203961][id], .89);
  const cloth = mat(0xc9c6b6, .88), denim = mat(id === 3 ? 0x243d69 : 0x304760, .92);
  const seams = mat(0x607187, .85), leather = mat(0x4d3324, .9), sole = mat(0x9a9b97, .8);
  const black = mat(0x141b25), white = mat(0xe1dfd1), metal = mat(0xd9b66a, .26, .8);
  const eye = mat([0x5b98b7, 0x878d5b, 0x52341c, 0x5c442a][id]);
  const body = joint(root, 0, 1.48, 0);
  box(body, denim, [.64, .3, .38], [0, 0, 0], .1);
  const chest = mesh(body, new T.CylinderGeometry(.43, .31, .88, 12), shirt, 0, .55);
  chest.scale.z = .58;
  box(body, leather, [.67, .09, .4], [0, .13, 0], .025);
  box(body, metal, [.12, .08, .025], [0, .13, .216], .01);
  if (id === 1 || id === 2 || id === 3) {
    box(body, cloth, [.32, .73, .04], [0, .58, .237], .025);
    for (const side of [-1, 1]) {
      const lapel = box(body, shirt, [.16, .43, .04], [side * .18, .8, .27], .01);
      lapel.rotation.z = side * -.2;
      box(body, shirt, [.19, .15, .04], [side * .26, .53, .265], .01);
      box(body, metal, [.025, .025, .015], [side * .27, .55, .29], .005);
    }
  }
  // Neckline, neck, and a face with nose, brows, ears and a sculpted jaw.
  rod(body, skin, .12, .24, [0, 1.06, 0]);
  const head = joint(body, 0, 1.42, .015);
  orb(head, skin, [.265, .355, .235], [0, 0, 0]);
  box(head, skin, [.36, .24, .3], [0, -.17, .025], .09);
  for (const side of [-1, 1]) {
    orb(head, skin, [.065, .105, .045], [side * .26, -.035, 0]);
    orb(head, white, [.067, .026, .019], [side * .103, .017, .219]);
    orb(head, eye, [.025, .026, .012], [side * .1, .015, .237]);
    orb(head, black, [.011, .02, .008], [side * .1, .015, .248]);
    const brow = box(head, hairMat, [.145, .024, .022], [side * .1, .085, .22], .008);
    brow.rotation.z = side * -.1;
  }
  orb(head, skin, [.045, .077, .065], [0, -.055, .222]);
  const lip = mat(0x8e5843, .85);
  box(head, lip, [.105, .017, .015], [0, -.19, .219], .006);
  const hair = joint(head, 0, 0, 0);
  orb(hair, hairMat, [.281, .24, .25], [0, .185, -.02]);
  const random = seeded(92 + id);
  if (id === 0) {
    for (let i = 0; i < 23; i++) {
      const angle = random() * Math.PI * 2, r = .1 + random() * .14;
      const lock = mesh(hair, new T.ConeGeometry(.09, .22 + random() * .12, 4), i % 3 ? hairLight : hairMat,
        Math.cos(angle) * r, .29 + random() * .05, Math.sin(angle) * r);
      lock.rotation.set((random() - .5) * 1.5, random() * 3, -.4 - random() * .6);
    }
    for (let i = 0; i < 5; i++) {
      const fringe = box(hair, i % 2 ? hairMat : hairLight, [.085, .23, .045], [-.18 + i * .085, .17 - i * .014, .217], .018);
      fringe.rotation.z = -.45;
    }
  } else if (id === 1) {
    for (let i = 0; i < 19; i++) {
      const a = .85 + i / 18 * (Math.PI * 2 - 1.7);
      const strand = orb(hair, i % 4 ? hairMat : hairLight, [.085, .5 + random() * .09, .085], [Math.sin(a) * .275, -.18, Math.cos(a) * .23]);
      strand.rotation.z = Math.sin(a) * .12;
      orb(hair, hairMat, [.09, .18, .09], [Math.sin(a) * .3, -.6, Math.cos(a) * .23]);
    }
    for (let i = 0; i < 5; i++) {
      const fringe = orb(hair, hairLight, [.1, .21, .075], [-.19 + i * .067, .22, .17]);
      fringe.rotation.z = -.7;
    }
    // Camp necklace and shoulder bag echo her portrait.
    const cord = mesh(body, new T.TorusGeometry(.18, .012, 5, 24, Math.PI), leather, 0, .88, .29);
    cord.rotation.z = Math.PI;
    for (let i = 0; i < 5; i++) orb(body, i % 2 ? metal : mat(0x54a9aa), [.025, .025, .02], [-.09 + i * .045, .71 + Math.abs(i - 2) * .015, .3]);
    const strap = box(body, leather, [.065, 1.1, .045], [.17, .52, .29], .01); strap.rotation.z = -.36;
    box(body, leather, [.29, .4, .19], [.4, -.01, -.01], .04);
  } else {
    for (let i = 0; i < 34; i++) {
      const a = random() * Math.PI * 2, r = Math.sqrt(random()) * .28;
      orb(hair, i % 5 ? hairMat : hairLight, [.085, .09, .085], [Math.cos(a) * r, .24 + random() * .16, Math.sin(a) * r]);
    }
    if (id === 2) {
      for (const side of [-1, 1]) {
        rod(head, metal, .095, .04, [side * .135, .27, .24]).rotation.x = Math.PI / 2;
        rod(head, mat(0x283e4e, .19, .5), .073, .045, [side * .135, .27, .26]).rotation.x = Math.PI / 2;
      }
      box(head, leather, [.15, .035, .035], [0, .27, .24], .01);
      box(body, leather, [.3, .36, .14], [-.35, -.05, .16], .03);
      for (let i = 0; i < 3; i++) {
        rod(body, metal, .025, .3, [-.43 + i * .09, .1, .25]);
        box(body, i === 1 ? mat(0x943f29) : black, [.045, .1, .045], [-.43 + i * .09, .27, .25], .01);
      }
      box(body, leather, [.31, .4, .19], [0, .48, -.27], .04);
    } else {
      for (const side of [-1, 1]) {
        const horn = mesh(head, new T.TorusGeometry(.22, .065, 8, 16, Math.PI * 1.35), mat(0x715f44), side * .28, .22, 0);
        horn.rotation.y = side * .4;
      }
      orb(head, hairMat, [.24, .26, .16], [0, -.23, .1]);
      box(body, white, [.025, .6, .02], [-.29, .67, .275], .005);
      box(body, white, [.025, .6, .02], [.29, .67, .275], .005);
      rod(body, metal, .04, .09, [0, .6, .29]);
    }
  }
  const arms: T.Group[] = [], elbows: T.Group[] = [], legs: T.Group[] = [], knees: T.Group[] = [];
  for (const side of [-1, 1]) {
    const arm = joint(body, side * .45, .91, 0); arms.push(arm);
    orb(arm, shirt, [.17, .195, .18], [0, -.08, 0]);
    rod(arm, shirt, .13, .43, [0, -.25, 0], .17);
    const elbow = joint(arm, 0, -.51, 0); elbows.push(elbow);
    rod(elbow, id === 0 ? skin : shirt, .09, .43, [0, -.19, 0], .125);
    if (id !== 0) rod(elbow, skin, .085, .12, [0, -.41, 0]);
    box(elbow, skin, [.15, .18, .13], [0, -.51, .005], .05);
    for (let finger = 0; finger < 3; finger++) box(elbow, skin, [.03, .09, .07], [-.045 + finger * .045, -.57, .055], .012);
    const leg = joint(root, side * .205, 1.4, 0); legs.push(leg);
    rod(leg, denim, .145, .65, [0, -.3, 0], .19);
    const knee = joint(leg, 0, -.64, 0); knees.push(knee);
    rod(knee, id === 3 ? hairMat : denim, .11, .58, [0, -.27, .01], .145);
    box(knee, seams, [.025, .51, .025], [side * .13, -.24, .025], .005);
    box(knee, id === 3 ? black : sole, [.28, .1, .49], [0, -.65, .115], .04);
    box(knee, black, [.25, .18, .42], [0, -.55, .09], .07);
    if (id !== 3) for (let i = 0; i < 4; i++) box(knee, cloth, [.15, .018, .025], [0, -.48 - i * .014, .13 + i * .04], .004);
  }
  const weapon = joint(elbows[1], 0, -.53, .02);
  weapon.name = id === 0 ? "Single imperial-gold sword" : id === 1 || id === 3 ? "Borrowed club" : "Workshop hammer";
  weapon.userData.weapon = true;
  // Weapon extends forward from the grip; its entire transform follows one hand.
  weapon.rotation.x = -Math.PI / 2;
  rod(weapon, leather, .045, .3, [0, .04, 0]);
  if (id === 0) {
    box(weapon, metal, [.38, .07, .1], [0, .23, 0], .02);
    orb(weapon, metal, [.075, .075, .065], [0, -.16, 0]);
    const bladeMat = mat(0xf2cf78, .18, .84);
    const blade = new T.Shape(); blade.moveTo(-.08, 0); blade.lineTo(.08, 0); blade.lineTo(.065, 1.02); blade.lineTo(0, 1.24); blade.lineTo(-.065, 1.02); blade.closePath();
    mesh(weapon, new T.ExtrudeGeometry(blade, { depth: .045, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 1, steps: 1 }), bladeMat, 0, .25, -.023);
    box(weapon, mat(0xffedb5, .1, .85), [.014, .96, .01], [0, .75, .034], .002);
  } else if (id === 1 || id === 3) {
    rod(weapon, leather, .075, 1.1, [0, .57, 0], .145);
    for (let i = 0; i < 4; i++) rod(weapon, mat(0x39291d), .058, .025, [0, .03 + i * .065, 0]);
  } else {
    rod(weapon, leather, .04, .65, [0, .27, 0]);
    box(weapon, mat(0x777c7c, .32, .78), [.47, .24, .24], [0, .6, 0], .04);
    box(weapon, metal, [.13, .28, .27], [0, .6, 0], .015);
  }
  batchRigid(root);
  return { root, body, head, arms, elbows, legs, knees, weapon, hair, id };
}

const ease = (x: number) => { x = T.MathUtils.clamp(x, 0, 1); return x * x * (3 - 2 * x); };
export function poseFighter(f: Fighter, t: number, state?: BattleView, seated = false, speaking = false) {
  const breath = Math.sin(t * 2.6);
  f.body.position.set(0, 1.48 + breath * .014, 0); f.body.rotation.set(0, 0, 0);
  f.head.rotation.set(.025 * breath, Math.sin(t * .9) * .035, 0);
  f.hair.rotation.z = Math.sin(t * 2) * .015;
  f.legs.forEach((l, i) => { l.rotation.set(seated ? -Math.PI / 2 : 0, 0, i ? -.055 : .055); });
  f.knees.forEach(k => k.rotation.x = seated ? Math.PI / 2 : .05);
  f.arms.forEach((a, i) => a.rotation.set(-.16 + breath * .035, 0, i ? .12 : -.12));
  f.elbows.forEach(e => e.rotation.set(-.24, 0, 0));
  f.weapon.rotation.set(2.6, 0, 0);
  if (speaking) { f.head.rotation.y = Math.sin(t * 1.7) * .13; f.arms[0].rotation.x = -.6 + Math.sin(t * 2.3) * .16; f.elbows[0].rotation.x = -.6; }
  if (!state) return;
  const s = state, walk = !s.move && !s.guarding && s.y >= 580 && (s.keys.has("a") || s.keys.has("d") || s.keys.has("arrowleft") || s.keys.has("arrowright"));
  f.root.rotation.y = s.facing * 1.12;
  // A grounded fighting stance, with one foot forward and the free hand protecting the face.
  f.body.position.y -= .07;
  f.legs[0].rotation.x = -.22; f.legs[1].rotation.x = .2;
  f.knees[0].rotation.x = .32; f.knees[1].rotation.x = .14;
  f.arms[0].rotation.x = -.75; f.elbows[0].rotation.x = -.75;
  f.arms[1].rotation.x = -.55; f.elbows[1].rotation.x = -.8;
  let bladeAngle = .8;
  if (walk) {
    const stride = Math.sin(t * 13), stride2 = Math.sin(t * 13 + Math.PI);
    f.legs[0].rotation.x = stride * .62; f.legs[1].rotation.x = -stride * .62;
    f.knees[0].rotation.x = Math.max(0, -stride) * .75;
    f.knees[1].rotation.x = Math.max(0, -stride2) * .75;
    f.arms[0].rotation.x = -stride * .4; f.arms[1].rotation.x = stride * .22 - .2;
    f.body.position.y += Math.abs(Math.cos(t * 13)) * .045;
  }
  if (s.y < 580) { f.legs[0].rotation.x = -.5; f.legs[1].rotation.x = .22; f.knees[0].rotation.x = .9; f.knees[1].rotation.x = .6; f.arms[0].rotation.x = -.7; }
  if (s.guarding) {
    f.body.rotation.x = .13; f.body.position.y -= .07;
    f.arms[0].rotation.set(-.95, 0, -.25); f.arms[1].rotation.set(-.8, 0, .18);
    f.elbows[0].rotation.x = -1.2; f.elbows[1].rotation.x = -1.45;
    bladeAngle = .08;
  }
  if (s.move) {
    const m = MOVES[s.move as keyof typeof MOVES];
    if (!m) return;
    const wind = ease(s.moveTime / m.windup), swing = ease((s.moveTime - m.windup) / m.active);
    const recover = 1 - ease((s.moveTime - m.windup - m.active) / m.recovery);
    const activePose = s.moveTime < m.windup ? wind : recover;
    f.body.rotation.y = (-.48 * wind + .9 * swing) * recover;
    f.body.rotation.x = .12 * swing * recover;
    f.body.position.z += .17 * swing * recover;
    f.arms[1].rotation.set(-.55 + (-1.55 * wind + .95 * swing) * recover, -.35 * activePose + .5 * swing * recover, .28 * activePose - .4 * swing * recover);
    f.elbows[1].rotation.x = -.8 + (-.6 * wind + 1.2 * swing) * recover;
    bladeAngle = .8 + (-1.7 * wind + 2.8 * swing) * recover;
    f.arms[0].rotation.x = -.65 * activePose;
    f.legs[0].rotation.x = -.25 * swing * recover;
    if (s.move === "strong") { f.arms[1].rotation.x -= .8 * activePose; f.elbows[1].rotation.x -= .3 * activePose; }
    if (s.move === "special") {
      f.arms[0].rotation.x = -1.7 * activePose;
      f.elbows[0].rotation.x = -.15;
      f.head.rotation.x = -.16 * activePose;
      if (f.id === 0) { f.arms[1].rotation.x = -2.5 * activePose; bladeAngle = .8 * (1 - activePose); }
      if (f.id === 1) { f.arms[1].rotation.x = -.4; bladeAngle = 2.2; }
    }
  }
  f.weapon.rotation.x = bladeAngle - f.arms[1].rotation.x - f.elbows[1].rotation.x;
  if (s.hurt > 0) { f.body.rotation.x = -.25 * Math.sin(s.hurt * 12); f.head.rotation.x = -.15; }
  if (s.pendingResult === false) { f.body.position.y -= .5; f.body.rotation.x = .4; f.knees.forEach(k => k.rotation.x = 1.1); f.legs.forEach(l => l.rotation.x = -.65); }
}
