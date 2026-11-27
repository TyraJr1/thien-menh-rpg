import '@fontsource-variable/playfair-display';
import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/latin-600.css';
import '@fontsource/be-vietnam-pro/vietnamese-600.css';
import './style.css';
import { advance, newGame, parseSave } from '../game/state';
import { attributes, blades } from '../game/character';
import { chapter } from '../chapters/prologue';
import { destinations, distance, houses, pathX, riverX } from './terrain';
import type { Target } from './terrain';
import { presets, qualityKey, storedQuality } from './quality';
import type { Preset, Quality } from './quality';
import type { Frame, Mode, World } from './world';

const app=document.querySelector<HTMLElement>('#game')!;
const saveKey='thien-menh.v4.3d';
const qualityModes=['auto','battery','low','medium','high','ultra'] as const;
let quality=storedQuality(),world:World|undefined,state=newGame(),restored=false,practice=false;
let mode:Mode='menu',frame:Frame|undefined,line=0,mapTime=0,toastTimer=0,audio:AudioContext|undefined,sound=false;
let returnFocus:HTMLElement|null=null;
try{
  const txt=localStorage.getItem(saveKey);
  if(txt){
    const saved=JSON.parse(txt),story=parseSave(JSON.stringify(saved.state));
    if(story?.chapter==='prologue'&&story.step<=2&&!story.combat){state=story;restored=true;practice=story.step===2&&saved.practice===true;}
  }
}catch{/* A corrupt save must never block the menu. */}

app.innerHTML=`
 <canvas id="world3d" aria-label="Thế giới 3D bến Vân Thủy"></canvas>
 <div class="lens" aria-hidden="true"></div>
 <section id="intro3d">
   <div class="copper-edge" aria-hidden="true"></div>
   <div class="opening">
     <div class="story-mark"><span class="seal">天</span><span>Khúc dạo<b>Bến Vân Thủy</b></span></div>
     <h1>Thiên Mệnh</h1>
     <p>Hành Trình Giang Hồ</p>
     <div class="start-row">
       <button id="start3d" class="gold" data-action="start" disabled><b>${restored?'Tiếp tục hành trình':'Bước vào giang hồ'}</b><span aria-hidden="true">→</span></button>
       <button class="quiet" data-action="full" aria-label="Toàn màn hình">⛶</button>
     </div>
     <div id="boot-text" role="status">Đang dựng cảnh 3D…</div>
   </div>
   <footer><span>Bản thử nghiệm 3D</span><a href="./legacy.html">Vào bản 2.5D ↗</a></footer>
 </section>
 <div id="loading3d" hidden><span class="seal">天</span><p>Đang mở Bến Vân Thủy…</p></div>
 <div id="hud" hidden>
   <div class="map-frame"><button data-action="map" aria-label="Bản đồ Vân Thủy"><canvas id="minimap" width="140" height="140"></canvas><span>B</span></button>
     <div><strong>Bến Vân Thủy</strong><small>Khúc dạo</small></div>
   </div>
   <section class="objective"><span aria-hidden="true">◇</span><div><h2>Đêm ở bến Vân Thủy</h2><p id="objective"></p></div><small id="range"></small></section>
   <div class="compass" aria-hidden="true"><span>T</span><i></i><b id="heading">B</b><i></i><span>Đ</span></div>
   <nav class="utilities" aria-label="Menu trong game">
     <button data-action="map" aria-label="Bản đồ">⌑</button><button data-action="bag" aria-label="Túi đồ">▣</button>
     <button data-action="journal" aria-label="Nhật ký">≡</button><button data-action="settings" aria-label="Cài đặt">⚙</button>
     <button data-action="pause" aria-label="Tạm dừng"><span class="pause-icon"></span></button>
   </nav>
   <div id="marker" aria-hidden="true" hidden><i></i><span></span></div>
   <button id="interact" data-action="interact" class="quiet" hidden><kbd aria-hidden="true">F</kbd><span></span></button>
   <div id="stick" role="img" aria-label="Cần điều khiển cảm ứng"><span></span></div>
   <section class="vitals" aria-label="Tài nguyên nhân vật">
     <header><b>Lữ Khách</b><span id="level">Cấp 1</span></header>
     <div class="vital"><label for="hp">Sinh lực</label><progress id="hp"></progress><span id="hp-text"></span></div>
     <div class="vital qi"><label for="qi">Nội lực</label><progress id="qi" value="5" max="8"></progress><span id="qi-text">5 / 8</span></div>
     <div class="vital spirit"><label for="spirit">Linh lực</label><progress id="spirit"></progress><span id="spirit-text"></span></div>
     <progress id="stamina" aria-label="Thể lực" max="100" value="100"></progress>
   </section>
   <div class="skills">
     <button data-action="dodge" aria-label="Né tránh">⌁<kbd>C</kbd></button><button data-action="jump" aria-label="Nhảy">↑<kbd>Space</kbd></button>
     <button data-action="sweep" aria-label="Quét kiếm">✧<kbd>E</kbd></button><button data-action="strike" aria-label="Vung kiếm">⚔<kbd>Q</kbd></button>
   </div>
   <div class="shortcuts"><span><kbd>WASD</kbd> Di chuyển</span><span><kbd>Shift</kbd> Sprint</span><span>Kéo chuột để xoay camera</span></div>
 </div>
 <div id="conversation" role="dialog" aria-labelledby="speaker" hidden>
   <section class="captions"><header><h2 id="speaker"></h2><button class="link" data-action="skip">Bỏ qua lời thoại</button></header>
     <p id="spoken"></p><div id="answers"></div></section>
 </div>
 <dialog id="panel" aria-labelledby="panel-title"></dialog><div id="notice" role="status" hidden></div>`;

