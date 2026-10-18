type Ink = any;
export function drawMidasAtmosphere(g: Ink, floor: Ink, s: any) {
  g.clear();floor.clear();
  floor.lineStyle(2,0xebce72,.25);floor.strokeEllipse(s.ex,592,150,26);
  for(let i=0;i<(s.reduced?6:18);i++) {
    const x=(i*211+s.clock*8)%1280,y=180+(i*83)%370;
    g.fillStyle(i%2?0xffed9c:0xc69b42,.18+Math.sin(s.clock+i)**2*.2);g.fillRect(x,y,3,3);
  }
}
export function drawMidasBolts(g: Ink, s: any) {
  if(s.pendingResult!==null)return;
  if(s.enemyPhase==="tell") {
    g.lineStyle(2,0xffde70,.75);g.strokeCircle(s.ex+(s.ex>s.x?-135:135),s.enemyMove==="low"?440:375,22+Math.sin(s.clock*7)*5);
    if(s.enemyMove==="low") {g.fillStyle(0xf3c74e,.1);g.fillRect(45,550,1190,40);}
  }
  for(const b of s.goldBolts) {
    if(b.delay>0)continue;
    const tail=b.vx>0?-1:1;
    for(let i=4;i>0;i--) {g.fillStyle(0xf2bc46,.12*(5-i));g.fillRect(b.x+tail*i*10-5,b.y-4,10,8);}
    g.fillStyle(0x916222,1);g.fillTriangle(b.x-16,b.y,b.x,b.y-16,b.x+16,b.y);g.fillTriangle(b.x-16,b.y,b.x,b.y+16,b.x+16,b.y);
    g.fillStyle(0xffe27d,1);g.fillTriangle(b.x-11,b.y,b.x,b.y-13,b.x+11,b.y);g.fillTriangle(b.x-11,b.y,b.x,b.y+11,b.x+11,b.y);
    g.fillStyle(0xfff8c8,1);g.fillRect(b.x-2,b.y-7,4,10);
  }
}
