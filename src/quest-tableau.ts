import type { Beat } from "./story";
import { storyFrames } from "./story-frames";
import { questFrames } from "./quest-frames";
import { spriteSvg } from "./sprite-svg";
import { walkingActor } from "./story-walk";
let cropId = 0;
function actor(name: keyof typeof storyFrames | "chiron" | "rachel" | "medea") {
  const f = name === "chiron" || name === "rachel" ? questFrames[name] : name === "medea" ? { ...questFrames.medea, rect: questFrames.medea.frames[0] } : storyFrames[name];
  return `<div class="quest-actor ${name}">${spriteSvg(f.file, f.size, f.rect)}</div>`;
}
function trio() { return actor("jason") + actor("piper") + actor("leo"); }
function flight() {
  const f = questFrames.flight, r = f.frames[0], o = f.offsets[0], id = `quest-flight-${++cropId}`;
  return `<div class="quest-flight"><svg data-quest-flight viewBox="0 0 ${f.logical.join(" ")}" preserveAspectRatio="xMidYMid meet"><defs><clipPath id="${id}"><rect x="${o[0]}" y="${o[1]}" width="${r[2]}" height="${r[3]}"/></clipPath></defs><g clip-path="url(#${id})"><image href="/assets/art/${f.file}" x="${o[0]-r[0]}" y="${o[1]-r[1]}" width="${f.size[0]}" height="${f.size[1]}"/></g></svg></div>`;
}
function parkedDragon() { return spriteSvg("festus-discovery-v1.png", [1536, 1024], [25, 61, 1500, 892], "parked-festus"); }
function goldenDragon(fallen = false) {
  const f = questFrames.golden;
  return `<div class="golden-guardian ${fallen ? "fallen" : ""}">${spriteSvg(f.file, f.size, f.frames[fallen ? 3 : 0])}</div>`;
}
function rescueWindow() {
  return `<svg class="rescue-window" viewBox="0 0 300 340" role="presentation"><path d="M20 330V135A130 130 0 0 1 280 135V330Z" fill="#142c4c" stroke="#bc9859" stroke-width="10"/><path d="M30 230L65 212L91 150L72 120L120 98L152 33L170 95L214 122L196 165L254 180L271 225V320H31Z" fill="#040a15"/><path d="M20 135H74M221 135H280M150 8V43M20 235H50M254 235H280" stroke="#e0bf81" stroke-width="7"/></svg><div class="window-shards">${Array.from({length:18},(_,i)=>`<i style="--i:${i};--sx:${4+i*17%22}%;--sy:${10+i*11%35}%;--sw:${5+i%4*3}px;--sh:${8+i%3*6}px"></i>`).join("")}</div>`;
}
function rescueFire() {
  const id = `rescue-flame-${++cropId}`;
  const sparks = Array.from({length:90}, (_,i) => `<rect x="${713+i*53%445}" y="${312+i*37%205}" width="${4+i%4*3}" height="${3+i%3*3}" fill="${["#fff8c7", "#ffd76e", "#ff7926"][i%3]}" opacity="${.25+i%4*.15}"/>`).join("");
  return '<svg class="festus-rescue-fire" viewBox="0 0 1280 720" role="presentation"><defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f48727"/><stop offset=".45" stop-color="#fa6e1b"/><stop offset="1" stop-color="#99280b"/></linearGradient><linearGradient id="'+id+'-core"><stop stop-color="#fffbd7"/><stop offset="1" stop-color="#ffc249"/></linearGradient><clipPath id="'+id+'-clip"><path d="M690 295L799 286L835 318L931 300L983 341L1100 320L1060 365L1220 385L1164 436L1231 481L1137 498L1145 548L1035 520L1001 548L923 488L863 490L804 411L756 396L718 339Z"/></clipPath></defs><path class="fire-outer" d="M690 295L799 286L835 318L931 300L983 341L1100 320L1060 365L1220 385L1164 436L1231 481L1137 498L1145 548L1035 520L1001 548L923 488L863 490L804 411L756 396L718 339Z" fill="url(#'+id+')"/><path class="fire-mid" d="M693 302L817 320L836 346L932 343L978 375L1120 390L1075 421L1162 455L1090 487L1047 466L1009 488L911 438L841 425L779 368L735 344Z" fill="#ffad31"/><path class="fire-core" d="M693 307L812 340L852 368L928 378L1011 422L1070 437L1000 448L920 419L856 408L791 364L741 345Z" fill="url(#'+id+'-core)"/><g clip-path="url(#'+id+'-clip)">'+sparks+'</g></svg><div class="rescue-embers">'+Array.from({length:24},(_,i)=>`<i style="--i:${i};--sx:${64+i*7%32}%;--sy:${43+i*11%29}%"></i>`).join("")+'</div>';
}
export function questTableau(b: Beat) {
  const shot = b.shot || "";
  const outside = ["mall-landing", "mall-enter", "mall-regroup"].includes(shot);
  const inside = shot.startsWith("mall-") && !outside;
  let content = "";
  if (shot === "quest-chiron" || shot === "quest-revealed") content = trio() + actor("chiron");
  if (["quest-rachel", "quest-oracle"].includes(shot)) content = trio() + actor("rachel") + '<div class="oracle-mist"></div>';
  if (["quest-takeoff", "quest-horizon", "mall-landing"].includes(shot)) content = flight();
  if (shot === "mall-enter") content = parkedDragon() + walkingActor("jason") + walkingActor("piper") + walkingActor("leo");
  if (["mall-meet", "mall-spell", "mall-victory"].includes(shot)) content = trio() + actor("medea");
  if (shot === "mall-hedge") content = trio() + actor("hedge");
  if (shot === "mall-regroup") content = parkedDragon() + trio() + actor("hedge");
  if (shot === "mall-golden-dragon") content = trio() + goldenDragon();
  if (["mall-festus-window", "mall-festus-fire", "mall-dragon-fallen"].includes(shot)) {
    const f = questFrames.festusWindow;
    content = rescueWindow() + trio() + goldenDragon(shot === "mall-dragon-fallen") + `<div class="rescue-festus">${spriteSvg(f.file, f.size, f.rect)}</div>`;
    if (shot === "mall-festus-fire") content += rescueFire();
  }
  if (shot === "quest-revealed") content += '<div class="quest-objectives"><span>THE QUEST</span><strong>Free Hera</strong><strong>Rescue Coach Hedge</strong><small>LIGHTNING · FORGE · DOVE</small></div>';
  if (shot === "mall-spell") content += '<div class="spell-link"></div>';
  if (["quest-horizon", "quest-takeoff"].includes(shot)) content += '<div class="journey-cloud cloud-one"></div><div class="journey-cloud cloud-two"></div>';
  return `<div class="story-shot ${shot} quest-tableau ${outside ? "mall-outside" : inside ? "mall-inside" : "quest-camp"}" aria-hidden="true">${content}</div>`;
}

export function startQuestCinematic(root: HTMLElement, reduced: boolean) {
  const svg = root.querySelector<SVGElement>("[data-quest-flight]");
  if (!svg || reduced) return () => {};
  let handle = 0, start: number | undefined, disposed = false;
  const tick: FrameRequestCallback = now => {
    if (disposed) return;
    start ??= now;
    const f = questFrames.flight, phase = Math.floor((now-start) / 160) % 2, r = f.frames[phase], o = f.offsets[phase];
    const rect = svg.querySelector("rect")!, image = svg.querySelector("image")!;
    for (const [key, value] of Object.entries({ x:o[0], y:o[1], width:r[2], height:r[3] })) rect.setAttribute(key, String(value));
    image.setAttribute("x", String(o[0]-r[0])); image.setAttribute("y", String(o[1]-r[1]));
    handle = requestAnimationFrame(tick);
  };
  handle = requestAnimationFrame(tick);
  return () => { disposed = true; cancelAnimationFrame(handle); };
}
