import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ANSWERS, scoreGuess, keyboardScores, outcome, freshState, validState } from '../engine.js';
const dictionary = new Set(JSON.parse(readFileSync(new URL('../dictionary.json', import.meta.url))));

test('duplicate letters consume only the available copies, with exact matches first', () => {
  assert.deepEqual(scoreGuess('APPLE', 'AMPLE'), ['correct', 'absent', 'correct', 'correct', 'correct']);
  assert.deepEqual(scoreGuess('EERIE', 'SHEEP'), ['present', 'present', 'absent', 'absent', 'absent']);
  assert.deepEqual(scoreGuess('ALLEY', 'APPLE'), ['correct', 'present', 'absent', 'present', 'absent']);
});
test('keyboard keeps the strongest evidence for each letter', () => {
  assert.equal(keyboardScores(['APPLE'], 'AMPLE').P, 'correct');
  assert.equal(keyboardScores(['ALLEY', 'LEMON'], 'APPLE').L, 'present');
});
test('win on sixth guess takes precedence over loss', () => {
  assert.equal(outcome({ guesses: ['BEACH','CRANE','DRIFT','FLUTE','GRASS','APPLE'] }, 'APPLE'), 'won');
  assert.equal(outcome({ guesses: ['BEACH','CRANE','DRIFT','FLUTE','GRASS','HONEY'] }, 'APPLE'), 'lost');
  assert.equal(outcome({ guesses: [] }, 'APPLE'), 'playing');
});
test('collection contains unique valid five-letter answers', () => {
  assert.equal(new Set(ANSWERS).size, ANSWERS.length);
  assert.ok(ANSWERS.length > 200);
  for (const word of ANSWERS) {
    assert.match(word, /^[A-Z]{5}$/);
    assert.ok(dictionary.has(word), `${word} missing from dictionary`);
  }
});
test('saved state rejects corruption and restores valid progress', () => {
  const state = freshState();
  assert.equal(validState(state, dictionary), true);
  state.games.APPLE = { guesses: ['CRANE'], draft: 'AP' };
  assert.equal(validState(JSON.parse(JSON.stringify(state)), dictionary), true);
  assert.equal(validState({ ...state, index: -1 }, dictionary), false);
  assert.equal(validState({ ...state, order: Array(ANSWERS.length).fill('APPLE') }, dictionary), false);
  assert.equal(validState({ ...state, games: { APPLE: { guesses: ['APPLE', 'CRANE'], draft: '' } } }, dictionary), false);
  assert.equal(validState({ ...state, games: { APPLE: { guesses: ['XXXXX'], draft: '' } } }, dictionary), false);
});
