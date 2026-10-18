import * as T from "three";
import { mesh, mat } from "./geometry";
import { seeded, type BattleView } from "./types";

export function createStorm() {
  const root = new T.Group(); root.name = "Dylan · ventus";
  const uniforms = { time: { value: 0 }, intensity: { value: 1 }, fade: { value: 1 }, tint: { value: new T.Color(0x8fabbc) } };
  const material = new T.ShaderMaterial({
    uniforms, transparent: true, side: T.DoubleSide, depthWrite: false,
    vertexShader: `uniform float time; varying vec3 vPos; varying vec3 vNormal;
      void main(){vec3 p=position; float a=atan(p.z,p.x); float n=sin(p.y*7.-time*5.+a*3.)*.045+sin(p.y*3.+time*2.-a*4.)*.055;
      p.xz*=1.+n; p.x+=sin(p.y*1.5-time*1.7)*.09; vPos=p; vNormal=normalMatrix*normal; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `uniform float time,intensity,fade; uniform vec3 tint; varying vec3 vPos,vNormal;
      float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float noise(vec3 p){vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1)),f.x),f.y),f.z);}
      float fbm(vec3 p){float v=0.; float a=.5; for(int i=0;i<4;i++){v+=noise(p)*a;p=p*2.03+4.1;a*=.5;}return v;}
      void main(){float a=atan(vPos.z,vPos.x); vec3 p=vec3(cos(a+time*1.7)*2.,vPos.y*1.6-time*1.4,sin(a+time*1.7)*2.);
      float n=fbm(p),band=sin(vPos.y*15.+a*3.-time*8.+n*5.)*.5+.5;
      float edge=pow(1.-abs(normalize(vNormal).z),2.); vec3 c=mix(vec3(.018,.03,.05),tint*.55,n*.8+edge*.5); c+=vec3(.17,.23,.27)*pow(band,10.)*.26;
      float density=smoothstep(.18,.75,n)*.72+.1; density*=smoothstep(0.,.4,vPos.y)*(1.-smoothstep(4.3,4.85,vPos.y));
      density*=.4+.6*pow(abs(normalize(vNormal).z),.35);
      gl_FragColor=vec4(c,density*fade*(.9+intensity*.1));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  });
  const profile = [new T.Vector2(.07, 0),new T.Vector2(.24,.35),new T.Vector2(.37,.9),new T.Vector2(.5,1.5),new T.Vector2(.74,2.2),new T.Vector2(1.05,2.8),new T.Vector2(1.15,3.2),new T.Vector2(.84,3.7),new T.Vector2(1,4.1),new T.Vector2(.7,4.5),new T.Vector2(.05,4.8)];
  const curve = new T.SplineCurve(profile), smooth = curve.getPoints(50);
  const shells: T.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const shell = mesh(root, new T.LatheGeometry(smooth, 64), material); shell.scale.setScalar(1 - i * .16); shell.position.y = i * .18; shell.castShadow = false; shell.renderOrder = i + 1; shells.push(shell);
  }
  const face = new T.Group(); face.position.set(0, 3.65, .85); root.add(face);
  const eyeMat = new T.MeshBasicMaterial({ color: new T.Color(0xa9e4ee).multiplyScalar(2.2), transparent: true });
  for (const side of [-1, 1]) {
    const shape = new T.Shape(); shape.moveTo(-.2, .035); shape.lineTo(.17, -.02); shape.lineTo(.07, -.11); shape.lineTo(-.12, -.08); shape.closePath();
    const eye = mesh(face, new T.ShapeGeometry(shape), eyeMat, side * .29, .035, .15); eye.scale.x = side; eye.castShadow = false;
  }
  const mouthShape = new T.Shape(); mouthShape.moveTo(-.27, -.32); mouthShape.lineTo(-.1,-.28); mouthShape.lineTo(0,-.34); mouthShape.lineTo(.23,-.29); mouthShape.lineTo(.17,-.49); mouthShape.lineTo(.05,-.46); mouthShape.lineTo(-.07,-.52); mouthShape.lineTo(-.22,-.43); mouthShape.closePath();
  const mouth = mesh(face, new T.ShapeGeometry(mouthShape), new T.MeshBasicMaterial({color: 0x01070e, transparent: true}), 0, 0, .19); mouth.castShadow = false;
  const wisps: T.Mesh[] = [];
  const wispMat = new T.MeshBasicMaterial({ color: 0x90a6b5, transparent: true, opacity: .2, depthWrite: false });
  for (let k = 0; k < 4; k++) {
    const points: T.Vector3[] = [];
    for (let i = 0; i <= 90; i++) {
      const y = i / 90 * 4.4, a = y * 5 + k * 1.7, r = .16 + y * .24;
      points.push(new T.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    const w = mesh(root, new T.TubeGeometry(new T.CatmullRomCurve3(points), 100, .013 + k * .004, 4, false), wispMat); w.castShadow = false; wisps.push(w);
  }
  const papers = new T.InstancedMesh(new T.PlaneGeometry(.12, .18), new T.MeshStandardMaterial({ color: 0xc6c5b2, side: T.DoubleSide, roughness: .95 }), 72);
  const stones = new T.InstancedMesh(new T.DodecahedronGeometry(.075), mat(0x52616a), 26);
  papers.frustumCulled = false; stones.frustumCulled = false;
  root.add(papers, stones);
  const random = seeded(27), seeds = Array.from({length: 98}, () => [random() * Math.PI * 2, random() * 4.3, .7 + random() * .9, random()]);
  const dummy = new T.Object3D();
  return {
    root,
    update(t: number, s?: BattleView, reduced = false) {
      const dispersion = s?.pendingResult === true ? T.MathUtils.clamp(1 - s.finishTimer / .72, 0, 1) : 0;
      const coil = s?.enemyPhase === "tell" ? .91 : 1;
      uniforms.time.value = t * (reduced ? .35 : 1); uniforms.intensity.value = s?.storm || 1; uniforms.fade.value = 1 - dispersion;
      uniforms.tint.value.setHex(s?.enemyPhase === "stunned" ? 0xcf95ce : s && s.enemyRecoil > 0 ? 0xded0ae : 0x8fabbc);
      root.scale.set(1 + dispersion, coil * (1 + dispersion * .25), 1 + dispersion);
      face.rotation.y = s ? (s.x < s.ex ? -.27 : .27) : -.2;
      eyeMat.opacity = 1 - dispersion;
      (mouth.material as T.MeshBasicMaterial).opacity = 1 - dispersion;
      wisps.forEach((w, i) => { w.rotation.y = -t * (reduced ? .3 : 1.4 + i * .13); }); wispMat.opacity = (1 - dispersion) * .2;
      for (let i = 0; i < 98; i++) {
        const [offset, baseY, radius, speed] = seeds[i], y = (baseY + t * .33) % 4.5;
        const a = offset - t * (reduced ? .45 : 2.1 + speed), r = (.3 + y * .27) * radius + dispersion * 3;
        dummy.position.set(Math.cos(a) * r, y + dispersion * 2, Math.sin(a) * r);
        dummy.rotation.set(a, t * 2 + i, a * .6);
        dummy.scale.setScalar((1 - dispersion) * (reduced && i % 3 ? 0 : 1)); dummy.updateMatrix();
        if (i < 72) papers.setMatrixAt(i, dummy.matrix); else stones.setMatrixAt(i - 72, dummy.matrix);
      }
      papers.instanceMatrix.needsUpdate = true; stones.instanceMatrix.needsUpdate = true;
    },
  };
}
