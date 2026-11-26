export const origins = {
  wanderer: { name: 'Lữ khách', description: 'Sinh lực 36 · Trảm kích 7 · Linh lực 3', hp: 0, attack: 0, spirit: 3 },
  guardian: { name: 'Hộ sơn', description: 'Sinh lực +6 · Linh lực 2', hp: 6, attack: 0, spirit: 2 },
  sword: { name: 'Kiếm đồ', description: 'Trảm kích +1 · Linh lực 2', hp: 0, attack: 1, spirit: 2 },
} as const;

export type Origin = keyof typeof origins;
export const blades = {
  iron: { name: 'Kiếm sắt', attack: 0 },
  bronze: { name: 'Kiếm đồng bến đò', attack: 1 },
  wind: { name: 'Kiếm Tàng Phong', attack: 2 },
} as const;
export type Blade = keyof typeof blades;
export const baseHp = 36;
export const baseQi = 8;

export interface Profile {
  name: string;
  origin: Origin;
}

export const defaultProfile: Profile = { name: 'Lữ Khách', origin: 'wanderer' };

export function validName(value: unknown): value is string {
  return typeof value === 'string' && value === value.trim() &&
    value.length > 0 && value.length <= 24 && /^[\p{L}\p{M}\p{N} '\u2019-]+$/u.test(value);
}

export function validOrigin(value: unknown): value is Origin {
  return typeof value === 'string' && Object.hasOwn(origins, value);
}

export function levelOf(xp: number) {
  return 1 + Number(xp >= 60) + Number(xp >= 140);
}

export interface Build {
  profile: Profile;
  blade: Blade;
  xp: number;
}

export function attributes({ profile, blade, xp }: Build) {
  const origin = origins[profile.origin];
  const level = levelOf(xp);
  return {
    level,
    maxHp: baseHp + origin.hp + (level - 1) * 4,
    maxQi: baseQi,
    spirit: origin.spirit,
    attack: 7 + origin.attack + blades[blade].attack,
  };
}
