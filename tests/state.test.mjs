import assert from 'node:assert/strict';
import test from 'node:test';
import {
  advance, enterChapter, maxHp, newGame, parseSave, playMove, recover, startCombat,
} from '../src/game/state.ts';

function atChapter01(stance, technique) {
  let state = advance(advance(newGame(), stance));
  state = startCombat(state);
  for (const move of ['skill', 'attack', 'attack']) state = playMove(state, move);
  state = enterChapter(advance(state));
  return advance(advance(advance(state)), technique);
}

test('progression requires a choice and a win before the next chapter', () => {
  const initial = newGame();
  assert.equal(advance(initial), initial);
  assert.equal(enterChapter(initial), initial);
  const battleGate = advance(advance(initial, 'compassion'));
  assert.equal(advance(battleGate), battleGate);
  const state = atChapter01('compassion', 'resolve');
  assert.equal(state.chapter, 'chapter01');
  assert.equal(state.stance, 'compassion');
  assert.equal(state.technique, 'resolve');
  assert.equal(state.step, 3);
});

test('guard counters the telegraphed hit and each technique can win', () => {
  for (const technique of ['compassion', 'resolve']) {
    let state = startCombat(atChapter01('resolve', technique));
    state = playMove(playMove(state, 'skill'), 'skill');
    assert.equal(state.combat.turn, 3);
    assert.equal(playMove(state, 'skill'), state);
    const before = state.hp;
    state = playMove(state, 'guard');
    assert.equal(before - state.hp, 4);
    assert.equal(state.qi, technique === 'compassion' ? 6 : 5);
    state = playMove(state, 'skill');
    if (state.combat) state = playMove(state, 'attack');
    assert.equal(state.combat, null);
    assert.equal(advance(state).step, 5);
  }
});

test('in-battle saves survive reload, and a defeated player can retry', () => {
  let state = startCombat(atChapter01('compassion', 'compassion'));
  for (let turn = 0; turn < 4; turn++) state = playMove(state, 'guard');
  for (let turn = 0; turn < 6; turn++) state = playMove(state, 'attack');
  assert.equal(state.hp, 0);
  assert.deepEqual(parseSave(JSON.stringify(state)), state);
  const restored = recover(state);
  assert.equal(restored.hp, maxHp);
  assert.equal(restored.step, state.step);
  assert.equal(startCombat(restored).combat.turn, 1);
  assert.equal(parseSave(JSON.stringify({ ...state, combat: null })), null);
  assert.equal(parseSave(JSON.stringify({ ...state, chapter: '__proto__' })), null);
  assert.equal(parseSave('invalid json'), null);
});

test('v1 saves migrate without erasing the chapter, choices, or active fight', () => {
  const old = startCombat(atChapter01('resolve', 'compassion'));
  const { chapter, step, stance, technique, hp, qi, combat } = old;
  const migrated = parseSave(JSON.stringify({ version: 1, chapter, step, stance, technique, hp, qi, combat }));
  assert.equal(migrated.version, 2);
  assert.equal(migrated.profile.name, 'Lữ Khách');
  assert.equal(migrated.xp, 50);
  assert.deepEqual(migrated.combat, combat);
  assert.deepEqual(parseSave(JSON.stringify(migrated)), migrated);
});
