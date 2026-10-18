import * as T from "three";
import { box, orb, rod, mesh, mat, batchRigid } from "./geometry";
import { seeded } from "./types";

export interface World { root: T.Group; museum: T.Group; bus: T.Group; dust: T.Points; sun: T.DirectionalLight; rim: T.DirectionalLight; banners: T.Mesh[]; sky: T.Mesh; }

function mesa(radius: number, height: number, seed: number) {
  const random = seeded(seed), geo = new T.CylinderGeometry(radius * .78, radius, height, 18, 12);
  const p = geo.getAttribute("position"), colors: number[] = [];
  const layers = [0x784334, 0x9b5840, 0xc17950, 0xa86647, 0xd89a69, 0x8e5442];
  const shifts = Array.from({length: 19}, () => .85 + random() * .3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = (Math.atan2(z, x) + Math.PI) / (2 * Math.PI);
    const shape = shifts[Math.floor(a * 18) % 18] * (1 + .025 * Math.sin(y * 6));
    p.setXYZ(i, x * shape, y, z * shape);
    const c = new T.Color(layers[Math.floor((y / height + .5) * 18 + 30) % layers.length]);
    c.multiplyScalar(.83 + random() * .25); colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3)); geo.computeVertexNormals(); return geo;
}

export function createWorld(): World {
  const root = new T.Group(), museum = new T.Group(), bus = new T.Group();
  const skyMaterial = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vPos; uniform float time;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
      void main(){vec3 d=normalize(vPos); float h=max(0.,d.y); vec3 c=mix(vec3(.48,.25,.16),vec3(.025,.052,.105),smoothstep(0.,.55,h));
      vec2 uv=d.xz/max(.08,h)*1.8; float n=noise(uv+time*.009)*.5+noise(uv*2.1-time*.012)*.27+noise(uv*4.3)*.14;
      float cloud=smoothstep(.3,.66,n)*smoothstep(0.,.22,h); c=mix(c,vec3(.07,.09,.14),cloud*.85);
      float glow=pow(max(0.,dot(d,normalize(vec3(-.65,.16,-1.)))),36.); c+=vec3(.9,.35,.12)*glow*.7;
      gl_FragColor=vec4(c,1.); #include <tonemapping_fragment>
      #include <colorspace_fragment> }`.replace("; #include", ";\n#include"),
  });
  const sky = mesh(root, new T.SphereGeometry(130, 32, 16), skyMaterial); sky.castShadow = false; sky.receiveShadow = false;
  const sandstone = new T.MeshStandardMaterial({ vertexColors: true, roughness: .95, flatShading: true });
  const random = seeded(879);
  for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 11; i++) {
    const h = 8 + random() * 13, r = 3 + random() * 5;
    const rock = mesh(root, mesa(r, h, layer * 100 + i + 1), sandstone, (i - 5) * 10 + random() * 4, h * .5 - 12 - layer * 2, -17 - layer * 18 - random() * 8);
    rock.rotation.y = random() * 4; rock.castShadow = false;
  }
  const river = box(root, mat(0x395c65, .24, .35), [2.4, .05, 100], [4, -9, -55], 0); river.rotation.y = -.28;
  const deck = mat(0x343a3d, .44, .18), edge = mat(0x8c7960, .64), bronze = mat(0xb29458, .3, .74), metal = mat(0x28323b, .34, .74);
  box(museum, edge, [22, .65, 8.5], [0, -.4, 0], .06);
  box(museum, deck, [21.8, .12, 8.3], [0, -.025, 0], .025);
  for (let x = -10; x <= 10; x += 2) for (let z = -3; z <= 3; z += 2) {
    box(museum, mat((x + z) % 4 === 0 ? 0x3a4144 : 0x30373c, .42, .2), [1.97, .025, 1.97], [x, .045, z], .008);
  }
  // Inlaid metal follows the fighting lane. Broken outer glass opens onto the canyon.
  for (const z of [-1.7, 1.7]) {
    box(museum, bronze, [21, .018, .035], [0, .068, z], 0);
    for (let x = -10; x <= 10; x += .8) {
      const tile = box(museum, bronze, [.22, .02, .22], [x, .07, z + Math.sign(z) * .22], 0); tile.rotation.y = Math.PI / 4;
    }
  }
  const emblem = mesh(museum, new T.RingGeometry(1.65, 1.68, 96), bronze, 0, .073, 0); emblem.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    const mark = box(museum, bronze, [.035, .018, .14], [Math.cos(a) * 1.5, .075, Math.sin(a) * 1.5], 0); mark.rotation.y = -a;
  }
  const columns = mat(0x968a72, .73), inner = mat(0x45494b, .63);
  const glass = new T.MeshPhysicalMaterial({ color: 0x93b8c6, transparent: true, opacity: .1, roughness: .12, metalness: .1, side: T.DoubleSide, depthWrite: false });
  for (const x of [-10.5, -6, 0, 6, 10.5]) {
    box(museum, columns, [.38, 6.5, .55], [x, 3.2, -3.4]);
    box(museum, inner, [.14, 6.4, .15], [x, 3.2, -3.04], .01);
    box(museum, bronze, [.46, .12, .65], [x, .4, -3.4]);
    box(museum, bronze, [.46, .12, .65], [x, 5.6, -3.4]);
  }
  box(museum, columns, [22, .5, .7], [0, 6.3, -3.4]);
  box(museum, bronze, [22, .07, .08], [0, 5.99, -2.99], .01);
  for (const x of [-8.2, -3, 3, 8.2]) {
    const pane = box(museum, glass, [4.8, 4.9, .015], [x, 3.5, -3.48], 0); pane.castShadow = false;
    box(museum, metal, [4.8, .07, .06], [x, 1.05, -3.1], .01);
    box(museum, glass, [4.8, .93, .02], [x, .53, -3.1], 0).castShadow = false;
  }
  // Museum displays: ammonite fossils and a relief of the canyon.
  for (const side of [-1, 1]) {
    box(museum, columns, [1.5, .85, 1.1], [side * 8.4, .46, -2.35]);
    box(museum, bronze, [1.58, .06, 1.18], [side * 8.4, .91, -2.35]);
    const fossil = mesh(museum, new T.TorusGeometry(.34, .105, 10, 32, Math.PI * 1.85), mat(0xc3ab7d), side * 8.4, 1.36, -2.35);
    fossil.rotation.y = side * -.25;
    rod(museum, metal, .025, .45, [side * 8.4, 1.1, -2.35]);
    box(museum, metal, [.55, .3, .06], [side * 8.4, 1.04, -1.74]).rotation.x = -.6;
  }
  const banners: T.Mesh[] = [];
  for (const side of [-1, 1]) {
    const banner = mesh(museum, new T.PlaneGeometry(1.1, 2.8, 5, 12), new T.MeshStandardMaterial({ color: 0x312e51, roughness: .9, side: T.DoubleSide }), side * 10, 4.4, -2.8);
    banner.userData.keep = true;
    banner.geometry.setAttribute("rest", banner.geometry.getAttribute("position").clone());
    banners.push(banner);
    const ring = mesh(museum, new T.TorusGeometry(.27, .025, 6, 32), bronze, side * 10, 4.6, -2.7); ring.scale.y = 1.3;
    rod(museum, bronze, .025, 1.2, [side * 10, 5.9, -2.8]).rotation.z = Math.PI / 2;
  }
  for (let i = 0; i < 42; i++) {
    const rock = mesh(museum, new T.DodecahedronGeometry(.06 + random() * .1), i % 3 ? columns : metal, (random() - .5) * 21, .11, (random() - .5) * 7);
    rock.scale.set(1.5, .3, 1); rock.rotation.set(random() * 2, random() * 5, 0);
  }
  root.add(museum);
  // Cutaway school-bus interior, with aisle, paired seats, windows and grab rails.
  const busYellow = mat(0xd4a447, .6), seat = mat(0x453d31, .78), busWall = mat(0xa4a99e, .68);
  box(bus, mat(0x383d39), [5.4, .16, 16], [0, -.08, -2]);
  for (const side of [-1, 1]) {
    box(bus, busYellow, [.14, 1.1, 16], [side * 2.7, .55, -2]);
    box(bus, busWall, [.12, .18, 16], [side * 2.7, 3.5, -2]);
    for (let i = 0; i < 7; i++) {
      const z = 4 - i * 2;
      box(bus, busWall, [.13, 2.3, .11], [side * 2.7, 2.35, z]);
      box(bus, busWall, [.14, .06, 1.9], [side * 2.7, 2.6, z - 1]);
      box(bus, glass, [.02, 2.2, 1.85], [side * 2.7, 2.3, z - 1], 0).castShadow = false;
      box(bus, seat, [1.8, .2, 1.2], [side * 1.65, .86, z]);
      box(bus, seat, [1.8, 1.22, .23], [side * 1.65, 1.4, z - .5]);
      for (const x of [side * .95, side * 2.3]) rod(bus, metal, .045, .8, [x, .4, z]);
    }
    rod(bus, metal, .045, 14, [side * 2.1, 3.3, -2]).rotation.x = Math.PI / 2;
  }
  box(bus, busYellow, [5.4, 3.4, .18], [0, 1.7, -10]);
  box(bus, glass, [4.9, 1.5, .025], [0, 2.4, -9.88], 0);
  bus.visible = false; root.add(bus);
  const dustGeo = new T.BufferGeometry(), dustPositions: number[] = [];
  for (let i = 0; i < 210; i++) dustPositions.push((random() - .5) * 26, random() * 8, (random() - .5) * 16);
  dustGeo.setAttribute("position", new T.Float32BufferAttribute(dustPositions, 3));
  const dust = new T.Points(dustGeo, new T.PointsMaterial({ color: 0xa9c4cb, size: .035, transparent: true, opacity: .45, depthWrite: false })); root.add(dust);
  const ambient = new T.HemisphereLight(0x8bbadf, 0x4a2c1d, 2.1); root.add(ambient);
  const sun = new T.DirectionalLight(0xffc17d, 3.5); sun.position.set(-12, 12, -9); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -14; sun.shadow.camera.right = 14; sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10;
  sun.shadow.camera.near = .5; sun.shadow.camera.far = 60; sun.shadow.normalBias = .035; sun.shadow.bias = -.0001; sun.shadow.radius = 3;
  root.add(sun, sun.target);
  const rim = new T.DirectionalLight(0x93ccff, 2.4); rim.position.set(5, 7, 7); root.add(rim);
  const warm = new T.PointLight(0xffbd73, 45, 16, 2); warm.position.set(-8, 4, 2); root.add(warm);
  batchRigid(museum); batchRigid(bus);
  return { root, museum, bus, dust, sun, rim, banners, sky };
}

export function animateWorld(w: World, t: number, storm: number, reduced: boolean) {
  (w.sky.material as T.ShaderMaterial).uniforms.time.value = t;
  w.rim.intensity = 2.4 + (storm - 1) * .6;
  for (const b of w.banners) {
    const p = b.geometry.getAttribute("position"), rest = b.geometry.getAttribute("rest");
    for (let i = 0; i < p.count; i++) {
      const y = rest.getY(i), weight = (1.4 - y) / 2.8;
      p.setZ(i, Math.sin(y * 4 + t * 3.2) * weight * .16 * (reduced ? .2 : storm));
    }
    p.needsUpdate = true;
  }
  const p = w.dust.geometry.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    p.setX(i, ((i * 7.23 + t * (reduced ? .2 : 1.2) * storm) % 26) - 13);
    p.setY(i, (i * .371 + Math.sin(t * .4 + i) * .2) % 8);
  }
  p.needsUpdate = true;
}