function el<T extends HTMLElement=HTMLElement>(id:string){return document.getElementById(id)! as T;}
const open=el<HTMLButtonElement>('start3d'),panel=el<HTMLDialogElement>('panel'),marker=el('marker'),near=el<HTMLButtonElement>('interact');
const target=():Target=>state.step===0?'ferry':state.step===1?'lamp':'practice';
const ranges={ferry:2.25,lamp:2.22,practice:2.4};
function setMode(next:Mode){
  mode=next;app.dataset.mode=mode;world?.setMode(mode);
  el('intro3d').hidden=mode!=='menu';el('loading3d').hidden=mode!=='loading';
  el('hud').hidden=mode!=='play';el('conversation').hidden=mode!=='dialogue';
}
function announce(text:string){
  clearTimeout(toastTimer);el('notice').textContent=text;el('notice').hidden=false;
  toastTimer=window.setTimeout(()=>{el('notice').hidden=true;},2700);
}
function save(){
  try{localStorage.setItem(saveKey,JSON.stringify({state,practice}));}
  catch{announce('Trình duyệt chưa cho phép lưu tiến trình.');}
  open.querySelector('b')!.textContent='Tiếp tục hành trình';
}
function tone(hz:number){
  if(!sound||!window.AudioContext)return;
  try{
    audio??=new AudioContext();void audio.resume().catch(()=>{});
    const oscillator=audio.createOscillator(),env=audio.createGain(),t=audio.currentTime;
    oscillator.frequency.setValueAtTime(hz,t);oscillator.frequency.exponentialRampToValueAtTime(hz*.67,t+.18);
    env.gain.setValueAtTime(.05,t);env.gain.exponentialRampToValueAtTime(.0001,t+.18);
    oscillator.connect(env).connect(audio.destination);oscillator.start();oscillator.stop(t+.18);
    oscillator.onended=()=>{oscillator.disconnect();env.disconnect();};
  }catch{/* Audio is an optional effect. */}
}
function progress(id:string,value:number,max:number){
  const bar=el<HTMLProgressElement>(id);bar.max=max;bar.value=value;el(id+'-text').textContent=`${value} / ${max}`;
}
function mission(){
  world?.target(target());
  marker.querySelector('span')!.textContent=destinations[target()].title;
  el('objective').textContent=state.step===0?'Gặp Lão Chu ở bến đò.':state.step===1?'Tìm manh mối tại đèn đá.'
    :practice?'Đã tìm đường lên Tàng Phong.':'Tùy chọn: thử ba nhát kiếm tại bãi tập.';
  const stats=attributes(state);el('level').textContent='Cấp '+stats.level;
  progress('hp',state.hp,stats.maxHp);progress('spirit',state.spirit,stats.spirit);
}
function map(canvas:HTMLCanvasElement,pos:Frame,broad:boolean){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const w=canvas.width,h=canvas.height,cx=broad?7:pos.x,cz=broad?18:pos.z,s=broad?Math.min(w/52,h/53):5.1;
  const project=(x:number,z:number):[number,number]=>[w/2+(x-cx)*s,h/2-(z-cz)*s];
  ctx.fillStyle='#253b37';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#6c9b7f35';ctx.lineWidth=1;
  for(let i=-7;i<14;i++){
    const [x,y]=project(i*5,i*5);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();
  }
  const route=(x:(z:number)=>number,color:string,width:number)=>{
    ctx.strokeStyle=color;ctx.lineWidth=width*s;ctx.beginPath();
    for(let z=-9;z<60;z++){const p=project(x(z),z);if(z===-9)ctx.moveTo(...p);else ctx.lineTo(...p);}ctx.stroke();
  }
  route(riverX,'#558283',10);route(pathX,'#ac976d',1.87);
  for(const item of houses){
    const [x,y]=project(item.x-item.w/2,item.z+item.d/2);
    ctx.fillStyle='#94735b';ctx.fillRect(x,y,item.w*s,item.d*s);
  }
  const goal=destinations[target()];let [gx,gy]=project(goal.x,goal.z);
  const radius=Math.hypot(gx-w/2,gy-h/2);
  if(!broad&&radius>w*.41){gx=w/2+(gx-w/2)*w*.41/radius;gy=h/2+(gy-h/2)*w*.41/radius;}
  ctx.fillStyle='#fce39b';ctx.beginPath();ctx.moveTo(gx,gy-6);ctx.lineTo(gx+5,gy);ctx.lineTo(gx,gy+6);ctx.lineTo(gx-5,gy);ctx.fill();
  const [px,py]=project(pos.x,pos.z);ctx.save();ctx.translate(px,py);ctx.rotate(pos.yaw);
  ctx.fillStyle='#f0fff3';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(6,6);ctx.lineTo(0,3);ctx.lineTo(-6,6);ctx.fill();ctx.restore();
}
function onFrame(next:Frame){
  frame=next;
  Object.assign(app.dataset,{x:next.x.toFixed(3),y:next.y.toFixed(3),z:next.z.toFixed(3),yaw:next.yaw.toFixed(3),
    jumpPeak:next.jumpPeak.toFixed(3),speed:next.speed.toFixed(2),grounded:String(next.grounded),fps:next.fps.toFixed(1),clip:next.clip,hits:String(next.hits),clearance:next.clearance.toFixed(3)});
  if(mode!=='play')return;
  const goal=target(),d=distance(next,destinations[goal]);
  el('range').textContent=practice?'':`${Math.round(d)} m`;
  near.hidden=goal==='practice'||d>ranges[goal]||!next.grounded;
  near.querySelector('span')!.textContent=goal==='ferry'?'Trò chuyện với Lão Chu':'Xem đèn đá';
  el('heading').textContent=['B','Đ','N','T'][(Math.round(next.yaw/(Math.PI/2))%4+4)%4];
  el<HTMLProgressElement>('stamina').value=next.stamina;progress('qi',next.qi,8);
  if(performance.now()-mapTime>150){map(el<HTMLCanvasElement>('minimap'),next,false);mapTime=performance.now();}
}
function choices(skip=false) {
  const current=chapter.scenes[state.step];
  if(!current)return;
  const lines=current.lines(state);
  if(skip)line=lines.length-1;
  el('speaker').textContent=current.name;el('spoken').textContent=lines[line];
  el('answers').innerHTML=line<lines.length-1?'<button class="quiet" data-action="next">Tiếp theo →</button>'
    :current.choices.map((c,i)=>`<button class="quiet" data-action="choice" data-choice="${i}">${c.text}</button>`).join('');
  el('answers').querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});
}
function interact(){
  if(mode!=='play'||near.hidden||!frame||distance(frame,destinations[target()])>ranges[target()])return;
  line=0;setMode('dialogue');tone(450);choices();
}
function answer(index:number){
  const selected=chapter.scenes[state.step]?.choices[index];
  if(mode!=='dialogue'||!selected)return;
  state=advance(state,selected.stance);save();setMode('play');mission();
  announce(state.step===1?'Đã nhận Mộc Ấn.':'Đã tìm ra lối lên Tàng Phong.');
}
function fullscreen(){
  if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});
  else if(document.documentElement.requestFullscreen)void document.documentElement.requestFullscreen().catch(()=>announce('Đang chơi vừa khung màn hình.'));
}
function qualityInfo(){
  const p=presets[app.dataset.quality as Preset];
  el('render-info').textContent=p?`${world?.renderer} · ${p.name} · ${Math.round(p.scale*100)}% · ${p.fps} FPS tối đa`:'';
}
async function share(){
  const link=el('share-link'),qr=el('qr'),url=new URL(import.meta.env.BASE_URL,location.origin).href;
  link.textContent=url;
  try{const {toDataURL}=await import('qrcode');const image=new Image(160,160);image.alt='Mã QR mở game';image.src=await toDataURL(url);qr.replaceChildren(image);}
  catch{qr.textContent='Bạn có thể sao chép URL ở phía trên.';}
}
function openPanel(kind:string){
  if(mode!=='play'&&mode!=='paused')return;
  if(mode==='play'){returnFocus=document.activeElement as HTMLElement|null;setMode('paused');}
  const title:Record<string,string>={map:'Bản đồ Vân Thủy',bag:'Túi đồ',journal:'Nhật ký',settings:'Cài đặt',share:'Chia sẻ',pause:'Tạm dừng'};
  let details='';
  if(kind==='map')details='<canvas id="map" width="458" height="360" aria-label="Bản đồ bến Vân Thủy"></canvas><p>◆ Mục tiêu &nbsp; ▲ Lữ Khách</p>';
  else if(kind==='bag')details=`<div class="items"><p><b>${blades[state.blade].name}</b><br>Kiếm mang theo của Lữ Khách.</p>${state.step?'<p><b>Mộc Ấn</b><br>Ấn gỗ Lão Chu trao ở bến.</p>':''}</div>`;
  else if(kind==='journal')details=`<div class="items"><p><b>Khúc dạo · Bến Vân Thủy</b><br>${el('objective').textContent}</p>${state.stance?`<p><b>Lời hứa với Lão Chu</b><br>${state.stance==='compassion'?'Đưa dân làng sang sông an toàn.':'Dẫn kẻ áo đen rời làng.'}</p>`:''}</div>`;
  else if(kind==='settings')details=`<label for="quality">Chất lượng đồ họa</label><select id="quality">${qualityModes.map(p=>`<option value="${p}" ${quality===p?'selected':''}>${p==='auto'?'Auto':presets[p].name}</option>`).join('')}</select><p id="render-info"></p>
   <button class="quiet" data-action="full">Toàn màn hình</button> <button class="quiet" data-action="sound" aria-pressed="${sound}">${sound?'Tắt':'Bật'} âm thanh</button>
   <p>WASD đi, Ctrl đi chậm, Shift sprint, Space nhảy, C né, F tương tác, Q/E dùng kiếm, R hướng camera về mục tiêu, M mở bản đồ. Kéo chuột hoặc vuốt cảnh để xoay, lăn bánh xe để zoom.</p>`;
  else if(kind==='share')details='<p id="share-link"></p><div id="qr"></div><button data-action="copy" class="quiet">Sao chép URL</button>';
  else details='<div class="items"><button class="gold" data-action="close">Tiếp tục →</button><button class="quiet" data-action="settings">Cài đặt</button><button class="quiet" data-action="share">Chia sẻ game</button><button class="quiet" data-action="menu">Về màn chính</button></div>';
  panel.innerHTML=`<header><h2 id="panel-title">${title[kind]??title.pause}</h2><button class="quiet" data-action="close" aria-label="Đóng">×</button></header>${details}`;
  if(!panel.open)panel.showModal();
  if(kind==='map'&&frame)map(el<HTMLCanvasElement>('map'),frame,true);
  if(kind==='settings')qualityInfo();
  if(kind==='share')void share();
}
function act(key:string){
  if(key==='Escape'){if(panel.open)panel.close();else if(mode==='play')openPanel('pause');return;}
  if(mode!=='play')return;
  switch(key){
    case 'Space':world?.jump();break;
    case 'KeyM':openPanel('map');break;
    case 'KeyF':interact();break;
    case 'KeyC':world?.dodge();break;
    case 'KeyQ':world?.strike();tone(160);break;
    case 'KeyE':world?.strike(true);tone(270);break;
    case 'KeyR':announce(world?.lock()?'Đã hướng camera về mục tiêu.':'Camera tự do.');break;
  }
}
async function boot(){
  open.disabled=true;el('boot-text').textContent='Đang dựng cảnh 3D…';
  try{
    const {createWorld}=await import('./world');
    world=await createWorld(el<HTMLCanvasElement>('world3d'),el('stick'),marker,quality,{act,frame:onFrame,
      quality:p=>{app.dataset.quality=p;},hit(count){
        tone(386);
        if(count>=3&&state.step===2&&!practice){practice=true;save();mission();announce('Đã hoàn thành bài luyện kiếm.');}
      }},new URLSearchParams(location.search).get('renderer')==='webgl');
    app.dataset.engine=world.renderer;app.dataset.clips=world.clips.join(', ');app.dataset.ready='true';
    el('boot-text').textContent='';open.disabled=false;mission();
  }catch(error){
    console.error(error);el('boot-text').textContent='Không thể mở cảnh 3D trên thiết bị này. Bạn có thể vào bản 2.5D.';
  }
}
panel.addEventListener('close',()=>{
  if(mode==='paused'){setMode('play');returnFocus?.focus({preventScroll:true});returnFocus=null;}
});
app.addEventListener('change',e=>{
  if(!(e.target instanceof HTMLSelectElement)||e.target.id!=='quality')return;
  const q=e.target.value as Quality;if(!qualityModes.includes(q))return;
  quality=q;world?.quality(q);qualityInfo();try{localStorage.setItem(qualityKey,q);}catch{/* Session still applies. */}
});
app.addEventListener('click',async e=>{
  const button=e.target instanceof Element?e.target.closest<HTMLElement>('[data-action]'):null;
  if(!button)return;
  switch(button.dataset.action){
    case 'start':
      if(mode!=='menu'||!world)return;
      setMode('loading');
      try{await world.prepare();setMode('play');mission();}
      catch(error){console.error(error);setMode('menu');el('boot-text').textContent='Không tải được nhân vật. Hãy thử lại.';}
      break;
    case 'full':fullscreen();break;
    case 'interact':interact();break;
    case 'skip':choices(true);break;
    case 'next':line++;choices();break;
    case 'choice':answer(Number(button.dataset.choice));break;
    case 'jump':act('Space');break;
    case 'dodge':act('KeyC');break;
    case 'strike':act('KeyQ');break;
    case 'sweep':act('KeyE');break;
    case 'close':panel.close();break;
    case 'sound':sound=!sound;tone(430);openPanel('settings');break;
    case 'copy':
      try{await navigator.clipboard.writeText(new URL(import.meta.env.BASE_URL,location.origin).href);button.textContent='Đã sao chép';}
      catch{button.textContent='Chọn và sao chép URL ở trên';}
      break;
    case 'menu':{
      setMode('menu');panel.close();const old=world?.canvas;world?.dispose();world=undefined;
      if(old)old.replaceWith(old.cloneNode(false));
      app.dataset.ready='false';app.dataset.disposals=String(Number(app.dataset.disposals??0)+1);
      await boot();break;
    }
    default:openPanel(button.dataset.action??'pause');
  }
});
window.addEventListener('pagehide',e=>{if(!e.persisted)world?.dispose();});
setMode('menu');mission();void boot();
