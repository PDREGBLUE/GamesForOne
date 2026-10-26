import { DIFFICULTIES, PUZZLES, ensurePuzzleCount, allWords, shuffle, evaluate, submit, validThreadState } from './thread-engine.js';
import { streaks } from './stats.js';
const $ = id => document.getElementById(id);
const KEY = 'games-for-one.common-thread.v1';
let state = { version: 1, index: 0, games: {}, results: [] };
let restored = false;
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (validThreadState(parsed)) state = parsed;
    else restored = true;
  }
} catch { restored = true; }
const puzzle = () => PUZZLES[state.index];
const game = () => state.games[puzzle().id] ||= { attempts: [], order: shuffle(allWords(puzzle())), selected: [] };
function save() {
  state.puzzleCount = PUZZLES.length;
  try { localStorage.setItem(KEY, JSON.stringify(state)); $('thread-save').textContent = 'Saved on this device'; }
  catch { $('thread-save').textContent = 'Progress won’t be saved'; }
}
function message(text) { $('thread-message').textContent = text; }
function render() {
  const p = puzzle(), g = game();
  const { solved, mistakes, status } = evaluate(p, g.attempts);
  const stats = streaks(state.results.map(id => evaluate(PUZZLES.find(p => p.id === id), state.games[id].attempts).status));
  const wins = state.results.filter(id => evaluate(PUZZLES.find(p => p.id === id), state.games[id].attempts).status === 'won').length;
  $('thread-stats').textContent = `${wins} wins · ${stats.current} current streak · ${stats.best} best streak`;
  $('thread-puzzle-label').textContent = `Puzzle ${String(state.index + 1).padStart(3, '0')}`;
  $('thread-board').replaceChildren();
  const revealed = status === 'lost' ? [...solved, ...p.groups.map((_, i) => i).filter(i => !solved.includes(i))] : solved;
  for (const index of revealed) {
    const group = p.groups[index];
    const panel = document.createElement('div');
    panel.className = `solved-group group-${index}`;
    const title = document.createElement('strong');
    title.textContent = `${solved.includes(index) ? '✓ ' : 'Revealed: '}${group.name}`;
    const words = document.createElement('span'); words.textContent = group.words.join(' · ');
    const level = document.createElement('small'); level.textContent = `${index + 1} · ${DIFFICULTIES[index]}`;
    panel.append(level, title, words); $('thread-board').append(panel);
  }
  if (status === 'playing') for (const word of g.order.filter(word => !solved.some(i => p.groups[i].words.includes(word)))) {
    const button = document.createElement('button');
    button.className = 'word-card';
    button.textContent = word;
    button.setAttribute('aria-pressed', String(g.selected.includes(word)));
    button.addEventListener('click', () => {
      if (g.selected.includes(word)) g.selected = g.selected.filter(w => w !== word);
      else if (g.selected.length < 4) g.selected.push(word);
      else { message('Four selected. Deselect a word to change your group.'); return; }
      save(); render();
      // Preserve keyboard focus even though the grid was rebuilt.
      [...$('thread-board').querySelectorAll('button')].find(b => b.textContent === word)?.focus({ preventScroll: true });
      message(`${g.selected.length} of 4 selected.`);
    });
    $('thread-board').append(button);
  }
  $('thread-lives').textContent = `Mistakes left: ${4 - mistakes} ${'●'.repeat(4 - mistakes)}${'○'.repeat(mistakes)}`;
  $('thread-submit').disabled = g.selected.length !== 4;
  $('thread-clear').disabled = g.selected.length === 0;
  $('thread-controls').hidden = status !== 'playing';
  $('thread-result').hidden = status === 'playing';
  $('thread-result-title').textContent = status === 'won' ? 'All connected.' : 'Threads revealed.';
  $('thread-result-detail').textContent = status === 'won' ? `Four groups found · ${mistakes} mistakes.` : `${solved.length} of 4 found. Try another puzzle.`;
  $('thread-next').textContent = state.results.length === PUZZLES.length ? 'Next pack →' : 'Next puzzle →';
}
$('thread-submit').addEventListener('click', () => {
  const result = submit(puzzle(), game(), game().selected);
  if (result.accepted) {
    game().selected = [];
    const status = evaluate(puzzle(), game().attempts).status;
    if (status !== 'playing' && !state.results.includes(puzzle().id)) state.results.push(puzzle().id);
    save(); render();
    message(status === 'won' ? 'You found all four groups!' : status === 'lost' ? 'No mistakes left. Here are all four connections.' : result.message);
  } else message(result.message);
});
$('thread-shuffle').addEventListener('click', () => { game().order = shuffle(game().order); save(); render(); message('Words shuffled. Your selection is kept.'); });
$('thread-clear').addEventListener('click', () => { game().selected = []; save(); render(); message('Selection cleared.'); });
function collection() {
  $('thread-summary').textContent = `${state.results.length} of ${PUZZLES.length} finished. New packs are added automatically when you finish. Categories may recur in new combinations.`;
  const pack = $('thread-pack');
  pack.replaceChildren();
  for (let i = 0; i < Math.ceil(PUZZLES.length / 12); i++) { const option = new Option(`Pack ${i + 1} · puzzles ${i * 12 + 1}–${Math.min(PUZZLES.length, (i + 1) * 12)}`, String(i)); pack.add(option); }
  pack.value = String(Math.floor(state.index / 12));
  pack.onchange = drawCollection;
  drawCollection();
  $('thread-collection-dialog').showModal();
}
function drawCollection() {
  $('thread-puzzle-list').replaceChildren();
  const first = Number($('thread-pack').value) * 12;
  PUZZLES.slice(first, first + 12).forEach((p, offset) => {
    const index = first + offset;
    const status = state.games[p.id] ? evaluate(p, state.games[p.id].attempts).status : 'playing';
    const button = document.createElement('button');
    button.className = `puzzle-choice ${status} ${state.index === index ? 'selected' : ''}`;
    button.textContent = `${String(index + 1).padStart(3, '0')} ${status === 'won' ? '✓' : status === 'lost' ? '–' : ''}`;
    button.setAttribute('aria-label', `Common Thread puzzle ${index + 1}, ${status}`);
    button.addEventListener('click', () => { state.index = index; game(); save(); render(); $('thread-collection-dialog').close(); message('Find the common threads.'); });
    $('thread-puzzle-list').append(button);
  });
}
$('thread-collection-button').addEventListener('click', collection);
$('thread-next').addEventListener('click', () => {
  if (state.results.length === PUZZLES.length) {
    const firstNew = PUZZLES.length;
    if (ensurePuzzleCount(firstNew + 12)) { state.index = firstNew; game(); save(); render(); message('A new pack of 12 puzzles is ready — enjoy!'); return; }
    message('You’ve finished every available combination. More categories will arrive in an app update.'); collection(); return;
  }
  for (let offset = 1; offset <= PUZZLES.length; offset++) {
    const index = (state.index + offset) % PUZZLES.length;
    if (!state.results.includes(PUZZLES[index].id)) {
      state.index = index; game(); save(); render(); message('A fresh set of connections.'); return;
    }
  }
  collection();
});
$('thread-help').addEventListener('click', () => $('thread-help-dialog').showModal());
window.addEventListener('storage', event => {
  if (event.key !== KEY || !event.newValue) return;
  try {
    const next = JSON.parse(event.newValue);
    if (validThreadState(next)) { state = next; render(); message('Progress updated from another window.'); }
  } catch { /* Keep valid current progress. */ }
});
game(); save(); render();
if (restored) message('Saved progress couldn’t be restored. A fresh collection is ready.');
