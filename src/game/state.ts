import { attributes, baseHp, baseQi, blades, defaultProfile, validName, validOrigin } from './character.ts';
import type { Blade, Build, Profile } from './character.ts';

export type ChapterId = 'prologue' | 'chapter01';
export type Stance = 'compassion' | 'resolve';
export type Move = 'attack' | 'guard' | 'skill' | 'heal' | 'focus';

interface Battle {
  enemyHp: number;
  turn: number;
  log: string;
}

export interface GameState extends Build {
  version: 2;
  chapter: ChapterId;
  step: number;
  stance: Stance | null;
  technique: Stance | null;
  hp: number;
  qi: number;
  spirit: number;
  combat: Battle | null;
  medicine: number;
  sideQuest: boolean;
}

export const maxHp = baseHp;
export const maxQi = baseQi;
export const saveKey = 'thien-menh.save.v1';

export const encounters = {
  prologue: { name: 'Khách áo đen', hp: 22, strike: 4, heavy: 9, xp: 30 },
  chapter01: { name: 'Hộ vệ Vô Danh', hp: 46, strike: 6, heavy: 13, xp: 50 },
};

export function newGame(profile: Profile = defaultProfile): GameState {
  const stats = attributes({ profile, blade: 'iron', xp: 0 });
  return {
    version: 2, chapter: 'prologue', step: 0, stance: null, technique: null,
    hp: stats.maxHp, qi: 5, spirit: stats.spirit, combat: null,
    profile: { ...profile }, xp: 0, blade: 'iron', medicine: 1, sideQuest: false,
  };
}

export function stepLimit(chapter: ChapterId) {
  return chapter === 'prologue' ? 4 : 5;
}

export function combatStep(chapter: ChapterId) {
  return chapter === 'prologue' ? 2 : 3;
}

export function chapterReward(state: GameState) {
  return state.chapter === 'chapter01' && state.step === stepLimit('chapter01');
}

export function sideAvailable(state: GameState) {
  return state.chapter === 'chapter01' && state.step >= 1 && state.step < 5 && !state.combat && !state.sideQuest;
}

export function finishSideQuest(state: GameState): GameState {
  if (!sideAvailable(state)) return state;
  return { ...state, sideQuest: true, medicine: state.medicine + 1, xp: state.xp + 20 };
}

export function ownedBlades(state: GameState): Blade[] {
  const owned: Blade[] = ['iron'];
  if (state.stance === 'resolve' && (state.chapter === 'chapter01' || state.step >= 2)) owned.push('bronze');
  if (chapterReward(state)) owned.push('wind');
  return owned;
}

export function equip(state: GameState, blade: Blade): GameState {
  return !state.combat && ownedBlades(state).includes(blade) ? { ...state, blade } : state;
}

export function advance(state: GameState, choice?: Stance): GameState {
  if (state.combat || state.step >= stepLimit(state.chapter) || state.step === combatStep(state.chapter)) return state;
  const choosesStance = state.chapter === 'prologue' && state.step === 0;
  const choosesTechnique = state.chapter === 'chapter01' && state.step === 2;
  if ((choosesStance || choosesTechnique) && !choice) return state;
  const step = state.step + 1;
  const xp = state.xp + (step === stepLimit(state.chapter) ? (state.chapter === 'prologue' ? 20 : 40) : 0);
  const next = {
    ...state, step, xp,
    stance: choosesStance ? choice! : state.stance,
    technique: choosesTechnique ? choice! : state.technique,
    medicine: state.medicine + Number(state.chapter === 'prologue' && state.step === 1 && state.stance === 'compassion'),
  };
  if (!choosesTechnique) return next;
  const stats = attributes(next);
  return { ...next, hp: stats.maxHp, qi: stats.maxQi, spirit: stats.spirit };
}

export function enterChapter(state: GameState): GameState {
  if (state.chapter !== 'prologue' || state.step !== stepLimit('prologue')) return state;
  const stats = attributes(state);
  return { ...state, chapter: 'chapter01', step: 0, hp: stats.maxHp, qi: 5, spirit: stats.spirit, combat: null };
}

export function startCombat(state: GameState): GameState {
  if (state.step !== combatStep(state.chapter) || state.combat || !state.hp) return state;
  return {
    ...state,
    combat: { enemyHp: encounters[state.chapter].hp, turn: 1, log: 'Đối thủ rút kiếm.' },
  };
}

export function isCharging(turn: number) {
  return turn % 3 === 0;
}

export function bossEnraged(state: GameState) {
  return state.chapter === 'chapter01' && Boolean(state.combat && state.combat.enemyHp <= 16);
}

function enemyDamage(state: GameState, turn: number) {
  const enemy = encounters[state.chapter];
  return isCharging(turn) ? enemy.heavy : enemy.strike + Number(bossEnraged(state)) * 2;
}

