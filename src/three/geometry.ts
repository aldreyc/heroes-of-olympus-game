import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const mat = (color: number, roughness = .65, metalness = 0) => new T.MeshStandardMaterial({ color, roughness, metalness });
export function mesh(parent: T.Object3D, geo: T.BufferGeometry, material: T.Material, x = 0, y = 0, z = 0) {
  const o = new T.Mesh(geo, material);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true;
  parent.add(o); return o;
}
export function box(parent: T.Object3D, material: T.Material, size: number[], pos: number[], radius = .04) {
  return mesh(parent, radius ? new RoundedBoxGeometry(size[0], size[1], size[2], 2, Math.min(radius, ...size.map(n => n / 3))) : new T.BoxGeometry(...size as [number, number, number]), material, ...pos as [number, number, number]);
}
export function orb(parent: T.Object3D, material: T.Material, size: number[], pos: number[]) {
  const o = mesh(parent, new T.SphereGeometry(1, 16, 12), material, ...pos as [number, number, number]);
  o.scale.set(...size as [number, number, number]); return o;
}
export function rod(parent: T.Object3D, material: T.Material, radius: number, length: number, pos = [0, 0, 0], top = radius) {
  return mesh(parent, new T.CylinderGeometry(top, radius, length, 12), material, ...pos as [number, number, number]);
}
export function joint(parent: T.Object3D, x: number, y: number, z: number) {
  const o = new T.Group(); o.position.set(x, y, z); parent.add(o); return o;
}
/** Batch rigid details per material, preserving child joints and their animation. */
export function batchRigid(group: T.Group) {
  for (const child of [...group.children]) if (child instanceof T.Group) batchRigid(child);
  const buckets = new Map<T.Material, T.Mesh[]>();
  for (const child of group.children) if (child instanceof T.Mesh && !Array.isArray(child.material) && !child.userData.keep) {
    const bucket = buckets.get(child.material) || []; bucket.push(child); buckets.set(child.material, bucket);
  }
  for (const [material, parts] of buckets) {
    if (parts.length < 2) continue;
    const copies = parts.map(part => { part.updateMatrix(); const g = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone(); g.applyMatrix4(part.matrix); g.deleteAttribute("uv"); return g; });
    const merged = mergeGeometries(copies);
    copies.forEach(g => g.dispose());
    if (!merged) continue;
    parts.forEach(p => { group.remove(p); p.geometry.dispose(); });
    mesh(group, merged, material);
  }
}
export function disposeTree(root: T.Object3D) {
  const geometry = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
  root.traverse(o => {
    if (o instanceof T.Light && "shadow" in o) (o.shadow as T.LightShadow).dispose();
    if (o instanceof T.Mesh || o instanceof T.Points || o instanceof T.Line) {
      geometry.add(o.geometry);
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m));
    }
  });
  geometry.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
}
