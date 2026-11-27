export interface Point { x: number; z: number }
export interface Bounds { left: number; right: number; near: number; far: number; bottom: number; top: number }

export const spawn = { x: 0, z: 1.1 };
export const destinations = {
  ferry: { x: -1.55, z: 10.1, title: 'Lão Chu' },
  lamp: { x: 1.4, z: 21, title: 'Đèn dẫn lối' },
  practice: { x: 0, z: 31.4, title: 'Bãi luyện kiếm' },
} as const;
export type Target = keyof typeof destinations;
export const riverLevel = -.64;
export const bridge = { z: 17, left: 12, right: 31, width: 3.0 };
export const houses = [
  { x: 8.5, z: 12.8, w: 7.6, d: 5.4, h: 3.0, tall: true },
  { x: -9, z: 24.6, w: 6.4, d: 4.6, h: 2.5, tall: false },
  { x: 10.6, z: 27.5, w: 6.2, d: 4.8, h: 2.6, tall: false },
] as const;
export const cap = (n: number, min: number, max: number) => Math.max(min, Math.min(n, max));
export const riverX = (z: number) => 20 + 5.2 * Math.sin(.045 * z + .17);
export const pathX = (z: number) => 1.05 * Math.sin(z * .097);

export function ground(x: number, z: number) {
  const margin = cap((Math.abs(x - riverX(z)) - 4.7) / 5.0, 0, 1);
  const noise = .13 * Math.sin(z * .20) + .10 * Math.cos(x * .27 + z * .06);
  const hills = Math.max(0, Math.abs(x - pathX(z)) - 5.8);
  const levee = Math.min(1.85, hills * (x < 0 ? .085 : .037));
  return -1.58 + (1.72 + noise + levee) * margin * margin * (3 - 2 * margin);
}

export function onBridge(x: number, z: number) {
  return Math.abs(z - bridge.z) <= bridge.width / 2 && x >= bridge.left && x <= bridge.right;
}

export function surface(x: number, z: number) {
  const y = ground(x,z);
  return onBridge(x,z) ? Math.max(y, .55 + .35 * Math.sin(Math.PI * (x - bridge.left) / (bridge.right - bridge.left))) : y;
}

const volume = (x: number, z: number, w: number, d: number, h: number): Bounds => ({
  left: x - w/2, right: x + w/2, near: z - d/2, far: z + d/2,
  bottom: ground(x,z) - .3, top: ground(x,z) + h,
});
export const obstacles: Bounds[] = [
  ...houses.map(p => volume(p.x,p.z,p.w,p.d,p.h+1.3)),
  volume(-4.7,6.6,1.4,1.67,1.3),
  volume(-6.64,15.2,.67,.7,5),
  volume(-3.3,27,.55,.58,3.5), volume(3.3,27,.55,.58,3.5),
  volume(4.5,5.7,.30,.3,2.6),
  volume(destinations.ferry.x,destinations.ferry.z,.69,.69,2),
  volume(destinations.lamp.x,destinations.lamp.z,.70,.76,2.1),
  volume(destinations.practice.x,destinations.practice.z,.75,.66,1.6),
];

export function walkable(x: number, z: number) {
  if (x < -16 || x > 34 || z < -7 || z > 43) return false;
  return x < riverX(z) - 6.4 || (onBridge(x,z) && Math.abs(z-bridge.z) < 1.23) ||
    (z>15 && z<20 && x>riverX(z)+5.75);
}

export function blocked(x: number, y: number, z: number, radius: number, height: number, walls=obstacles) {
  return walls.some(w => x+radius>w.left && x-radius<w.right && z+radius>w.near && z-radius<w.far && y+height>w.bottom && y<w.top);
}

export function cameraRoom(p: {x:number;y:number;z:number}, arm: {x:number;y:number;z:number}, walls=obstacles) {
  const length=Math.hypot(arm.x,arm.y,arm.z);
  const count=Math.max(1,Math.ceil(length/.145));
  for(let i=1;i<=count;i++){
    const t=i/count, x=p.x+t*arm.x, y=p.y+t*arm.y, z=p.z+t*arm.z;
    if(blocked(x,y-.12,z,.23,.25,walls)||y<surface(x,z)+.18)return length*Math.max(.055,(i-1)/count);
  }
  return length;
}

export const distance = (a: Point,b: Point) => Math.hypot(a.x-b.x,a.z-b.z);
