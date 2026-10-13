const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// Game state
let keys = {};
let mouse = {x: W/2, y: H/2, down:false};

class Player{
  constructor(){
    this.x = W/2; this.y = H - 80; this.r = 12;
    this.speed = 2.6; this.color = '#c22';
    this.water = 100; this.maxWater = 100;
  }
  move(){
    let dx = 0, dy = 0;
    if(keys['KeyW']) dy -= 1;
    if(keys['KeyS']) dy += 1;
    if(keys['KeyA']) dx -= 1;
    if(keys['KeyD']) dx += 1;
    if(dx||dy){
      const len = Math.hypot(dx,dy); dx/=len; dy/=len;
      this.x += dx * this.speed;
      this.y += dy * this.speed;
    }
    // clamp
    this.x = Math.max(20, Math.min(W-20, this.x));
    this.y = Math.max(20, Math.min(H-20, this.y));
  }
  draw(){
    // body
    ctx.fillStyle = this.color;
    ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
    // helmet
    ctx.fillStyle = '#ff6666'; ctx.beginPath(); ctx.arc(this.x, this.y-6, this.r-6, 0, Math.PI*2); ctx.fill();
  }
}

class Fire{
  constructor(x,y){ this.x=x; this.y=y; this.r=18; this.intensity=100; }
  update(dt){
    if(this.intensity<=0) return;
    // slowly burn out when tiny
    this.intensity = Math.max(0, this.intensity - 0.005*dt);
  }
  draw(){
    if(this.intensity<=0) return;
    const t = this.intensity/100;
    const glow = Math.floor(160 + 95*t);
    ctx.fillStyle = `rgba(255,${80 + Math.floor(120*t)},0,${0.9})`;
    ctx.beginPath(); ctx.arc(this.x,this.y,this.r*(0.6+0.8*(1-t)),0,Math.PI*2); ctx.fill();
    // core
    ctx.fillStyle = `rgba(255,${30 + Math.floor(220*t)},0,1)`;
    ctx.beginPath(); ctx.arc(this.x,this.y,this.r*(0.3+0.7*t),0,Math.PI*2); ctx.fill();
  }
}

class MChS{
  constructor(){ this.x = 80; this.y = 80; this.r = 11; this.color='#ffdd99'; this.speed = 1.8; this.cooldown=0; }
  update(dt){
    // find nearest fire
    const alive = fires.filter(f=>f.intensity>0);
    if(alive.length===0) return;
    let nearest = alive[0], best = dist(this.x,this.y,nearest.x,nearest.y);
    for(let f of alive){ const d = dist(this.x,this.y,f.x,f.y); if(d<best){best=d;nearest=f}} 
    // move toward it
    const angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
    this.x += Math.cos(angle)*this.speed;
    this.y += Math.sin(angle)*this.speed;
    // if close, reduce intensity
    if(best < 24 && this.cooldown <= 0){ nearest.intensity = Math.max(0, nearest.intensity - 32); this.cooldown = 600; }
    this.cooldown -= dt;
  }
  draw(){ ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); }
}

class FireMonster{
  constructor(){ this.x = 200; this.y = 200; this.r=14; this.color='#9b59b6'; this.timer=0; }
  update(dt){
    // wander
    this.timer -= dt;
    if(this.timer <= 0){ this.vx = (Math.random()-0.5)*1.6; this.vy = (Math.random()-0.5)*1.6; this.timer = 1500 + Math.random()*2400; }
    this.x += this.vx; this.y += this.vy;
    this.x = clamp(this.x, 40, W-40); this.y = clamp(this.y,40,H-40);
    // sometimes spawn new fire
    if(Math.random() < 0.002){ spawnFire(this.x + (Math.random()-0.5)*80, this.y + (Math.random()-0.5)*80); }
  }
  draw(){ ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); }
}

