import { CHASE, attackX, currentWarning } from "./dragon-chase-model.mjs";
import { chaseFrames } from "./chase-frames";
type State = ReturnType<typeof import("./dragon-chase-model.mjs").createChase>;
export type ChaseImages = Record<string, CanvasImageSource>;
const W = 1280, H = 720;
function sprite(ctx: CanvasRenderingContext2D, images: ChaseImages, which: keyof typeof chaseFrames, frame: number, x: number, bottom: number, height: number) {
  const a = chaseFrames[which], r = a.frames[frame % a.frames.length];
  const scale = height / a.logical[1], width = scale * a.logical[0], offset = a.offsets[frame % a.frames.length];
  const left = x - width / 2 + offset[0] * scale, top = bottom - height + offset[1] * scale;
  const mask = a.masks[frame % a.frames.length];
  ctx.save();
  if(mask.length){ctx.beginPath();for(const [i,p]of mask.entries())i?ctx.lineTo(left+p[0]*scale,top+p[1]*scale):ctx.moveTo(left+p[0]*scale,top+p[1]*scale);ctx.closePath();ctx.clip();}
  ctx.drawImage(images[a.file], r[0], r[1], r[2], r[3], left, top, r[2] * scale, r[3] * scale);
  ctx.restore();
}
export function drawChaseFire(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, reduced: boolean) {
  ctx.save();
  const halo = ctx.createRadialGradient(x - 45, y, 6, x - 45, y, 180);
  halo.addColorStop(0, "#ffb94380"); halo.addColorStop(1, "#ff781000");
  ctx.fillStyle = halo; ctx.fillRect(x - 225, y - 180, 360, 360);
  for (const [layer, color] of ["#8f1e17", "#ef4b16", "#ff971d", "#ffe36a", "#fff4c8"].entries()) {
    const radius = 28 - layer * 4.5, length = 200 - layer * 28;
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + 16 - layer * 3, y);
    for (let i = 0; i <= 14; i++) {
      const dx = -length * i / 14;
      const wave = Math.sin(i * 2.4 + (reduced ? 0 : t * 22)) * 6;
      ctx.lineTo(Math.round((x + dx) / 4) * 4, Math.round((y - radius * (1 - i / 17) + wave) / 4) * 4);
    }
    for (let i = 14; i >= 0; i--) {
      const dx = -length * i / 14, wave = Math.cos(i * 1.7 + (reduced ? 0 : t * 19)) * 5;
      ctx.lineTo(Math.round((x + dx) / 4) * 4, Math.round((y + radius * (1 - i / 17) + wave) / 4) * 4);
    }
    ctx.closePath(); ctx.fill();
  }
  if (!reduced) for (let i = 0; i < 13; i++) {
    const phase = (t * 2 + i * .173) % 1;
    ctx.globalAlpha = 1 - phase; ctx.fillStyle = i % 2 ? "#ffb645" : "#ffe99e";
    ctx.fillRect(x - 90 - phase * 190, y + Math.sin(i * 31) * (12 + phase * 40), 4, 4);
  }
  ctx.restore();
}
function vat(ctx: CanvasRenderingContext2D, x: number, floor: number, t: number) {
  ctx.fillStyle = "#171c25"; ctx.fillRect(x - 58, floor - 58, 116, 53);
  ctx.fillStyle = "#8b6450"; ctx.fillRect(x - 62, floor - 64, 124, 12); ctx.fillRect(x - 58, floor - 12, 116, 7);
  ctx.fillStyle = "#3b1416"; ctx.fillRect(x - 52, floor - 65, 104, 6);
  ctx.fillStyle = "#e4aa61"; for (const dx of [-46, 0, 46]) ctx.fillRect(x + dx, floor - 35, 4, 4);
  ctx.fillStyle = "#b92e25"; ctx.fillRect(x + 67, floor - 41, 11, 37);ctx.fillStyle = "#e1d5a3";ctx.fillRect(x + 67, floor - 34, 11, 14);ctx.fillStyle = "#377d3c";ctx.fillRect(x + 69, floor - 48, 7, 8);
  ctx.fillStyle = "#343c40";ctx.fillRect(x + 84, floor - 46, 25, 42);ctx.fillStyle = "#d0ac65";ctx.fillRect(x + 91, floor - 54, 13, 8);
  ctx.fillStyle = "#ffdd93";ctx.font = "bold 15px sans-serif";ctx.textAlign = "center";ctx.fillText("TABASCO + MOTOR OIL", x, floor - 101);
  const bob = Math.sin(t * 4) * 4;ctx.beginPath();ctx.moveTo(x, floor - 77 + bob);ctx.lineTo(x - 8, floor - 88 + bob);ctx.lineTo(x + 8, floor - 88 + bob);ctx.fill();
}
export function drawDragonChase(ctx: CanvasRenderingContext2D, s: State, images: ChaseImages, reduced: boolean) {
  const t = s.time, floor = CHASE.floor;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#071824";ctx.fillRect(0, 0, W, H);
  // A single distant forest keeps one moon; closer trees and debris move faster.
  ctx.drawImage(images["camp-woods-v2.png"], -t * 3.5, 0, W + 200, H);
  const treeScroll = reduced ? 0 : t * 135 % 1120;
  ctx.globalAlpha=.8;
  for(let i=0;i<3;i++)ctx.drawImage(images["chase-trees-v1.png"],i*1120-treeScroll,-78,1120,630);
  ctx.globalAlpha=1;
  const tint = ctx.createLinearGradient(0, 0, 0, H);tint.addColorStop(0, "#08132766");tint.addColorStop(.7, "#071b2600");tint.addColorStop(1, "#020a14bb");ctx.fillStyle=tint;ctx.fillRect(0,0,W,H);
  const dragonCenter = 240 + s.stumbles * 18, dragonHeight = 340;
  ctx.fillStyle = "#02090a66";ctx.beginPath();ctx.ellipse(dragonCenter, floor + 2, 220, 13, 0, 0, Math.PI * 2);ctx.fill();
  sprite(ctx, images, "dragon", reduced ? 0 : Math.floor(t * 8), dragonCenter, floor, dragonHeight);
  const grounded = s.y === 0, duck = grounded && s.duck;
  const heroFrame = s.mode === "ready" ? 7 : !grounded ? 6 : duck ? 4 + Math.floor(t * 10) % 2 : Math.floor(t * 10) % 4;
  ctx.fillStyle="#03090c77";ctx.beginPath();ctx.ellipse(CHASE.heroX, floor + 2, grounded ? 46 : 30, 8, 0, 0, Math.PI*2);ctx.fill();
  ctx.save();if(s.flash>0)ctx.globalAlpha=.55+Math.sin(t*50)*.25;
  sprite(ctx, images, "leo", heroFrame, CHASE.heroX, floor+s.y, 192);ctx.restore();
  for(const a of s.attacks)if(a.fired){
    const x=attackX(s,a),aim=Math.max(0,Math.min(1,(x-CHASE.fireX)/(CHASE.heroX-CHASE.fireX)));
    const targetY=floor-(a.kind==="high"?142:25),y=365+(targetY-365)*aim;
    if(x>=CHASE.fireX&&x<W+240)drawChaseFire(ctx,x,y,t,reduced);
  }
  const warning = currentWarning(s);
  if(warning){
    const y=floor-(warning.kind==="high"?142:25);ctx.strokeStyle="#ffe6bbaa";ctx.lineWidth=2;ctx.setLineDash([10,12]);ctx.beginPath();ctx.moveTo(600,y);ctx.lineTo(1010,y);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#081322e8";ctx.fillRect(620,160,410,76);ctx.strokeStyle="#efbc69";ctx.strokeRect(620,160,410,76);
    ctx.textAlign="center";ctx.fillStyle="#ffe3a2";ctx.font="bold 27px sans-serif";ctx.fillText(warning.kind==="low"?"LOW FIRE · JUMP!":"HIGH FIRE · DUCK!",825,194);
    ctx.font="14px sans-serif";ctx.fillStyle="#c0ced8";ctx.fillText(warning.kind==="low"?"W / ↑ / SPACE":"HOLD S / ↓",825,221);
  }
  if(!reduced)for(let i=0;i<22;i++){
    const phase=(t*1.4+i*.17)%1,x=CHASE.heroX-phase*320;
    ctx.globalAlpha=(1-phase)*.38;ctx.fillStyle=i%2?"#c3a57c":"#d2cab0";ctx.fillRect(x,floor+5+Math.sin(i*16)*8,4+phase*4,3);
  }
  ctx.globalAlpha=1;
  if(t>CHASE.duration-5)vat(ctx,CHASE.heroX+(CHASE.duration-t)*160,floor,t);
  ctx.fillStyle="#06202a";for(let i=0;i<18;i++){const x=((i*179-t*360)%1500+1500)%1500-90;ctx.beginPath();ctx.moveTo(x,H);ctx.lineTo(x+35,H-62-(i%3)*18);ctx.lineTo(x+19,H-10);ctx.lineTo(x+68,H-39);ctx.lineTo(x+50,H);ctx.fill();}
  ctx.restore();
}
