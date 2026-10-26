import test from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES, allWords, shuffle, submit, evaluate, validThreadState } from '../thread-engine.js';
import { streaks } from '../stats.js';
const p = PUZZLES[0];
test('all original puzzles have four named disjoint groups of four words', () => {
  assert.equal(new Set(PUZZLES.map(p => p.id)).size, 12);
  for (const p of PUZZLES) {
    assert.equal(p.groups.length, 4);
    assert.equal(new Set(allWords(p)).size, 16);
    p.groups.forEach(g => { assert.ok(g.name); assert.equal(g.words.length, 4); });
    assert.deepEqual(shuffle(allWords(p)).sort(), allWords(p).sort());
  }
});
test('group validation, one away, duplicate penalty protection and winning', () => {
  const g = { attempts: [] };
  assert.equal(submit(p, g, ['ROOT']).accepted, false);
  assert.match(submit(p, g, ['ROOT','TRUNK','BRANCH','PIANO']).message, /One away/);
  assert.equal(evaluate(p, g.attempts).mistakes, 1);
  assert.equal(submit(p, g, ['PIANO','ROOT','TRUNK','BRANCH']).accepted, false);
  for (const group of p.groups) assert.equal(submit(p, g, group.words).found, true);
  assert.equal(evaluate(p, g.attempts).status, 'won');
  assert.equal(submit(p, g, p.groups[0].words).accepted, false);
});
test('four wrong groups end a puzzle and block further attempts', () => {
  const g = { attempts: [] };
  for (let i = 0; i < 4; i++) assert.equal(submit(p, g, p.groups.map(group => group.words[i])).accepted, true);
  assert.equal(evaluate(p, g.attempts).status, 'lost');
  assert.equal(submit(p, g, p.groups[0].words).accepted, false);
});
test('save validation replays attempts and rejects corrupt state', () => {
  const g = { attempts: [], selected: [], order: allWords(p) };
  const state = { version:1, index:0, games:{[p.id]:g}, results:[] };
  assert.equal(validThreadState(state), true);
  for (const group of p.groups) submit(p, g, group.words);
  state.results.push(p.id);
  assert.equal(validThreadState(state), true);
  g.attempts.push(p.groups[0].words);
  assert.equal(validThreadState(state), false);
  assert.equal(validThreadState({ ...state, index: -1 }), false);
});
test('streak counts completed wins and resets only on a loss', () => {
  assert.deepEqual(streaks(['won','won','playing','won']), {current:3,best:3});
  assert.deepEqual(streaks(['won','won','lost','won']), {current:1,best:2});
  assert.deepEqual(streaks([]), {current:0,best:0});
});
