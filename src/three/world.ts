import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { ImportMeshAsync } from '@babylonjs/core/Loading/sceneLoader';
import '@babylonjs/loaders/glTF/2.0/glTFLoader';
import '@babylonjs/loaders/glTF/glTFFileLoader';
import type { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Scene } from '@babylonjs/core/scene';
import { controls } from './input';
import { facingToward, move, spawnBody } from './motor';
import { presets, selectPreset } from './quality';
import type { Preset, Quality } from './quality';
import { scenery } from './scenery';
import { cameraRoom, cap, destinations, spawn, surface } from './terrain';
import type { Target } from './terrain';

export type Mode='menu'|'loading'|'play'|'dialogue'|'paused';
type Clip='Idle'|'Walk'|'Run'|'Jump'|'Land'|'Dodge'|'Slash'|'Sweep';
export interface Frame {
  x:number;y:number;z:number;yaw:number; speed:number; grounded:boolean; fps:number; clearance:number;
  stamina:number; qi:number; clip:Clip; hits:number;
}
interface Hooks { act:(code:string)=>void; frame:(frame:Frame)=>void; quality:(p:Preset)=>void; hit:(count:number)=>void }

const models={
  hero:new URL('./assets/wanderer.glb',import.meta.url).href,
  npc:new URL('./assets/ferryman.glb',import.meta.url).href,
};

async function actor(scene:Scene,name:string,asset:string){
  const {meshes,animationGroups}=await ImportMeshAsync(asset,scene,{pluginExtension:'.glb'});
  const root=new TransformNode(name,scene);
  meshes.filter(mesh=>!mesh.parent).forEach(mesh=>{mesh.parent=root;});
  meshes.forEach(mesh=>{mesh.isPickable=false;if(mesh.skeleton)mesh.alwaysSelectAsActiveMesh=true;});
  animationGroups.forEach(group=>group.stop());
  const clips=new Map(animationGroups.map(group=>[group.name,group]));
  let current:AnimationGroup|undefined,fading:AnimationGroup|undefined,amount=1;
  return {root,meshes,names:[...clips.keys()],
    pose(name:Clip,rate=1) {
      const next=clips.get(name);
      if(!next)return;
      if(next===current){next.speedRatio=rate;return;}
      fading?.stop();fading=current;current=next;amount=fading?0:1;
      const loop=['Idle','Walk','Run','Jump'].includes(name);
      next.start(loop,rate);
      if(fading&&['Walk','Run'].includes(fading.name)&&['Walk','Run'].includes(name)){
        const old=fading.animatables[0]?.masterFrame??0;
        const cycle=(old-fading.from)/(fading.to-fading.from);
        if(cycle>0&&cycle<1)next.goToFrame(next.from+(next.to-next.from)*cycle);
      }
      next.setWeightForAllAnimatables(amount);
    },
    blend(dt:number){
      if(!current||!fading)return;
      amount=Math.min(1,amount+dt/.17);
      current.setWeightForAllAnimatables(amount);fading.setWeightForAllAnimatables(1-amount);
      if(amount===1){fading.stop();fading=undefined;}
    },
  };
}

async function engineFor(original:HTMLCanvasElement,forceWebGL:boolean) {
  let canvas=original;
  if(!forceWebGL&&'gpu' in navigator){
    try{
      const {WebGPUEngine}=await import('@babylonjs/core/Engines/webgpuEngine');
      if(await WebGPUEngine.IsSupportedAsync){
        const gpu=new WebGPUEngine(canvas,{enableAllFeatures:false,antialias:true});
        try{await gpu.initAsync();return {canvas,engine:gpu as AbstractEngine,renderer:'WebGPU'};}
        catch(error){
          gpu.dispose();const replacement=canvas.cloneNode(false) as HTMLCanvasElement;
          canvas.replaceWith(replacement);canvas=replacement;console.info('WebGPU unavailable.',error);
        }
      }
    }catch(error){console.info('WebGPU adapter unavailable.',error);}
  }
  const gl=new Engine(canvas,true,{powerPreference:'default',stencil:true},false);
  if(gl.webGLVersion<2){gl.dispose();throw new Error('Cần WebGPU hoặc WebGL 2.');}
  return {canvas,engine:gl as AbstractEngine,renderer:'WebGL 2'};
}

