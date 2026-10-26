import { TRAILS } from './trails-puzzles.js';
export { TRAILS };
export const adjacent = (a,b) => a !== b && Math.abs(a % 6 - b % 6) <= 1 && Math.abs(Math.floor(a/6) - Math.floor(b/6)) <= 1;
export function validPath(path) {
  return Array.isArray(path) && path.length > 0 && new Set(path).size === path.length && path.every((cell,i) => Number.isInteger(cell) && cell >= 0 && cell < 48 && (!i || adjacent(path[i-1],cell)));
}
export const spell = (puzzle,path) => path.map(i=>puzzle.letters[i]).join('');
export const freshTrail = () => ({found:[],bonus:[],hints:0,hint:null,selected:[]});
export function chooseCell(puzzle,game,cell) {
  if (game.found.some(word => puzzle.words.find(w=>w.word===word).path.includes(cell))) return false;
  const selected=game.selected;
  const previous=selected.indexOf(cell);
  if (previous >= 0) { game.selected=selected.slice(0,previous+1); return true; }
  if (!selected.length || adjacent(selected.at(-1),cell)) { selected.push(cell); return true; }
  return false;
}
export function submitTrail(puzzle,game,dictionary) {
  const path=game.selected;
  if (!validPath(path) || path.length < 4) return 'Use at least four neighbouring letters.';
  const word=spell(puzzle,path);
  const target=puzzle.words.find(w=>w.word===word && w.path.every((cell,i)=>cell===path[i]));
  if (target) {
    if(game.found.includes(word))return 'You’ve already found that word.';
    game.found.push(word);game.selected=[];
    if(game.hint===word)game.hint=null;
    return target.span ? `Spanning word found: ${word}!` : `Theme word found: ${word}!`;
  }
  if (dictionary.has(word)) {
    if(game.bonus.includes(word))return 'You’ve already used that bonus word.';
    game.bonus.push(word);game.selected=[];
    return `${word} is a bonus word. ${Math.max(0,3-(game.bonus.length-game.hints*3))} more to earn a hint.`;
  }
  return 'Not a theme or dictionary word. Try another path.';
}
export function takeHint(puzzle,game) {
  if(game.hint || game.bonus.length-game.hints*3 < 3)return false;
  const target=puzzle.words.find(w=>!w.span && !game.found.includes(w.word)) || puzzle.words.find(w=>!game.found.includes(w.word));
  if(!target)return false;
  game.hints++;game.hint=target.word;return true;
}
export function validTrailsState(state,dictionary) {
  if(!state || state.version!==1 || !Number.isInteger(state.index) || !TRAILS[state.index] || !state.games || typeof state.games!=='object' || Array.isArray(state.games))return false;
  return Object.entries(state.games).every(([id,g])=>{
    const p=TRAILS.find(p=>p.id===id);
    if(!p || !g || !Array.isArray(g.found) || new Set(g.found).size!==g.found.length || !g.found.every(word=>p.words.some(w=>w.word===word)) || !Array.isArray(g.bonus) || new Set(g.bonus).size!==g.bonus.length || !g.bonus.every(word=>typeof word==='string' && dictionary.has(word)) || !Number.isInteger(g.hints) || g.hints<0 || g.hints*3>g.bonus.length || !(g.hint===null || p.words.some(w=>w.word===g.hint && !g.found.includes(w.word))) || !Array.isArray(g.selected))return false;
    return (!g.selected.length || validPath(g.selected)) && !g.selected.some(cell=>g.found.some(word=>p.words.find(w=>w.word===word).path.includes(cell)));
  });
}
