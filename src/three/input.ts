const moveCodes=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ControlLeft','ShiftLeft','ShiftRight']);
const actionCodes=new Set(['Space','KeyC','KeyQ','KeyE','KeyF','KeyR','KeyM','Escape']);

export function controls(canvas:HTMLCanvasElement,stick:HTMLElement,hooks:{
  enabled:()=>boolean; look:(x:number,y:number)=>void; zoom:(delta:number)=>void; act:(code:string)=>void;
}) {
  const lifecycle=new AbortController(), options={signal:lifecycle.signal};
  const keys=new Set<string>();
  let stickId:number|undefined,sx=0,sy=0;
  let pointer:{id:number;x:number;y:number;move:number}|undefined;
  const knob=stick.querySelector<HTMLElement>('span')!;
  const reset=()=>{keys.clear();stickId=undefined;pointer=undefined;sx=0;sy=0;knob.style.transform='';};
  window.addEventListener('blur',reset,options);
  document.addEventListener('keydown',event=>{
    if(!(moveCodes.has(event.code)||actionCodes.has(event.code))||event.target instanceof HTMLSelectElement||event.target instanceof HTMLInputElement)return;
    if(event.code==='Escape'||event.code==='KeyM'){event.preventDefault();if(!event.repeat)hooks.act(event.code);return;}
    if(!hooks.enabled())return;
    event.preventDefault();
    if(moveCodes.has(event.code))keys.add(event.code);else if(!event.repeat)hooks.act(event.code);
  },options);
  document.addEventListener('keyup',event=>keys.delete(event.code),options);
  canvas.addEventListener('contextmenu',e=>e.preventDefault(),options);
  canvas.addEventListener('pointerdown',e=>{
    if(!hooks.enabled()||pointer||(e.button!==0&&e.button!==2))return;
    pointer={id:e.pointerId,x:e.clientX,y:e.clientY,move:0};canvas.setPointerCapture(e.pointerId);
  },options);
  canvas.addEventListener('pointermove',e=>{
    if(pointer?.id!==e.pointerId||!hooks.enabled())return;
    const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
    pointer.x=e.clientX;pointer.y=e.clientY;pointer.move+=Math.hypot(dx,dy);hooks.look(dx,dy);
  },options);
  canvas.addEventListener('pointerup',e=>{
    if(pointer?.id!==e.pointerId)return;
    if(pointer.move<5&&e.pointerType==='mouse'&&e.button===0)hooks.act('KeyQ');
    pointer=undefined;
  },options);
  canvas.addEventListener('lostpointercapture',e=>{if(pointer?.id===e.pointerId)pointer=undefined;},options);
  canvas.addEventListener('wheel',e=>{if(hooks.enabled()){e.preventDefault();hooks.zoom(e.deltaY);}}, {...options,passive:false});
  const moveStick=(e:PointerEvent)=>{
    const bounds=stick.getBoundingClientRect(),range=bounds.width*.34;
    const x=e.clientX-bounds.left-bounds.width/2,y=e.clientY-bounds.top-bounds.height/2,d=Math.max(range,Math.hypot(x,y));
    sx=x/d;sy=-y/d;knob.style.transform=`translate(${sx*range}px,${-sy*range}px)`;
  };
  stick.addEventListener('pointerdown',e=>{if(hooks.enabled()&&stickId===undefined){stickId=e.pointerId;stick.setPointerCapture(stickId);moveStick(e);}},options);
  stick.addEventListener('pointermove',e=>{if(stickId===e.pointerId)moveStick(e);},options);
  stick.addEventListener('lostpointercapture',e=>{
    if(stickId===e.pointerId){stickId=undefined;sx=0;sy=0;knob.style.transform='';}
  },options);
  stick.addEventListener('pointerup',e=>{if(stick.hasPointerCapture(e.pointerId))stick.releasePointerCapture(e.pointerId);},options);
  const key=(...codes:string[])=>codes.some(c=>keys.has(c));
  return {reset,
    read:()=>({right:sx+Number(key('KeyD','ArrowRight'))-Number(key('KeyA','ArrowLeft')),
      forward:sy+Number(key('KeyW','ArrowUp'))-Number(key('KeyS','ArrowDown')),
      sprint:key('ShiftLeft','ShiftRight'),walk:key('ControlLeft')||(Math.hypot(sx,sy)>0&&Math.hypot(sx,sy)<.46)}),
    dispose(){lifecycle.abort();reset();},
  };
}
