import type { Beat } from "./story";
import { storyFrames } from "./story-frames";
import { storyProps } from "./story-props";
import { walkingActor, walkPaths } from "./story-walk";
import { spriteSvg } from "./sprite-svg";
import { dragonSequence } from "./dragon-cinematic";
type Actor = keyof typeof storyFrames;
function actor(name: Actor, cls = "") {
  const f = storyFrames[name];
  return `<div class="story-actor ${name} ${cls}" aria-hidden="true">${spriteSvg(f.file, f.size, f.rect)}</div>`;
}
function storm() { return '<img class="story-spirit" src="/assets/art/wind-spirit-v2.png" alt="">'; }
function prop(name: keyof typeof storyProps, cls: string) {
  const f = storyProps[name];
  return spriteSvg(f.file, f.size, f.rect, cls);
}
function chariot(pose: "arrival" | "landed" | "departure") {
  return `<div class="flying-chariot ${pose}">${prop(`story-chariot-${pose}-v2`, "chariot-sprite")}</div>`;
}
function claiming() {
  const signs = {
    jason: { label: "JUPITER", sign: '<path d="M36 3H22L13 30H26L20 53L45 21H31Z"/>', color: "#bce8ff" },
    piper: { label: "APHRODITE", sign: '<path d="M5 29L21 23L12 7L24 11L34 22L42 17H50L56 23L49 28L46 37L35 43L20 39L6 44L14 33Z"/>', color: "#ffd9ef" },
    leo: { label: "HEPHAESTUS", sign: '<path d="M14 6H42V14H49V23H36V17H29V23H19V18H10V10H14ZM24 23H33V51H24Z"/><path d="M10 48L7 36L15 41L18 33L22 44L21 54H12ZM39 54L38 43L44 32L46 42L54 37L50 51L46 55Z"/>', color: "#ffbc6a" },
  };
  return Object.entries(signs).map(([name, s], i) => `<div class="claim-hero claim-${name}" style="--claim-color:${s.color};--claim-delay:${1 + i * 1.4}s">${actor(name as Actor)}<div class="claim-sign"><svg viewBox="0 0 60 60" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">${s.sign}</svg><span>${s.label}</span></div><div class="claim-aura"></div></div>`).join("");
}
function campTableau(b: Beat) {
  const shot = b.shot!;
  let figures = "";
  const forest = b.scene === "woods";
  if (shot === "dragon-calm") figures = dragonSequence("calm", "dragon-calm-pose");
  else if (shot === "dragon-mount") figures = dragonSequence("mount", "dragon-mount-pose");
  else if (shot === "dragon-takeoff") figures = dragonSequence("flight", "dragon-flight-pose");
  else if (shot === "camp-dragon-return") figures = actor("jason") + actor("piper") + dragonSequence("flight", "dragon-return-pose");
  else if (shot === "camp-touchdown") figures = chariot("departure");
  else if (shot === "camp-claiming") figures = claiming();
  else if (walkPaths[shot]) figures = Object.keys(walkPaths[shot]).map(name => walkingActor(name as Parameters<typeof walkingActor>[0])).join("");
  else figures = actor("leo");
  if (["dragon-approach", "dragon-discovery"].includes(shot)) figures += prop("festus-discovery-v1", "forest-dragon");
  const motes = Array.from({ length: 14 }, (_, i) => `<i style="--n:${i};--mote-y:${35 + (i * 13) % 42}%"></i>`).join("");
  const destination = shot === "camp-jason-cabin" ? "CABIN 01 · ZEUS" : shot === "camp-piper-cabin" ? "CABIN 10 · APHRODITE" : shot === "camp-leo-cabin" ? "CABIN 09 · HEPHAESTUS" : "";
  return `<div class="story-shot ${shot} camp-sequence ${forest ? "forest-stage" : "camp-stage"}" aria-hidden="true">${figures}<div class="camp-motes">${motes}</div>${destination ? `<div class="cabin-destination">${destination}</div>` : ""}</div>`;
}
export function storyTableau(b: Beat) {
  if (!b.shot) return "";
  if (b.scene === "camp" || b.scene === "woods") return campTableau(b);
  let figures = "";
  switch (b.shot) {
    case "entrance": case "passes": case "confront": case "transform":
      figures = actor("jason") + actor("piper") + actor("leo") + actor("dylan") + actor("hedge") + storm(); break;
    case "piper-fall": figures = actor("jason") + actor("piper") + actor("leo") + storm(); break;
    case "jason-dive": figures = actor("jason") + actor("piper") + storm(); break;
    case "leo-ledge": figures = '<img class="canyon-shot" src="/assets/art/story-ledge-v2.png" alt="">'; break;
    case "hedge-rescue": figures = '<img class="canyon-shot" src="/assets/art/story-cliff-rescue-v2.png" alt="">'; break;
    case "flight": figures = prop("story-flight-embrace-v2", "rescue-embrace"); break;
    case "reunion": case "seized": case "departure":
      figures = actor("jason") + actor("piper") + actor("leo") + `<div class="abduction">${storm()}${actor("hedge")}</div><div class="cloud-bank"></div>`; break;
    case "chariot-arrival": figures = actor("jason") + actor("piper") + actor("leo") + chariot("arrival"); break;
    case "annabeth": figures = actor("jason") + actor("piper") + actor("leo") + actor("annabeth") + actor("butch") + chariot("landed"); break;
    case "chariot-leave": figures = chariot("departure"); break;
  }
  const grounded = !["leo-ledge", "hedge-rescue", "flight"].includes(b.shot);
  return `<div class="story-shot ${b.shot} ${grounded ? "grounded" : "aerial"} ${b.shot === "annabeth" && b.kind === "quote" ? "disembark" : ""}" aria-hidden="true">${figures}</div>`;
}
