import { streaks } from './stats.js';
import { ANSWERS, scoreGuess, outcome, keyboardScores, freshState, validState } from './engine.js';

const $ = id => document.getElementById(id);
const STORAGE_KEY = 'games-for-one.five-letters.v1';
const symbols = { correct: '✓', present: '↔', absent: '–' };
const descriptions = { correct: 'right spot', present: 'wrong spot', absent: 'not in word' };
let state, dictionary, ready = false, storageAvailable = true;
const answer = () => state.order[state.index];
const game = () => state.games[answer()] ||= { guesses: [], draft: '' };

function message(text, error = false) {
  $('message').textContent = text;
  $('message').classList.toggle('error', error);
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageAvailable = true;
  } catch { storageAvailable = false; }
  $('save-status').textContent = storageAvailable ? 'Saved on this device' : 'Progress won’t be saved';
}

function render() {
  const current = game();
  const stats = streaks((state.results || []).map(word => outcome(state.games[word], word)));
  const wins = Object.entries(state.games).filter(([word, entry]) => outcome(entry, word) === 'won').length;
  $('five-stats').textContent = `${wins} wins · ${stats.current} current streak · ${stats.best} best streak`;
  const status = outcome(current, answer());
  const keys = keyboardScores(current.guesses, answer());
  $('puzzle-label').textContent = `Puzzle ${String(state.index + 1).padStart(3, '0')}`;
  $('board').replaceChildren();
  for (let row = 0; row < 6; row++) {
    const rowElement = document.createElement('div');
    rowElement.className = 'board-row';
    const submitted = row < current.guesses.length;
    const active = row === current.guesses.length && status === 'playing';
    if (active) rowElement.classList.add('active');
    const word = submitted ? current.guesses[row] : active ? current.draft : '';
    const scores = submitted ? scoreGuess(word, answer()) : [];
    rowElement.setAttribute('role', 'group');
    rowElement.setAttribute('aria-label', `Guess ${row + 1}${active ? ', current guess' : ''}`);
    for (let column = 0; column < 5; column++) {
      const tile = document.createElement('span');
      tile.className = `tile ${submitted ? scores[column] : word[column] ? 'filled' : ''}`;
      tile.textContent = word[column] || '';
      tile.setAttribute('aria-label', `Letter ${column + 1}: ${word[column] || 'empty'}${submitted ? ', ' + descriptions[scores[column]] : ''}`);
      if (submitted) {
        const mark = document.createElement('small');
        mark.textContent = symbols[scores[column]];
        mark.setAttribute('aria-hidden', 'true');
        tile.append(mark);
      }
      rowElement.append(tile);
    }
    $('board').append(rowElement);
  }
  for (const button of $('keyboard').querySelectorAll('button')) {
    const key = button.dataset.key;
    button.className = `key ${key.length > 1 ? 'wide' : ''} ${keys[key] || ''}`;
    button.disabled = status !== 'playing';
    button.setAttribute('aria-label', `${key === 'Backspace' ? 'Delete letter' : key}${keys[key] ? ', ' + descriptions[keys[key]] : ''}`);
  }
  $('result').hidden = status === 'playing';
  if (status !== 'playing') {
    $('result-title').textContent = status === 'won' ? 'Nicely done.' : 'Another word, another try.';
    $('result-detail').textContent = status === 'won' ? `${answer()} · Solved in ${current.guesses.length} of 6.` : `The word was ${answer()}.`;
    const finished = state.order.every(word => state.games[word] && outcome(state.games[word], word) !== 'playing');
    $('next-button').textContent = finished ? 'View collection →' : 'Next puzzle →';
  }
}

function input(key) {
  if ($('five-screen').hidden || !ready || document.querySelector('dialog[open]') || outcome(game(), answer()) !== 'playing') return;
  const current = game();
  if (key === 'Backspace') {
    current.draft = current.draft.slice(0, -1);
    message('');
  } else if (key === 'Enter') {
    if (current.draft.length !== 5) return message('A little more… enter five letters.', true);
    if (!dictionary.has(current.draft)) return message('That word isn’t in our dictionary. Try another.', true);
    if (current.guesses.includes(current.draft)) return message('You’ve tried that word. Try a different one.', true);
    const guess = current.draft;
    current.guesses.push(guess);
    current.draft = '';
    const status = outcome(current, answer());
    state.results ||= [];
    if (status !== 'playing' && !state.results.includes(answer())) state.results.push(answer());
    message(status === 'won' ? `You found ${answer()} in ${current.guesses.length} guesses!` : status === 'lost' ? `The word was ${answer()}. A fresh puzzle is waiting.` : `${guess}: ${scoreGuess(guess, answer()).filter(score => score === 'correct').length} in the right spot, ${scoreGuess(guess, answer()).filter(score => score === 'present').length} elsewhere.`);
  } else if (/^[A-Z]$/.test(key)) {
    if (current.draft.length === 5) return;
    current.draft += key;
    message('');
  } else return;
  save();
  render();
}

