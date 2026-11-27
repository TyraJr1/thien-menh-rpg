export const presets = {
  battery:{name:'Battery Saver',scale:.48,fps:30,plants:1,shadow:0},
  low:{name:'Low',scale:.69,fps:45,plants:1,shadow:0},
  medium:{name:'Medium',scale:.88,fps:60,plants:2,shadow:0},
  high:{name:'High',scale:1,fps:60,plants:3,shadow:768},
  ultra:{name:'Ultra',scale:1.18,fps:60,plants:3,shadow:1280},
} as const;
export type Preset=keyof typeof presets;
export type Quality='auto'|Preset;
export const qualityKey='thien-menh.3d.quality';
export function storedQuality():Quality {
  try{const v=localStorage.getItem(qualityKey);if(v&&Object.hasOwn(presets,v))return v as Preset;}catch{/* Session works without storage. */}
  return 'auto';
}
export function selectPreset(q:Quality):Preset {
  if(q!=='auto')return q;
  const memory=(navigator as Navigator & {deviceMemory?:number}).deviceMemory;
  return (memory!==undefined&&memory<=4)||navigator.hardwareConcurrency<=4||matchMedia('(pointer: coarse)').matches?'low':'medium';
}