export function useMedicine(state: GameState): GameState {
  if (!state.medicine || !state.hp || state.hp >= attributes(state).maxHp) return state;
  if (state.combat) return playMove(state, 'heal');
  return { ...state, hp: Math.min(attributes(state).maxHp, state.hp + 15), medicine: state.medicine - 1 };
}

export function playMove(state: GameState, move: Move): GameState {
  const battle = state.combat;
  if (!battle || !state.hp || (move === 'skill' && state.qi < 3)) return state;
  const stats = attributes(state);
  if (move === 'heal' && (!state.medicine || state.hp >= stats.maxHp)) return state;
  if (move === 'focus' && (!state.spirit || state.qi >= stats.maxQi)) return state;
  const enemy = encounters[state.chapter];
  const bonus = state.technique === 'resolve' ? 3 : 0;
  const damage = move === 'skill' ? 13 + bonus + blades[state.blade].attack : move === 'attack' ? stats.attack : 0;
  const qiGain = move === 'guard' ? (state.technique === 'compassion' ? 4 : 3) : move === 'focus' ? 5 : move === 'attack' ? 1 : 0;
  const qi = move === 'skill' ? state.qi - 3 : Math.min(stats.maxQi, state.qi + qiGain);
  const enemyHp = Math.max(0, battle.enemyHp - damage);
  if (!enemyHp) return { ...state, qi, xp: state.xp + enemy.xp, step: state.step + 1, combat: null };

  const incoming = enemyDamage(state, battle.turn);
  const taken = move === 'guard' ? Math.ceil(incoming / 4) : incoming;
  const healed = move === 'heal' ? Math.min(15, stats.maxHp - state.hp) : 0;
  const hp = Math.max(0, state.hp + healed - taken);
  const medicine = state.medicine - Number(move === 'heal');
  const spirit = state.spirit - Number(move === 'focus');
  const result = move === 'guard' ? 'Thủ thế và hồi nội lực.' : move === 'heal'
    ? `Hồi ${healed} Sinh lực.` : move === 'focus' ? 'Chuyển Linh lực thành Nội lực.' : `Gây ${damage} sát thương.`;
  return {
    ...state, hp, qi, spirit, medicine,
    combat: { enemyHp, turn: battle.turn + 1, log: `${result} Chịu ${taken} sát thương.` },
  };
}

export function recover(state: GameState): GameState {
  if (state.hp || !state.combat) return state;
  const stats = attributes(state);
  return { ...state, hp: stats.maxHp, qi: 5, spirit: stats.spirit, combat: null };
}

function isStance(value: unknown): value is Stance | null {
  return value === null || value === 'compassion' || value === 'resolve';
}

function inRange(value: unknown, min: number, max: number) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
}

function inferredXp(state: Pick<GameState, 'chapter' | 'step'>) {
  if (state.chapter === 'prologue') return (state.step >= 3 ? 30 : 0) + (state.step >= 4 ? 20 : 0);
  return 50 + (state.step >= 4 ? 50 : 0) + (state.step >= 5 ? 40 : 0);
}

export function parseSave(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const save = JSON.parse(raw) as Omit<GameState, 'version'> & { version: number };
    if (!save || ![1, 2].includes(save.version) || !['prologue', 'chapter01'].includes(save.chapter) ||
        !inRange(save.step, 0, stepLimit(save.chapter)) || !isStance(save.stance) || !isStance(save.technique)) return null;
    if ((save.chapter === 'chapter01' || save.step > 0) && !save.stance) return null;
    const shouldKnowTechnique = save.chapter === 'chapter01' && save.step >= 3;
    if (Boolean(save.technique) !== shouldKnowTechnique) return null;
    if (save.combat !== null) {
      if (!save.combat || save.step !== combatStep(save.chapter) ||
          !inRange(save.combat.enemyHp, 1, encounters[save.chapter].hp) ||
          !inRange(save.combat.turn, 1, Number.MAX_SAFE_INTEGER) ||
          typeof save.combat.log !== 'string' || save.combat.log.length > 160) return null;
    } else if (!save.hp) return null;
    const state: GameState = save.version === 1
      ? { ...newGame(), chapter: save.chapter, step: save.step, stance: save.stance, technique: save.technique,
          hp: save.hp, qi: save.qi, combat: save.combat, xp: inferredXp(save) }
      : { ...save, version: 2 };
    if (!state.profile || !validName(state.profile.name) || !validOrigin(state.profile.origin) ||
        !Object.hasOwn(blades, state.blade) || typeof state.sideQuest !== 'boolean' ||
        (state.sideQuest && (state.chapter !== 'chapter01' || state.step < 1)) ||
        state.xp !== inferredXp(state) + (state.sideQuest ? 20 : 0) ||
        !inRange(state.medicine, 0, 3) || !ownedBlades(state).includes(state.blade)) return null;
    const stats = attributes(state);
    if (!inRange(state.hp, 0, stats.maxHp) || !inRange(state.qi, 0, stats.maxQi) || !inRange(state.spirit, 0, stats.spirit)) return null;
    return state;
  } catch {
    return null;
  }
}