// helpers
function dist(x1,y1,x2,y2){ return Math.hypot(x2-x1,y2-y1); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

// world objects
const player = new Player();
const fires = [];
const mch = new MChS();
const monster = new FireMonster();
const ponds = [ {x:W-80,y:H-80,r:30} ];

// spawn some initial fires
for(let i=0;i<7;i++) spawnFire(120 + Math.random()*(W-240), 80 + Math.random()*(H-240));

function spawnFire(x,y){ x = clamp(x,40,W-40); y = clamp(y,40,H-40); fires.push(new Fire(x,y)); }

// input
window.addEventListener('keydown', e=>{ keys[e.code]=true; });
window.addEventListener('keyup', e=>{ keys[e.code]=false; });
canvas.addEventListener('mousemove', e=>{ const r=canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
canvas.addEventListener('mousedown', e=>{ mouse.down=true; });
window.addEventListener('mouseup', e=>{ mouse.down=false; });

// main loop
let last = performance.now();
function loop(now){
  const dt = now - last; last = now;
  update(dt); draw(); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function update(dt){
  player.move(); player.draw();
  // water spray
  if(mouse.down && player.water > 0){
    player.water = Math.max(0, player.water - 0.45 * dt/16);
    // apply to fires in cone
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    for(let f of fires){
      const d = dist(player.x,player.y,f.x,f.y);
      if(d < 220){
        const a = Math.atan2(f.y - player.y, f.x - player.x);
        const da = Math.abs(angleDiff(angle,a));
        if(da < 0.5){ // within cone
          const power = (1 - d/220) * 0.8;
          f.intensity = Math.max(0, f.intensity - power*1.8*dt/16);
          if(Math.random() < 0.02) spawnSteam(f.x,f.y);
        }
      }
    }
  } else {
    // slight regen of water when not spraying near pond
  }

  // refill if in pond
  for(let p of ponds){ if(dist(player.x,player.y,p.x,p.y) < p.r + 6){ player.water = Math.min(player.maxWater, player.water + 0.9 * dt/16); } }

  // update objects
  for(let f of fires) f.update(dt);
  mch.update(dt); monster.update(dt);

  // fire spreading: fires with high intensity can spawn new fires nearby
  if(Math.random() < 0.01){
    const strong = fires.filter(f=>f.intensity>60);
    if(strong.length){ const f = strong[Math.floor(Math.random()*strong.length)]; if(Math.random()<0.5) spawnFire(f.x + (Math.random()-0.5)*80, f.y + (Math.random()-0.5)*80); }
  }

  // fire monster makes new fires more often when many fires exist
  if(Math.random() < 0.002 + fires.filter(f=>f.intensity>0).length*0.0006){ spawnFire(monster.x + (Math.random()-0.5)*60, monster.y + (Math.random()-0.5)*60); }

  // update HUD
  document.getElementById('fireCount').innerText = fires.filter(f=>f.intensity>0).length;
  const fill = document.getElementById('waterFill'); fill.style.width = `${(player.water/player.maxWater)*100}%`;
}

function angleDiff(a,b){ let d = a-b; while(d>Math.PI) d-=Math.PI*2; while(d<-Math.PI) d+=Math.PI*2; return d; }

// simple steam effect (visual only)
const steams = [];
function spawnSteam(x,y){ steams.push({x,y,life:600 + Math.random()*400, r:6 + Math.random()*6}); }

function draw(){
  // background
  ctx.clearRect(0,0,W,H);
  // trees (just dots)
  for(let i=0;i<120;i++){ const tx = (i*47) % (W-80) + 40; const ty = (i*83) % (H-80) + 40; ctx.fillStyle = '#144a14'; ctx.fillRect(tx,ty,2,2); }

  // ponds
  for(let p of ponds){ ctx.fillStyle='#2f9fff'; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }

  // fires
  for(let f of fires) f.draw();

  // steams
  for(let s of steams){ s.life -= 16; if(s.life<=0) continue; ctx.fillStyle='rgba(200,220,255,0.7)'; ctx.beginPath(); ctx.arc(s.x,s.y, s.r*(s.life/800),0,Math.PI*2); ctx.fill(); }
  // remove dead steams
  for(let i=steams.length-1;i>=0;i--) if(steams[i].life<=0) steams.splice(i,1);

  // monster & mch
  monster.draw(); mch.draw();

  // player
  player.draw();

  // water beam
  if(mouse.down && player.water>0){ ctx.strokeStyle='rgba(150,220,255,0.9)'; ctx.lineWidth=6; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(player.x,player.y); ctx.lineTo(mouse.x,mouse.y); ctx.stroke(); }

  // HUD overlay
  ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(6,6,230,64);
}

// simple startup messages
console.log('Firefighting demo loaded. WASD to move, mouse to aim, hold mouse to spray water. Refill at blue ponds.');
