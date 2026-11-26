export type ChapterId = 'prologue' | 'chapter01';
export type Stance = 'compassion' | 'resolve';
export type Move = 'attack' | 'guard' | 'skill';

export interface GameState {
  version: 1;
  chapter: ChapterId;
  step: number;
  stance: Stance | null;
  technique: Stance | null;
  hp: number;
  qi: number;
  combat: { enemyHp: number; turn: number; log: string } | null;
}

export const maxHp = 36;
export const maxQi = 8;
export const saveKey = 'thien-menh.save.v1';

export const encounters = {
  prologue: { name: 'Khách áo đen', hp: 22, strike: 4, heavy: 9 },
  chapter01: { name: 'Hộ vệ Vô Danh', hp: 46, strike: 6, heavy: 13 },
};

export function newGame(): GameState {
  return {
    version: 1, chapter: 'prologue', step: 0, stance: null,
    technique: null, hp: maxHp, qi: 5, combat: null,
  };
}

export function stepLimit(chapter: ChapterId) {
  return chapter === 'prologue' ? 4 : 5;
}

export function combatStep(chapter: ChapterId) {
  return chapter === 'prologue' ? 2 : 3;
}

export function advance(state: GameState, choice?: Stance): GameState {
  if (state.combat || state.step >= stepLimit(state.chapter)) return state;
  if (state.step === combatStep(state.chapter)) return state;
  const choosesStance = state.chapter === 'prologue' && state.step === 0;
  const choosesTechnique = state.chapter === 'chapter01' && state.step === 2;
  if ((choosesStance || choosesTechnique) && !choice) return state;
  return {
    ...state,
    step: state.step + 1,
    stance: choosesStance ? choice! : state.stance,
    technique: choosesTechnique ? choice! : state.technique,
    hp: choosesTechnique ? maxHp : state.hp,
    qi: choosesTechnique ? maxQi : state.qi,
  };
}

export function enterChapter(state: GameState): GameState {
  if (state.chapter !== 'prologue' || state.step !== stepLimit('prologue')) return state;
  return { ...state, chapter: 'chapter01', step: 0, hp: maxHp, qi: 5, combat: null };
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

export function playMove(state: GameState, move: Move): GameState {
  const battle = state.combat;
  if (!battle || !state.hp || (move === 'skill' && state.qi < 3)) return state;
  const enemy = encounters[state.chapter];
  const bonus = state.technique === 'resolve' ? 3 : 0;
  const damage = move === 'skill' ? 13 + bonus : move === 'attack' ? 7 : 0;
  const qiGain = move === 'guard' ? (state.technique === 'compassion' ? 4 : 3) : 1;
  const qi = move === 'skill' ? state.qi - 3 : Math.min(maxQi, state.qi + qiGain);
  const enemyHp = Math.max(0, battle.enemyHp - damage);
  if (!enemyHp) return { ...state, qi, step: state.step + 1, combat: null };

  const incoming = isCharging(battle.turn) ? enemy.heavy : enemy.strike;
  const taken = move === 'guard' ? Math.ceil(incoming / 4) : incoming;
  const hp = Math.max(0, state.hp - taken);
  const result = move === 'guard' ? 'Thủ thế và hồi khí.' : `Gây ${damage} sát thương.`;
  return {
    ...state, hp, qi,
    combat: { enemyHp, turn: battle.turn + 1, log: `${result} Chịu ${taken} sát thương.` },
  };
}

export function recover(state: GameState): GameState {
  if (state.hp || !state.combat) return state;
  return { ...state, hp: maxHp, qi: 5, combat: null };
}

function isStance(value: unknown): value is Stance | null {
  return value === null || value === 'compassion' || value === 'resolve';
}

function inRange(value: unknown, min: number, max: number) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
}

export function parseSave(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const save = JSON.parse(raw) as GameState | null;
    if (!save || save.version !== 1 || !['prologue', 'chapter01'].includes(save.chapter) ||
        !inRange(save.step, 0, stepLimit(save.chapter)) || !isStance(save.stance) ||
        !isStance(save.technique) || !inRange(save.hp, 0, maxHp) || !inRange(save.qi, 0, maxQi)) return null;
    if ((save.chapter === 'chapter01' || save.step > 0) && !save.stance) return null;
    const shouldKnowTechnique = save.chapter === 'chapter01' && save.step >= 3;
    if (Boolean(save.technique) !== shouldKnowTechnique) return null;
    if (save.combat !== null) {
      if (!save.combat || save.step !== combatStep(save.chapter) ||
          !inRange(save.combat.enemyHp, 1, encounters[save.chapter].hp) ||
          !inRange(save.combat.turn, 1, Number.MAX_SAFE_INTEGER) ||
          typeof save.combat.log !== 'string' || save.combat.log.length > 160) return null;
    } else if (!save.hp) return null;
    return save;
  } catch {
    return null;
  }
}
