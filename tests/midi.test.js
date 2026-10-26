import test from 'node:test';import assert from 'node:assert/strict';
import{MIDIS,LEGACY_MIDIS,migrateMidiState,freshMidi,currentEntry,writeCell,checkCells,revealCells,moveEntry,advanceCell,validMidiState,solved}from'../midi-engine.js';
test('120 unique crosswords are connected, symmetric, fully checked and consistently clued',()=>{
 assert.equal(MIDIS.length,120);assert.equal(new Set(MIDIS.map(p=>p.solution)).size,120);assert.equal(new Set(MIDIS.map(p=>p.id)).size,120);
 for(const p of MIDIS){assert.equal(p.solution.length,64);const coverage=Array.from({length:64},()=>[]);const answers=new Set();
  for(const e of p.entries){assert.ok(e.clue.trim().length>0);assert.notEqual(e.clue.toUpperCase(),e.answer);assert.ok(e.answer.length>=3);assert.equal(e.cells.map(i=>p.solution[i]).join(''),e.answer);assert.ok(!answers.has(e.answer));answers.add(e.answer);e.cells.forEach((i,k)=>{coverage[i].push(e.direction);if(k)assert.equal(i-e.cells[k-1],e.direction==='across'?1:p.size);});}
  const white=[];for(let i=0;i<64;i++){assert.equal(p.solution[i]==='#',p.solution[63-i]==='#');if(p.solution[i]!=='#'){assert.deepEqual(coverage[i].sort(),['across','down']);white.push(i);}}
  const visited=new Set([white[0]]),queue=[white[0]];while(queue.length){const i=queue.shift();for(const j of white)if(!visited.has(j)&&Math.abs(i%p.size-j%p.size)+Math.abs(Math.floor(i/p.size)-Math.floor(j/p.size))===1){visited.add(j);queue.push(j);}}assert.equal(visited.size,white.length);
 }
});
test('check highlights wrong filled tiles without marking blanks, then clears after correction',()=>{
 const p=MIDIS[0],g=freshMidi(p);writeCell(p,g,'Z');assert.equal(checkCells(p,g,p.entries[0].cells),1);assert.deepEqual(g.wrong,[0]);assert.equal(g.assisted,true);writeCell(p,g,p.solution[0]);assert.deepEqual(g.wrong,[]);assert.equal(checkCells(p,g,p.entries[0].cells),0);
});
test('reveal tile, word and whole puzzle have exact scopes and preserve crossing letters',()=>{
 const p=MIDIS[0],g=freshMidi(p);revealCells(p,g,[0]);assert.equal(g.letters.filter(Boolean).length,1);assert.equal(g.letters[0],p.solution[0]);assert.ok(g.revealed.includes(0));assert.equal(writeCell(p,g,'X'),false);
 const e=currentEntry(p,g);revealCells(p,g,e.cells);assert.equal(e.cells.map(i=>g.letters[i]).join(''),e.answer);assert.equal(g.letters.filter(Boolean).length,e.cells.length);
 revealCells(p,g,[...p.solution].flatMap((c,i)=>c==='#'?[]:[i]));assert.ok(solved(p,g));assert.equal(g.completed,true);assert.equal(g.assisted,true);
});
test('crossword navigation follows the selected entry and wraps between clues',()=>{
 const p=MIDIS[0],g=freshMidi(p);advanceCell(p,g);assert.equal(g.selected,1);g.selected=0;g.direction='down';advanceCell(p,g);assert.equal(g.selected,p.size);moveEntry(p,g);assert.equal(currentEntry(p,g).number,2);moveEntry(p,g,-1);assert.equal(currentEntry(p,g).number,1);
});
test('save validation accepts progress and rejects corrupt or falsely completed grids',()=>{
 const p=MIDIS[0],g=freshMidi(p),s={version:2,index:0,games:{[p.id]:g}};assert.equal(validMidiState(s),true);g.letters[0]='AA';assert.equal(validMidiState(s),false);g.letters[0]='';g.completed=true;assert.equal(validMidiState(s),false);g.completed=false;g.seconds=-1;assert.equal(validMidiState(s),false);
});

test('collection has varied layouts, word lengths and no repeats within three puzzles',()=>{
 const patterns=new Set(),profiles=new Set(),usage=new Map();
 for(let i=0;i<MIDIS.length;i++){
  const p=MIDIS[i];assert.equal(p.size,8);const mask=p.solution.replace(/[A-Z]/g,'.');patterns.add(mask);
  const lengths=p.entries.map(e=>e.answer.length);assert.ok(new Set(lengths).size>=3);profiles.add([...lengths].sort().join(','));
  if(i){assert.notEqual(mask,MIDIS[i-1].solution.replace(/[A-Z]/g,'.'));assert.notDeepEqual([...lengths].sort(),MIDIS[i-1].entries.map(e=>e.answer.length).sort());}
  const previous=MIDIS.slice(Math.max(0,i-3),i).flatMap(p=>p.entries);
  for(const e of p.entries){assert.ok(!previous.some(v=>v.answer===e.answer),`Repeated nearby answer: ${e.answer}`);assert.ok(!previous.some(v=>v.clue===e.clue),`Repeated nearby clue: ${e.clue}`);usage.set(e.answer,(usage.get(e.answer)||0)+1);}
 }
 assert.ok(patterns.size>=24);assert.ok(profiles.size>=5);assert.ok(usage.size>=900);assert.ok(Math.max(...usage.values())<=6);
});
test('legacy migration keeps every saved letter and completion under its old puzzle ID',()=>{
 const p=LEGACY_MIDIS[0],g=freshMidi(p);g.letters[0]=p.solution[0];g.seconds=42;g.pencil=[0];
 const old={version:1,index:0,games:{[p.id]:g}};const next=migrateMidiState(old);
 assert.equal(next.version,2);assert.equal(next.index,0);assert.deepEqual(next.games[p.id],g);assert.ok(validMidiState(next));assert.ok(validMidiState(old,true));
 next.games[p.id].letters[0]='Z';assert.equal(old.games[p.id].letters[0],p.solution[0]);
});
