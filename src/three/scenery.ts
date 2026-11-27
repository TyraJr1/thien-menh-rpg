import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { Scene } from '@babylonjs/core/scene';
import { bridge, destinations, ground, houses, pathX, riverLevel, riverX, surface } from './terrain';

type Vec = [number,number,number];
type Paint = readonly [number,number,number];
const tint=(hex:string):Paint=>Color3.FromHexString(hex).asArray() as Vec;
const grade=(c:Paint,v:number):Paint=>[c[0]*v,c[1]*v,c[2]*v];
const lerp=(a:Paint,b:Paint,t:number):Paint=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];

function random(seed:number) {
  return ()=>{ seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
}

class Sculpt {
  p:number[]=[];
  c:number[]=[];
  i:number[]=[];
  point(a:Vec,c:Paint) {
    const id=this.p.length/3;
    this.p.push(...a);this.c.push(...c,1);
    return id;
  }
  face(a:Vec,b:Vec,c:Vec,paint:Paint) { this.i.push(this.point(a,paint),this.point(b,paint),this.point(c,paint)); }
  quad(a:Vec,b:Vec,c:Vec,d:Vec,paint:Paint) {
    const vertices=[a,b,c,d].map(p=>this.point(p,paint));
    this.i.push(vertices[0],vertices[1],vertices[2],vertices[0],vertices[2],vertices[3]);
  }
  box(x:number,y:number,z:number,w:number,h:number,d:number,c:Paint) {
    const a:Vec=[x-w/2,y-h/2,z-d/2], b:Vec=[x+w/2,y-h/2,z-d/2], e:Vec=[x-w/2,y-h/2,z+d/2], f:Vec=[x+w/2,y-h/2,z+d/2];
    const top=(p:Vec):Vec=>[p[0],p[1]+h,p[2]];
    this.quad(a,b,top(b),top(a),c); this.quad(f,e,top(e),top(f),grade(c,.86));
    this.quad(b,f,top(f),top(b),grade(c,.89));this.quad(e,a,top(a),top(e),grade(c,.80));
    this.quad(top(a),top(b),top(f),top(e),grade(c,1.10));this.quad(e,f,b,a,grade(c,.74));
  }
  branch(a:Vec,b:Vec,r:number,q:number,c:Paint,n=6) {
    const v=Vector3.FromArray(b).subtract(Vector3.FromArray(a)).normalize();
    const u=Vector3.Cross(v,Math.abs(v.y)>.95?Vector3.Forward():Vector3.Up()).normalize();
    const k=Vector3.Cross(v,u).normalize();
    const p=(a:Vec,r:number,i:number):Vec=>{
      const t=i/n*Math.PI*2, cy=Math.cos(t)*r, sy=Math.sin(t)*r;
      return [a[0]+u.x*cy+k.x*sy,a[1]+u.y*cy+k.y*sy,a[2]+u.z*cy+k.z*sy];
    };
    for(let j=0;j<n;j++)this.quad(p(a,r,j),p(a,r,j+1),p(b,q,j+1),p(b,q,j),grade(c,.84+j*.17/n));
  }
  rock(x:number,y:number,z:number,w:number,h:number,d:number,c:Paint,roll:()=>number) {
    const n=7,start=roll()*6.28,levels:Vec[][]=[];
    for(let row=0;row<3;row++) {
      levels.push(Array.from({length:n},(_,i)=>{
        const theta=i/n*Math.PI*2+start;
        const r=(row===0?.83:row===1?1:.44)*(.80+roll()*.23);
        return [x+Math.cos(theta)*w*r+(row===2?-.09*w:0),y+h*([-0.17,.35,.87][row]+roll()*.14),z+Math.sin(theta)*d*r];
      }));
    }
    for(let i=0;i<n;i++){
      const j=(i+1)%n;
      this.quad(levels[0][j],levels[0][i],levels[1][i],levels[1][j],grade(c,.68+roll()*.11));
      this.quad(levels[1][j],levels[1][i],levels[2][i],levels[2][j],grade(c,.85+roll()*.17));
      this.face(levels[2][i],levels[2][j],[x-.09*w,y+h,z],grade(c,1.02+roll()*.15));
    }
  }
  build(name:string,scene:Scene,mat:StandardMaterial,uv?:number[]) {
    const data=new VertexData(),mesh=new Mesh(name,scene),normals:number[]=[];
    VertexData.ComputeNormals(this.p,this.i,normals);
    data.positions=this.p;data.indices=this.i;data.colors=this.c;data.normals=normals;
    if(uv)data.uvs=uv;
    data.applyToMesh(mesh);
    mesh.material=mat;mesh.isPickable=false;mesh.freezeWorldMatrix();
    return mesh;
  }
}

function matte(scene:Scene,name:string,color='#ffffff') {
  const material=new StandardMaterial(name,scene);
  material.diffuseColor=Color3.FromHexString(color);material.specularColor.setAll(0);material.backFaceCulling=false;
  return material;
}
function paintTexture(scene:Scene,name:string,width:number,height:number,draw:(ctx:CanvasRenderingContext2D)=>void) {
  const texture=new DynamicTexture(name,{width,height},scene,false);
  draw(texture.getContext() as CanvasRenderingContext2D);
  texture.update(false);
  return texture;
}

function earth(scene:Scene) {
  const grid=new Sculpt(),uv:number[]=[],width=116,rows=137;
  const soil=tint('#a48f68'), grasses=tint('#748d55'), silt=tint('#5e7663');
  for(let j=0;j<=rows;j++)for(let i=0;i<=width;i++){
    const z=-24+j*1.04,x=(i-width/2)*.82,y=ground(x,z);
    const path=Math.max(0,Math.min(1,(Math.abs(x-pathX(z))-1.25)/2.7));
    const color=y<-.58?silt:lerp(soil,grasses,path);
    grid.point([x,y,z],grade(color,.91+.080*Math.sin(.69*x+.74*z)+.047*Math.cos(x*1.41-z*.37)));
    uv.push(x/4,z/4);
    if(i<width&&j<rows){const a=j*(width+1)+i,b=a+1,c=a+width+1;grid.i.push(a,b,c,b,c+1,c);}
  }
  const mat=matte(scene,'Grain of painted earth');
  mat.diffuseTexture=paintTexture(scene,'Ink grains',160,160,ctx=>{
    const r=random(96);ctx.fillStyle='#ede8d6';ctx.fillRect(0,0,160,160);
    for(let i=0;i<960;i++){
      ctx.fillStyle=i%2?'#414b3740':'#fff7d8ca';ctx.beginPath();
      ctx.ellipse(r()*160,r()*160,.37+r()*2.1,.23+r()*.9,r()*Math.PI,0,Math.PI*2);ctx.fill();
    }
  });
  const land=grid.build('Valley terrain',scene,mat,uv);
  land.receiveShadows=true;
}

function horizon(scene:Scene,mat:StandardMaterial) {
  const sky=matte(scene,'Painted dusk');
  sky.disableLighting=true;sky.emissiveColor.setAll(1);sky.fogEnabled=false;
  sky.emissiveTexture=paintTexture(scene,'Dusk wash',768,384,ctx=>{
    const band=ctx.createLinearGradient(0,0,0,384);
    band.addColorStop(0,'#425d7d');band.addColorStop(.35,'#6998a8');
    band.addColorStop(.49,'#efd7b5');band.addColorStop(.59,'#b1c4b4');band.addColorStop(1,'#848f7c');
    ctx.fillStyle=band;ctx.fillRect(0,0,768,384);
    const roll=random(6661);
    for(let i=0;i<51;i++){
      const x=roll()*768,y=140+roll()*72,w=10+roll()*118,h=3+roll()*10;
      ctx.fillStyle=i%4?'#f0e0bd2d':'#f7d0aa53';
      for(const shift of [-768,0,768]){ctx.beginPath();ctx.ellipse(x+shift,y,w,h,-.03,0,Math.PI*2);ctx.fill();}
    }
  });
  const dome=MeshBuilder.CreateSphere('Dusk dome',{diameter:460,segments:24,sideOrientation:Mesh.BACKSIDE},scene);
  dome.material=sky;dome.infiniteDistance=true;dome.isPickable=false;
  const peaks=new Sculpt(),r=random(44603);
  const row=[[-28,61,10,21],[-44,73,19,35],[31,57,11,23],[48,88,21,38],[-22,85,10,34],[21,103,13,33],[-7,111,11,30]];
  for(let i=0;i<11;i++)row.push([-75+i*14,110+r()*48,9+r()*11,16+r()*29]);
  row.forEach(([x,z,w,h],k)=>{
    const rings:Vec[][]=[];
    for(let j=0;j<6;j++)rings.push(Array.from({length:9},(_,i)=>{
      const a=(i/9)*6.283+j*.093,t=j/5,length=(.22+.78*(1-t)**.72)*(.71+r()*.39);
      return [x+Math.cos(a)*w*length+t*w*.31,-3+h*t+(r()-.51)*h*.14,z+Math.sin(a)*w*length*.79];
    }));
    const base=tint(k%2?'#547b74':'#618395');
    for(let j=0;j<5;j++)for(let i=0;i<9;i++){
      const n=(i+1)%9;
      peaks.face(rings[j][i],rings[j+1][n],rings[j][n],grade(base,.82+r()*.27));
      peaks.face(rings[j][i],rings[j+1][i],rings[j+1][n],grade(base,.85+r()*.31));
    }
    for(let i=0;i<9;i++)peaks.face(rings[5][i],rings[5][(i+1)%9],[x+w*.31,h,z],base);
  });
  peaks.build('Layered jade peaks',scene,mat);
}

const dark=tint('#352f3a'), timber=tint('#67443c'), brass=tint('#bf925d'), stone=tint('#7b8b7f'), plaster=tint('#c6b297');
function roof(g:Sculpt,x:number,y:number,z:number,w:number,d:number,rise:number) {
  const shell=tint('#42626a');
  const p=(a:number,b:number):Vec=>[x+w*a/2,y+rise*(1-Math.abs(b)**.74)+.40*Math.abs(a)**5*(.35+Math.abs(b)**3),z+b*d/2*(1+.06*Math.abs(a)**3)];
  for(let i=0;i<30;i++){
    const a=-1+i/15,n=a+1/15;
    for(let j=0;j<12;j++){
      const v=-1+j/6,t=v+1/6;
      g.quad(p(a,v),p(n,v),p(n,t),p(a,t),grade(shell,.87+((i*11+j*7)%9)/28));
    }
    if(i%2===0)for(let m=0;m<6;m++){
      const a1=p(a,-1+m/3),b1=p(a,-1+(m+1)/3);a1[1]+=.036;b1[1]+=.036;
      g.branch(a1,b1,.031,.031,grade(shell,1.16),4);
    }
  }
  for(const v of [-1,0,1])for(let j=0;j<14;j++){
    const a=-1+j/7;
    g.branch(p(a,v),p(a+1/7,v),v?.064:.092,v?.064:.092,dark,6);
  }
  for(const t of [-1,1]){
    const b=p(t,0);
    g.branch(b,[b[0]+t*.33,b[1]+.22,b[2]],.09,.026,brass);
  }
}
function lantern(g:Sculpt,glow:Sculpt,x:number,y:number,z:number,s:number) {
  g.branch([x,y+.42*s,z],[x,y+.17*s,z],.012*s,.012*s,dark);
  const grades=['#d55d35','#f18842','#ea6c32','#ffbc64'].map(tint);
  const p=(r:number,h:number,a:number):Vec=>[x+Math.cos(a)*r*s,y+h*s,z+Math.sin(a)*r*s];
  for(let i=0;i<12;i++){
    const a=i/12*6.283,b=(i+1)/12*6.283;
    const radii=[.10,.19,.225,.18,.095],heights=[-.26,-.15,-.031,.13,.22];
    for(let j=0;j<4;j++){
      glow.quad(p(radii[j],heights[j],a),p(radii[j],heights[j],b),p(radii[j+1],heights[j+1],b),p(radii[j+1],heights[j+1],a),grades[(i+j)%4]);
      g.branch(p(radii[j]+.006,heights[j],a),p(radii[j+1]+.006,heights[j+1],a),.006*s,.006*s,dark,4);
    }
  }
  g.box(x,y+.223*s,z,.22*s,.058*s,.22*s,dark);g.box(x,y-.26*s,z,.21*s,.061*s,.21*s,dark);
  g.branch([x,y-.29*s,z],[x,y-.46*s,z],.031*s,.013*s,tint('#a64631'));
}

function buildVillage(scene:Scene,mat:StandardMaterial) {
  const g=new Sculpt(),lamps=new Sculpt(),r=random(54152);
  for(const {x,z,w,d,h,tall} of houses) {
    const y=ground(x,z)+.21;
    g.box(x,y-.17,z,w+.48,.54,d+.48,stone);g.box(x,y+.035,z,w+.56,.16,d+.55,grade(stone,1.14));
    g.box(x,y+h*.50,z,w,d>0?h*.96:h,d,plaster);
    for(const a of [-w/2,0,w/2])for(const b of [-d/2,d/2])g.box(x+a,y+h*.53,z+b,.22,h,.22,timber);
    for(const b of [-d/2,d/2]){
      g.box(x,y+h-.17,z+b,w+.25,.28,.18,timber);g.box(x,y+h-.41,z+b,w,.096,.19,brass);
    }
    const front=z-d*.5-.08;
    for(let i=0;i<6;i++){
      const xx=x+(i-2.5)*w/6,door=i===2||i===3;
      g.box(xx,y+h*.52,front,w/6-.05,door?h*.84:h*.50,.14,door?timber:dark);
      g.box(xx,y+h*.54,front-.09,w/6-.23,door?h*.56:h*.38,.048,door?grade(dark,1.12):tint('#c39760'));
      for(const bar of [-.25,0,.25]){
        g.box(xx+bar,y+h*.54,front-.12,.037,door?h*.6:h*.4,.065,timber);
        if(!door)g.box(xx,y+h*.54+bar,front-.12,w/6-.17,.038,.066,timber);
      }
    }
    roof(g,x,y+h-.12,z,w*1.22,d*1.28,1.14);
    if(tall){g.box(x,y+h+.46,z,w*.69,.68,d*.59,timber);roof(g,x,y+h+.71,z,w*.89,d*.78,1.09);}
    for(const s of [-1,1]) lantern(g,lamps,x+s*w*.39,y+h-.54,front-.48,1.02);
    for(let j=0;j<4;j++)g.box(x,y-.17+j*.059,front-.50+j*.13,w*.40,.1,.50,grade(stone,.9+j*.045));
  }
  const gateY=ground(0,27);
  for(const x of [-3.3,3.3]){
    g.box(x,gateY+1.53,27,.45,3.06,.49,timber);
    g.box(x,gateY+.14,27,.65,.33,.64,stone);
    lantern(g,lamps,x*.82,gateY+2.43,26.9,.79);
  }
  g.box(0,gateY+2.97,27,7.4,.25,.45,timber);
  roof(g,0,gateY+3.18,27,7.80,1.63,.55);
  for(let i=0;i<57;i++){
    const x=bridge.left+.334*i,z=bridge.z,y=surface(x,z);
    g.box(x,y-.08,z,.338,.18,bridge.width,grade(timber,.87+r()*.28));
    if(i%5===0)for(const s of [-1,1]){
      g.box(x,y+.41,z+s*bridge.width*.46,.12,.93,.129,timber);
      g.box(x+.69,y+.73,z+s*bridge.width*.46,1.72,.11,.12,grade(timber,1.1));
    }
  }
  const dock=riverX(10.7)-5.85;
  for(let i=0;i<15;i++)g.box(dock-2.5+.24*i,-.08,10.8,.244,.14,2.17,grade(timber,.87+r()*.25));
  const boat=riverX(10.7)-1.3;
  g.rock(boat,-.58,10.6,.72,.45,2.6,tint('#6f4a39'),r);
  for(const a of [-.43,.43])for(const z of [9.5,11.78])g.box(boat+a,.51,z,.071,1.21,.071,timber);
  roof(g,boat,1.04,10.7,1.31,2.68,.32);
  lantern(g,lamps,boat,.74,9.51,.55);
  for(const [x,z] of [[4.5,5.7],[-3.9,12.6],[3.65,18.6],[-3.35,23.7],[2.7,35]]){
    const y=ground(x,z);
    g.box(x,y+1.04,z,.128,2.14,.129,timber);g.box(x-.21,y+2.04,z,.59,.066,.094,timber);
    lantern(g,lamps,x-.43,y+1.79,z,.87);
  }
  const lamp=destinations.lamp,ly=ground(lamp.x,lamp.z),pr=destinations.practice,py=ground(pr.x,pr.z);
  g.box(lamp.x,ly+.15,lamp.z,.72,.29,.72,stone);g.box(lamp.x,ly+.64,lamp.z,.36,1.1,.36,grade(stone,.75));
  lantern(g,lamps,lamp.x,ly+1.31,lamp.z,.81);
  g.box(pr.x,py+.65,pr.z,.14,1.23,.13,timber);
  g.branch([pr.x,py+.62,pr.z],[pr.x,py+1.36,pr.z],.33,.24,tint('#a38d57'),12);
  g.branch([pr.x,py+.85,pr.z],[pr.x,py+.93,pr.z],.31,.31,timber,12);
  g.box(pr.x,py+.96,pr.z,1.29,.11,.11,timber);
  for(let i=0;i<20;i++){
    const theta=i/20*6.283,x=pr.x+4.4*Math.sin(theta),z=pr.z+4.4*Math.cos(theta);
    g.rock(x,ground(x,z),z,.43,.15,.31,stone,r);
  }
  const lights=matte(scene,'Rice-paper lamps');
  lights.disableLighting=true;lights.emissiveColor=Color3.FromHexString('#9e631e');
  lamps.build('Lantern light',scene,lights);
  const result=g.build('Village, bridge and ferry',scene,mat);result.receiveShadows=true;return result;
}

function vegetation(scene:Scene,mat:StandardMaterial) {
  const r=random(48295),rocks=new Sculpt(),groups=Array.from({length:3},()=>new Sculpt());
  rocks.rock(-4.7,ground(-4.7,6.6),6.6,.91,1.32,1.0,tint('#5a7680'),r);
  for(let j=0;j<59;j++)for(const lane of [-1.2,-.36,.4,1.27]){
    const z=-7+j*.79+(r()-.5)*.46,x=pathX(z)+lane+(r()-.5)*.38;
    rocks.rock(x,ground(x,z)+.019,z,.34+r()*.18,.04+r()*.042,.32+r()*.16,tint(j%2?'#969e8a':'#ad9a7a'),r);
  }
  for(let j=0;j<69;j++){
    const z=-6+r()*54,x=(2.3+r()*17)*(r()<.62?-1:1),y=ground(x,z);
    if(y>-.25)rocks.rock(x,y,z,.14+r()*.67,.06+r()*.56,.2+r()*.54,tint('#657970'),r);
  }
  const leaf=(f:Sculpt,x:number,y:number,z:number,span:number,angle:number,c:Paint)=>{
    const u=Math.cos(angle)*span,v=Math.sin(angle)*span;
    f.face([x,y,z],[x+u*.49-v*.19,y+.035,z+v*.49+u*.19],[x+u,y-.08*span,z+v],c);
    f.face([x,y,z],[x+u,y-.08*span,z+v],[x+u*.52+v*.15,y+.024,z+v*.52-u*.15],grade(c,.79));
  };
  for(const [tx,tz,n] of [[-5.6,4.6,9],[-8,10.8,15],[-10.6,16.9,13],[-10,35,14],[4.6,22,8],[7.6,37,9],[29,21,11],[-6.3,31.7,7]]) {
    for(let j=0;j<n;j++){
      const f=groups[j%3],x=tx+(r()-.5)*3.6,z=tz+(r()-.5)*5.3,y=ground(x,z),height=3.9+r()*4.1,lean=(r()-.52)*.8;
      const stem=tint(j%3?'#627e49':'#7a944d');
      for(let i=0;i<8;i++){
        const t=i/8,d=(i+1)/8,a:Vec=[x+lean*t*t,y+t*height,z],b:Vec=[x+lean*d*d,y+d*height,z-.027];
        const size=.084*(1-t*.54);
        f.branch(a,b,size,size*.91,stem,5);
        f.branch(a,[a[0],a[1]+.043,a[2]],size*1.16,size*1.12,grade(stem,.69),5);
        if(i>2){
          const angle=r()*6.28,d=.36+r()*.83,wx=Math.cos(angle)*d,wz=Math.sin(angle)*d;
          f.branch(a,[a[0]+wx,a[1]+.28,a[2]+wz],.021,.006,stem,4);
          for(let k=0;k<9;k++)leaf(f,a[0]+wx*k/8,a[1]+.26*k/8,a[2]+wz*k/8,.39+r()*.54,angle+(k%2?1:-1)*(.3+r()),tint(k%2?'#879851':'#50754d'));
        }
      }
    }
  }
  const tx=-6.64,tz=15.2,ty=ground(tx,tz),fork:Vec=[tx+.31,ty+1.83,tz];
  rocks.branch([tx,ty,tz],fork,.35,.24,timber,8);
  for(let i=0;i<8;i++){
    const theta=i*2.31,l=1.15+r()*2.1,b:Vec=[tx+Math.cos(theta)*l,ty+3.1+r()*2.7,tz+Math.sin(theta)*l];
    rocks.branch(fork,b,.18,.027,timber,6);
    for(let k=0;k<100;k++)leaf(groups[k%3],b[0]+(r()-.5)*2.28,b[1]+(r()-.5)*1.74,b[2]+(r()-.5)*2,.29+r()*.40,r()*6.28,
      tint(k%3===0?'#d3914c':k%3===1?'#ae6543':'#be7748'));
  }
  for(let i=0;i<1430;i++){
    const z=-6+r()*52,x=pathX(z)+(2.2+r()**1.8*18)*(r()<.53?-1:1),y=ground(x,z),f=groups[i%3];
    if(y<-.4)continue;
    for(let j=0;j<3;j++){
      const u=r()-.5,v=r()-.5,h=.10+r()*.40;
      f.face([x-.044,y,z],[x+.034,y,z+.037],[x+u*.56,y+h,z+v*.45],tint(j===0?'#94a058':j===1?'#759554':'#5a774b'));
    }
  }
  rocks.build('Path stone and roots',scene,mat).receiveShadows=true;
  return groups.map((group,i)=>group.build('Plant density '+i,scene,mat));
}

export function scenery(scene:Scene) {
  const mat=matte(scene,'Hand-tinted stone and wood');
  earth(scene);horizon(scene,mat);
  const plants=vegetation(scene,mat);
  const buildings=buildVillage(scene,mat);
  const wet=matte(scene,'Jade river','#a0b9b3');
  wet.specularColor=Color3.FromHexString('#86adae');wet.specularPower=53;
  wet.emissiveColor=Color3.FromHexString('#263b42');
  const water=paintTexture(scene,'Painted river ripples',256,192,ctx=>{
    const r=random(98052);
    ctx.fillStyle='#527e80';ctx.fillRect(0,0,256,192);
    for(let i=0;i<71;i++){
      const x=r()*256,y=r()*192,w=5+r()*68;
      ctx.strokeStyle=i%2?'#aac6b38f':'#91a5a694';ctx.lineWidth=.57+r()*1.5;
      for(const shift of [-256,0,256]){ctx.beginPath();ctx.moveTo(x+shift,y);ctx.bezierCurveTo(x+w*.25+shift,y-2,x+w*.62+shift,y+2,x+w+shift,y);ctx.stroke();}
    }
  });
  wet.diffuseTexture=water;water.uScale=4;water.vScale=8;
  const river=MeshBuilder.CreateGround('Rippled river',{width:53,height:162},scene);
  river.position.set(20,riverLevel,53);river.material=wet;river.isPickable=false;
  return { buildings, apply:(count:number)=>plants.forEach((mesh,i)=>mesh.setEnabled(i<count)),
    flow:(seconds:number)=>{water.uOffset=seconds*.009;water.vOffset=-seconds*.004;} };
}
