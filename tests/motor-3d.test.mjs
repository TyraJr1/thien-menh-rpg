import assert from 'node:assert/strict';
import test from 'node:test';
import { move,spawnBody } from '../src/three/motor.ts';
import { cameraRoom, houses, riverX, spawn, surface, walkable } from '../src/three/terrain.ts';

const idle={forward:0,right:0,sprint:false,walk:false,jump:false,dodge:false};
function step(body,events,cycles,yaw=0) {
  for(let i=0;i<cycles;i++)move(body,{...idle,...events},yaw,1/60);
}

test('3D locomotion follows the camera and differentiates walk, run, and sprint',()=>{
  const walker=spawnBody(spawn.x,spawn.z),runner=spawnBody(spawn.x,spawn.z),sprint=spawnBody(spawn.x,spawn.z);
  step(walker,{forward:1,walk:true},60);
  step(runner,{forward:1},60,Math.PI/2);
  step(sprint,{forward:1,sprint:true},60);
  assert.ok(walker.z-spawn.z>1.3&&walker.z-spawn.z<1.7);
  assert.ok(runner.x>3.21&&Math.abs(runner.z-spawn.z)<.01);
  assert.ok(sprint.z-spawn.z>5.5&&sprint.stamina<83);
  step(runner,{},60);
  assert.ok(Math.hypot(runner.vx,runner.vz)<.01);
});

test('jump cannot be repeated in air and lands on the terrain',()=>{
  const body=spawnBody(spawn.x,spawn.z),floor=body.y;
  step(body,{jump:true},1);
  assert.equal(body.grounded,false);
  const initial=body.vy;
  step(body,{jump:true},1);
  assert.ok(body.vy<initial);
  step(body,{},16);
  assert.ok(body.y>floor+.80);
  step(body,{},48);
  assert.equal(body.grounded,true);
  assert.equal(body.y,surface(body.x,body.z));
});

test('sprint and dodge cannot tunnel through houses, river bank and bridge constrain movement',()=>{
  const house=houses[0],b=spawnBody(house.x-house.w/2-.9,house.z);
  step(b,{right:1,sprint:true,dodge:true},65);
  assert.ok(b.x<=house.x-house.w/2-.32);
  assert.ok(b.stamina<100);
  assert.equal(walkable(riverX(11),11),false);
  assert.equal(walkable(riverX(17),17),true);
});

test('camera arm retracts before a building or rock',()=>{
  const target={x:0,y:1.47,z:0},arm={x:0,y:1.2,z:-5.4};
  assert.ok(cameraRoom(target,arm,[])>5.10);
  const barrier={left:-1,right:1,near:-3,far:-1.2,bottom:0,top:4};
  const limited=cameraRoom(target,arm,[barrier]);
  assert.ok(limited>.44&&limited<1.2);
});