function contact(scene:Scene){
  const map=new DynamicTexture('Contact ink',{width:64,height:64},scene,false);
  const ctx=map.getContext(),brush=ctx.createRadialGradient(32,32,0,32,32,31);
  brush.addColorStop(0,'#1b302bcc');brush.addColorStop(.56,'#233b2a68');brush.addColorStop(1,'#1c302500');
  ctx.fillStyle=brush;ctx.fillRect(0,0,64,64);map.hasAlpha=true;map.update(false);
  const mat=new StandardMaterial('Contact shadow',scene);
  mat.diffuseTexture=map;mat.useAlphaFromDiffuseTexture=true;mat.disableLighting=true;
  mat.emissiveColor=Color3.FromHexString('#25362a');mat.alpha=.8;
  const mesh=MeshBuilder.CreateGround('Ink under feet',{width:1.43,height:1.2},scene);
  mesh.material=mat;mesh.isPickable=false;return mesh;
}

export async function createWorld(original:HTMLCanvasElement,stick:HTMLElement,marker:HTMLElement,quality:Quality,hooks:Hooks,forceWebGL=false){
  const {canvas,engine,renderer}=await engineFor(original,forceWebGL);
  const scene=new Scene(engine);
  scene.clearColor=Color4.FromHexString('#aac0baff');scene.fogMode=Scene.FOGMODE_EXP2;
  scene.fogDensity=.011;scene.fogColor=Color3.FromHexString('#becdc0');scene.skipPointerMovePicking=true;
  const camera=new FreeCamera('Follow camera',new Vector3(0,3,-5),scene);
  camera.inputs.clear();camera.minZ=.1;camera.maxZ=405;scene.activeCamera=camera;
  const fill=new HemisphericLight('Sky fill',new Vector3(.20,1,.11),scene);
  fill.diffuse=Color3.FromHexString('#edeee8');fill.groundColor=Color3.FromHexString('#627970');fill.intensity=.72;
  const sun=new DirectionalLight('Evening sunlight',new Vector3(.61,-.85,.45),scene);
  sun.position.set(-16,24,-6);sun.diffuse=Color3.FromHexString('#ffe4b8');sun.intensity=1.65;
  sun.shadowFrustumSize=39;sun.shadowMinZ=.2;sun.shadowMaxZ=72;
  const land=scenery(scene), shadow=contact(scene);
  const flash=new StandardMaterial('Sword sweep',scene);
  flash.disableLighting=true;flash.emissiveColor=Color3.FromHexString('#ffdaa0');flash.alpha=.7;
  const trail=MeshBuilder.CreateTorus('Blade arc',{diameter:1.45,thickness:.023,tessellation:32},scene);
  trail.material=flash;trail.isPickable=false;trail.setEnabled(false);
  let hero:Awaited<ReturnType<typeof actor>>;
  try{hero=await actor(scene,'Lữ Khách',models.hero);}
  catch(error){scene.dispose();engine.dispose();throw error;}
  const player=spawnBody(spawn.x,spawn.z);
  hero.root.position.set(player.x,player.y,player.z);hero.pose('Idle');
  let fisher:typeof hero|undefined,preparation:Promise<void>|undefined,shadowMap:ShadowGenerator|undefined;
  let requested=quality,preset=selectPreset(quality),target:Target='ferry',mode:Mode='menu';
  let yaw=0,wantedYaw=0,pitch=.17,wantedPitch=.17,zoom=5.25,clearance=5.25,locked=false;
  let now=performance.now(),nextUpdate=0,sampleAt=now,frames=0,fps=0,elapsed=0,poorIntervals=0;
  let leap=false,dodge=false,clip:Clip='Idle',landUntil=0,slashUntil=0,strikeAt=0,qi=5,hits=0;
  const eye=new Vector3(player.x,player.y+1.3,player.z),arm=new Vector3(),identity=Matrix.Identity(),viewport=new Viewport(0,0,1,1);

  const resize=new ResizeObserver(()=>{
    camera.fov=canvas.clientWidth<canvas.clientHeight?1.16:.90;
    engine.resize();
  });
  resize.observe(canvas);
  const input=controls(canvas,stick,{enabled:()=>mode==='play',act:hooks.act,
    look(dx,dy){locked=false;wantedYaw-=dx*.0057;wantedPitch=cap(wantedPitch+dy*.004,-.14,1.13);},
    zoom(delta){zoom=cap(zoom+delta*.0058,2.70,8.8);},
  });

  function apply(next:Preset){
    preset=next;const data=presets[preset];
    engine.maxFPS=data.fps;engine.setHardwareScalingLevel(1/data.scale);land.apply(data.plants);
    shadowMap?.dispose();shadowMap=undefined;
    if(data.shadow){
      shadowMap=new ShadowGenerator(data.shadow,sun);shadowMap.usePoissonSampling=true;
      shadowMap.bias=.001;shadowMap.normalBias=.027;
      shadowMap.addShadowCaster(land.buildings);
      [...hero.meshes,...fisher?.meshes??[]].filter(mesh=>mesh.skeleton).forEach(mesh=>shadowMap!.addShadowCaster(mesh));
    }
    hooks.quality(preset);
  }
  const snapshot=():Frame=>({x:player.x,y:player.y,z:player.z,yaw,speed:Math.hypot(player.vx,player.vz),grounded:player.grounded,
    fps,clearance,stamina:player.stamina,qi,clip,hits});
  function view(dt:number){
    if(mode==='dialogue'&&target==='ferry'){
      const npc=destinations.ferry,y=surface(npc.x,npc.z);
      eye.copyFrom(Vector3.Lerp(eye,new Vector3(npc.x-.20,y+1.60,npc.z),1-Math.exp(-dt*11)));
      camera.position.copyFrom(Vector3.Lerp(camera.position,new Vector3(npc.x+.77,y+1.72,npc.z-2.14),1-Math.exp(-dt*9)));
      camera.setTarget(eye);return;
    }
    if(locked){
      const t=destinations[target];
      wantedYaw=facingToward(wantedYaw,Math.atan2(t.x-player.x,t.z-player.z),1);
    }
    yaw=facingToward(yaw,wantedYaw,1-Math.exp(-dt*12));
    pitch+=(wantedPitch-pitch)*(1-Math.exp(-dt*12));
    const cinematic=mode==='menu',look=cinematic?.16+Math.sin(elapsed*.15)*.06:yaw;
    const height=cinematic?.135:pitch,d=zoom*(canvas.clientWidth<canvas.clientHeight?1.10:1)*(cinematic?1.58:1);
    const next=new Vector3(player.x+(cinematic?-1.95:0),player.y+1.32,player.z+(cinematic?2.3:0));
    eye.copyFrom(Vector3.Lerp(eye,next,1-Math.exp(-dt*15)));
    arm.set(-Math.sin(look)*d*Math.cos(height),Math.sin(height)*d+.26,-Math.cos(look)*d*Math.cos(height));
    const room=cameraRoom(eye,arm);
    clearance=room<clearance?room:clearance+(room-clearance)*(1-Math.exp(-dt*7));
    camera.position.copyFrom(eye.add(arm.scale(clearance/(arm.length()||1))));
    camera.setTarget(eye);
  }
  function markerPosition(){
    if(mode!=='play'){marker.hidden=true;return;}
    const t=destinations[target],position=new Vector3(t.x,surface(t.x,t.z)+(target==='ferry'?2.31:1.95),t.z);
    const result=Vector3.Project(position,identity,scene.getTransformMatrix(),viewport);
    marker.hidden=result.z<0||result.z>1||result.x<.04||result.x>.96||result.y<.11||result.y>.84;
    if(!marker.hidden){marker.style.left=`${result.x*100}%`;marker.style.top=`${result.y*100}%`;}
  }
  function animate(){
    const time=performance.now(),dt=cap((time-now)/1000,.001,.19);
    now=time;elapsed+=dt;
    if(mode==='play'){
      const movement=input.read();
      let speed=0;
      const count=Math.ceil(dt/.025);
      for(let i=0;i<count;i++){
        const state=move(player,{...movement,jump:i===0&&leap,dodge:i===0&&dodge},yaw,dt/count);
        if(state.landed)landUntil=elapsed+.205;
        speed=state.speed;
      }
      if(player.dash>0)clip='Dodge';
      else if(elapsed>=slashUntil)clip=!player.grounded?'Jump':elapsed<landUntil?'Land':speed>.17?(speed<2.13?'Walk':'Run'):'Idle';
      if(strikeAt&&elapsed>=strikeAt){
        strikeAt=0;const p=destinations.practice,x=p.x-player.x,z=p.z-player.z,range=Math.hypot(x,z);
        if(target==='practice'&&range<2.26&&x*Math.sin(player.yaw)+z*Math.cos(player.yaw)>range*.25){
          hits++;qi=Math.min(8,qi+1);flash.emissiveColor=Color3.FromHexString('#cfffcb');hooks.hit(hits);
        }
      }
      if(trail.isEnabled()){
        trail.setEnabled(elapsed<slashUntil);
        flash.alpha=cap((slashUntil-elapsed)*1.6,.06,.77);
        trail.position.set(player.x+Math.sin(player.yaw)*.64,player.y+.97,player.z+Math.cos(player.yaw)*.64);
        trail.rotation.set(.13,player.yaw,-.45);
      }
      hero.root.position.set(player.x,player.y,player.z);hero.root.rotation.y=player.yaw;
      hero.pose(clip,clip==='Run'?cap(speed/3.4,.74,1.53):1);
    }
    leap=false;dodge=false;
    shadow.position.set(player.x,surface(player.x,player.z)+.022,player.z);
    shadow.scaling.setAll(cap(1-(player.y-shadow.position.y)*.26,.42,1));
    hero.blend(dt);fisher?.blend(dt);
    land.flow(elapsed);view(dt);scene.render();markerPosition();
    if(time>nextUpdate){hooks.frame(snapshot());nextUpdate=time+91;}
    frames++;
    if(time>=sampleAt+1000){
      fps=1000*frames/(time-sampleAt);frames=0;sampleAt=time;
      poorIntervals=mode==='play'&&requested==='auto'&&fps<26?poorIntervals+1:0;
      if(poorIntervals>=4&&preset!=='battery'){
        poorIntervals=0;apply(preset==='low'?'battery':'low');
      }
    }
  }
  apply(preset);engine.runRenderLoop(animate);
  return {canvas,renderer,clips:hero.names,snapshot,
    async prepare(){
      preparation??=actor(scene,'Lão Chu',models.npc).then(npc=>{
        fisher=npc;const pos=destinations.ferry;
        npc.root.position.set(pos.x,surface(pos.x,pos.z),pos.z);npc.root.rotation.y=Math.PI;npc.pose('Idle');
        npc.meshes.filter(mesh=>mesh.skeleton).forEach(mesh=>shadowMap?.addShadowCaster(mesh));
      }).catch(error=>{preparation=undefined;throw error;});
      await preparation;
    },
    setMode(next:Mode){
      mode=next;input.reset();player.vx=0;player.vz=0;
      if(next!=='play'){hero.pose('Idle');clip='Idle';strikeAt=0;slashUntil=0;trail.setEnabled(false);}
    },
    target(next:Target){target=next;},
    quality(next:Quality){requested=next;poorIntervals=0;apply(selectPreset(next));},
    lock(){locked=!locked;return locked;},
    jump(){if(mode==='play')leap=true;},
    dodge(){if(mode==='play')dodge=true;},
    strike(wide=false){
      if(mode!=='play'||elapsed<slashUntil||!player.grounded||player.dash>0||(wide&&qi<3))return;
      if(wide)qi-=3;
      clip=wide?'Sweep':'Slash';slashUntil=elapsed+(wide?.66:.52);strikeAt=elapsed+(wide?.24:.19);
      flash.emissiveColor=Color3.FromHexString(wide?'#9ce8d1':'#ffdaa0');trail.setEnabled(true);
    },
    dispose(){resize.disconnect();input.dispose();engine.stopRenderLoop();scene.dispose();engine.dispose();},
  };
}
export type World=Awaited<ReturnType<typeof createWorld>>;