for (const letters of ['Q W E R T Y U I O P', 'A S D F G H J K L', 'Enter Z X C V B N M Backspace']) {
  const row = document.createElement('div');
  row.className = 'keyboard-row';
  for (const key of letters.split(' ')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.key = key;
    button.className = `key ${key.length > 1 ? 'wide' : ''}`;
    button.textContent = key === 'Backspace' ? '⌫' : key === 'Enter' ? 'ENTER' : key;
    button.setAttribute('aria-label', key === 'Backspace' ? 'Delete letter' : key);
    button.disabled = true;
    button.addEventListener('click', () => input(key));
    row.append(button);
  }
  $('keyboard').append(row);
}

document.addEventListener('keydown', event => {
  if ($('five-screen').hidden || event.ctrlKey || event.metaKey || event.altKey || document.querySelector('dialog[open]')) return;
  if (event.key === 'Enter' && event.target.closest('button, a')) return;
  if (/^[a-z]$/i.test(event.key) || ['Backspace', 'Enter'].includes(event.key)) {
    event.preventDefault();
    input(event.key.length === 1 ? event.key.toUpperCase() : event.key);
  }
});

function openCollection() {
  const solved = state.order.filter(word => state.games[word] && outcome(state.games[word], word) === 'won').length;
  const finished = state.order.filter(word => state.games[word] && outcome(state.games[word], word) !== 'playing').length;
  $('collection-summary').textContent = `${solved} solved · ${finished} finished · ${state.order.length} puzzles. Pick any puzzle; your other guesses will be kept.`;
  $('puzzle-list').replaceChildren();
  state.order.forEach((word, index) => {
    const entry = state.games[word];
    const status = entry ? outcome(entry, word) : 'playing';
    const started = entry && (entry.guesses.length || entry.draft);
    const symbol = status === 'won' ? '✓' : status === 'lost' ? '–' : started ? '•' : '';
    const button = document.createElement('button');
    button.className = `puzzle-choice ${status} ${index === state.index ? 'selected' : ''}`;
    button.textContent = `${String(index + 1).padStart(3, '0')} ${symbol}`;
    button.setAttribute('aria-label', `Puzzle ${index + 1}, ${status === 'won' ? 'solved' : status === 'lost' ? 'finished' : started ? 'in progress' : 'not started'}`);
    if (index === state.index) button.setAttribute('aria-current', 'true');
    button.addEventListener('click', () => {
      state.index = index;
      game();
      save();
      render();
      $('collection-dialog').close();
      message(status === 'playing' ? 'Your next word is waiting.' : 'You’ve finished this puzzle. Choose another from your collection.');
    });
    $('puzzle-list').append(button);
  });
  $('collection-dialog').showModal();
}

$('collection-button').addEventListener('click', openCollection);
$('next-button').addEventListener('click', () => {
  for (let offset = 1; offset <= state.order.length; offset++) {
    const index = (state.index + offset) % state.order.length;
    const word = state.order[index];
    if (!state.games[word] || outcome(state.games[word], word) === 'playing') {
      state.index = index;
      game(); save(); render();
      message('A fresh start. Make it a good word.');
      $('collection-button').focus();
      return;
    }
  }
  openCollection();
});
$('five-help').addEventListener('click', () => $('help-dialog').showModal());
$('about-button').addEventListener('click', () => $('about-dialog').showModal());
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } }));

async function initialize() {
  try {
    const response = await fetch('./dictionary.json');
    if (!response.ok) throw new Error('Dictionary unavailable');
    dictionary = new Set([...(await response.json()), ...ANSWERS]);
    let restored = false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (validState(parsed, dictionary)) state = parsed;
        else restored = true;
      }
    } catch { restored = true; }
    state ||= freshState();
    game(); save(); render();
    ready = true;
    $('collection-button').disabled = false;
    message(restored ? 'Saved progress couldn’t be restored. A fresh collection is ready.' : 'Start with any five-letter word.');
  } catch {
    message('Couldn’t load the word collection. Connect to the internet and reload to try again.', true);
  }
}
initialize();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(async () => {
    await navigator.serviceWorker.ready;
    $('offline-status').textContent = 'Ready for offline play on this device.';
  }).catch(() => { $('offline-status').textContent = 'Offline setup is unavailable. You can still play while connected.'; });
} else $('offline-status').textContent = 'This browser does not support offline installation.';

// Use the latest complete save when returning from another tab or installed window.
window.addEventListener('storage', event => {
  if (!ready || event.key !== STORAGE_KEY || !event.newValue) return;
  try {
    const latest = JSON.parse(event.newValue);
    if (validState(latest, dictionary)) {
      state = latest;
      render();
      if ($('collection-dialog').open) { $('collection-dialog').close(); openCollection(); }
      message('Progress updated from another window.');
    }
  } catch { /* Keep the current game if another window supplied an invalid save. */ }
});
