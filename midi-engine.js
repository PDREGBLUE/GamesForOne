import { MIDIS } from './midi-puzzles.js';
import { MIDIS as LEGACY_MIDIS } from './midi-legacy-puzzles.js';
export { MIDIS, LEGACY_MIDIS };
export const ALL_MIDIS=[...MIDIS,...LEGACY_MIDIS];
export function freshMidi(p){return{letters:Array(p.solution.length).fill(''),pencil:[],revealed:[],wrong:[],selected:p.entries[0].cells[0],direction:'across',seconds:0,completed:false,assisted:false,checks:0};}
export function currentEntry(p,g){return p.entries.find(e=>e.direction===g.direction&&e.cells.includes(g.selected));}
export function solved(p,g){return [...p.solution].every((letter,i)=>letter==='#'||g.letters[i]===letter);}
export function writeCell(p,g,letter,pencil=false){
 if(g.completed||p.solution[g.selected]==='#'||g.revealed.includes(g.selected))return false;
 const i=g.selected;g.letters[i]=letter;g.wrong=g.wrong.filter(c=>c!==i);g.pencil=g.pencil.filter(c=>c!==i);if(pencil&&letter)g.pencil.push(i);
 if(solved(p,g)){g.completed=true;g.pencil=[];}return true;
}
export function checkCells(p,g,cells){g.checks++;g.assisted=true;const wrong=cells.filter(i=>g.letters[i]&&g.letters[i]!==p.solution[i]);g.wrong=[...new Set([...g.wrong.filter(i=>!cells.includes(i)),...wrong])];return wrong.length;}
export function revealCells(p,g,cells){for(const i of cells){if(p.solution[i]==='#')continue;if(g.letters[i]!==p.solution[i]&&!g.revealed.includes(i))g.revealed.push(i);g.letters[i]=p.solution[i];}g.assisted=true;g.wrong=g.wrong.filter(i=>!cells.includes(i));g.pencil=g.pencil.filter(i=>!cells.includes(i));if(solved(p,g))g.completed=true;}
export function moveEntry(p,g,delta=1){const entries=p.entries.filter(e=>e.direction===g.direction);const at=entries.indexOf(currentEntry(p,g));const e=entries[(at+delta+entries.length)%entries.length];g.selected=e.cells.find(i=>!g.letters[i])??e.cells[0];}
export function advanceCell(p,g){const e=currentEntry(p,g),at=e.cells.indexOf(g.selected);const next=e.cells.slice(at+1).find(i=>!g.revealed.includes(i));if(next!==undefined)g.selected=next;else moveEntry(p,g);}
export function validMidiState(state,legacy=false){
 const catalogue=legacy?LEGACY_MIDIS:ALL_MIDIS;
 if(!state||state.version!==(legacy?1:2)||!Number.isInteger(state.index)||!catalogue[state.index]||!state.games||typeof state.games!=='object'||Array.isArray(state.games))return false;
 return Object.entries(state.games).every(([id,g])=>{
 const p=catalogue.find(p=>p.id===id);if(!p||!g||!Array.isArray(g.letters)||g.letters.length!==p.solution.length||!g.letters.every((l,i)=>typeof l==='string'&&/^[A-Z]?$/.test(l)&&(p.solution[i]!=='#'||l===''))||!Number.isInteger(g.selected)||!p.solution[g.selected]||p.solution[g.selected]==='#'||!['across','down'].includes(g.direction)||!Number.isFinite(g.seconds)||g.seconds<0||typeof g.completed!=='boolean'||typeof g.assisted!=='boolean'||!Number.isInteger(g.checks)||g.checks<0)return false;
 for(const key of ['pencil','revealed','wrong'])if(!Array.isArray(g[key])||new Set(g[key]).size!==g[key].length||!g[key].every(i=>Number.isInteger(i)&&i>=0&&i<p.solution.length&&p.solution[i]!=='#'))return false;
 return g.revealed.every(i=>g.letters[i]===p.solution[i])&&g.completed===solved(p,g);
 });
}

export function migrateMidiState(legacy){
 if(!validMidiState(legacy,true))return null;
 return{version:2,index:0,games:structuredClone(legacy.games)};
}
