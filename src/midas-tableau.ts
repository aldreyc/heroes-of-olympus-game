import type { Beat } from "./story";
import { midasFrames } from "./midas-frames";
import { storyFrames } from "./story-frames";
import { spriteSvg } from "./sprite-svg";
import { walkingActor } from "./story-walk";
let nextGoldId=0;
function figure(name: keyof typeof storyFrames | "hephaestus" | "kneeling" | "king", gold=false) {
  const f = name==="king" ? {...midasFrames.king,rect:midasFrames.king.frames[0]} : name==="hephaestus" || name==="kneeling" ? midasFrames[name] : storyFrames[name];
  let svg=spriteSvg(f.file,f.size,f.rect);
  if(gold){const id=`story-gold-${++nextGoldId}`;svg=svg.replace("<defs>",`<defs><filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues=".12 1"/><feFuncG type="table" tableValues=".07 .83"/><feFuncB type="table" tableValues=".02 .24"/></feComponentTransfer></filter>`).replace("<image ",`<image filter="url(#${id})" `);}
  return `<div class="midas-actor ${name} ${gold?"is-gold":""}">${svg}</div>`;
}
function wreck(){const f=midasFrames.damaged;return `<div class="festus-wreck">${spriteSvg(f.file,f.size,f.rect)}</div>`;}
function watchers(){return figure("jason")+figure("piper")+figure("hedge");}
function blast(){return `<svg class="landing-explosion" viewBox="0 0 1280 720"><g class="blast-cloud"><ellipse cx="870" cy="530" rx="280" ry="85" fill="#4a3a35" opacity=".8"/><circle cx="790" cy="445" r="117" fill="#754836"/><circle cx="930" cy="419" r="135" fill="#914322"/><circle cx="867" cy="481" r="170" fill="#ee7623"/><circle cx="872" cy="480" r="112" fill="#ffbf52"/><circle cx="870" cy="495" r="63" fill="#fff2bd"/></g><g class="blast-snow">${Array.from({length:26},(_,i)=>`<rect x="${610+i*83%520}" y="${335+i*61%220}" width="${5+i%4*3}" height="${5+i%3*3}" fill="${i%2?"#dceeff":"#fbc46b"}"/>`).join("")}</g></svg>`;}
function goldFriends(turning=false){
  return ["piper","leo"].map((name,i)=> turning ? `<div class="gold-friend ${name}" style="--gold-delay:${1.5+i*.8}s"><div class="living-friend">${figure(name as "piper"|"leo")}</div><div class="golden-friend">${figure(name as "piper"|"leo",true)}</div></div>` : figure(name as "piper"|"leo",true)).join("");
}
export function midasTableau(b: Beat) {
  const shot=b.shot!,inside=["midas-friends-gold","midas-reveal","midas-victory","midas-aftermath"].includes(shot);
  let content="";
  if(shot==="midas-crash")content=watchers()+figure("leo")+wreck()+blast();
  if(shot==="midas-repair")content=watchers()+wreck()+figure("kneeling");
  if(["midas-hephaestus","midas-forge-words"].includes(shot))content=watchers()+wreck()+figure("kneeling")+figure("hephaestus")+'<div class="forge-glow"></div>';
  if(shot==="midas-ascension")content=watchers()+figure("kneeling")+`<div class="forge-ascension">${figure("hephaestus")}${wreck()}<div class="forge-glow"></div></div>`;
  if(shot==="midas-enter")content=walkingActor("jason")+walkingActor("piper")+walkingActor("leo")+figure("hedge");
  if(shot==="midas-friends-gold")content=figure("jason")+goldFriends(true)+'<svg class="friends-gold-blasts" viewBox="0 0 1280 720"><path class="piper-gold-blast" d="M1260 330L544 425" stroke="#ffdf79" stroke-width="8"/><path class="leo-gold-blast" d="M1260 370L736 425" stroke="#fff0a1" stroke-width="8"/></svg>';
  if(["midas-reveal","midas-victory"].includes(shot))content=figure("jason")+goldFriends()+figure("king");
  if(shot==="midas-aftermath")content=figure("jason")+goldFriends();
  return `<div class="story-shot ${shot} midas-sequence ${inside?"midas-inside":"midas-outside"}" aria-hidden="true">${content}</div>`;
}
