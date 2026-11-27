import { blocked, cap, surface, walkable } from './terrain.ts';

export interface Input { right:number; forward:number; sprint:boolean; walk:boolean; jump:boolean; dodge:boolean }
export interface Body {
  x:number;y:number;z:number; vx:number;vy:number;vz:number;
  yaw:number; grounded:boolean; stamina:number; dash:number; cooldown:number; dashX:number; dashZ:number;
}

export const facingToward=(a:number,b:number,t:number)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
export const spawnBody=(x:number,z:number):Body=>({
  x,y:surface(x,z),z,vx:0,vy:0,vz:0,yaw:0,grounded:true,stamina:100,dash:0,cooldown:0,dashX:0,dashZ:1,
});

export function move(body:Body,input:Input,yaw:number,dt:number) {
  const raw=Math.hypot(input.right,input.forward);
  const magnitude=Math.min(1,raw), unit=raw||1;
  const x=(Math.cos(yaw)*input.right+Math.sin(yaw)*input.forward)/unit;
  const z=(Math.cos(yaw)*input.forward-Math.sin(yaw)*input.right)/unit;
  body.cooldown=Math.max(0,body.cooldown-dt);
  if(input.dodge&&body.grounded&&body.cooldown===0&&body.stamina>=22){
    body.stamina-=22; body.dash=.36; body.cooldown=.65;
    body.dashX=magnitude>.03?x:Math.sin(body.yaw);
    body.dashZ=magnitude>.03?z:Math.cos(body.yaw);
  }
  const dodging=body.dash>0;
  if(input.jump&&body.grounded&&!dodging){body.grounded=false;body.vy=6.1;}
  const sprint=input.sprint&&magnitude>.1&&body.stamina>4&&!dodging;
  body.stamina=cap(body.stamina+(sprint?-18:dodging?0:15)*dt,0,100);
  const speed=(input.walk?1.65:sprint?6.3:3.55)*magnitude;
  const ease=1-Math.exp(-dt*(magnitude>.02?14:21));
  const dx=dodging?body.dashX*8.2:x*speed, dz=dodging?body.dashZ*8.2:z*speed;
  body.vx+=(dx-body.vx)*ease;
  body.vz+=(dz-body.vz)*ease;
  if(dodging||magnitude>.02)body.yaw=facingToward(body.yaw,Math.atan2(dx,dz),1-Math.exp(-dt*16));
  body.dash=Math.max(0,body.dash-dt);
  const safe=(x:number,z:number)=>walkable(x,z)&&surface(x,z)<body.y+.37&&!blocked(x,body.y+.052,z,.33,1.53);
  const n=Math.max(1,Math.ceil(Math.hypot(body.vx,body.vz)*dt/.11));
  for(let i=0;i<n;i++){
    const nextX=body.x+dt*body.vx/n,nextZ=body.z+dt*body.vz/n;
    if(safe(nextX,body.z))body.x=nextX;else body.vx=0;
    if(safe(body.x,nextZ))body.z=nextZ;else body.vz=0;
  }
  const floor=surface(body.x,body.z);
  const grounded=body.grounded;
  if(!grounded||body.y>floor+.2) {
    body.vy-=18.4*dt;body.y+=body.vy*dt;
    if(body.y<=floor){body.y=floor;body.grounded=true;body.vy=0;}else body.grounded=false;
  } else body.y=floor;
  return {landed:body.grounded&&!grounded,speed:Math.hypot(body.vx,body.vz)};
}
