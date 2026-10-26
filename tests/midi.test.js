import test from 'node:test';import assert from 'node:assert/strict';
import{MIDIS,freshMidi,currentEntry,writeCell,checkCells,revealCells,moveEntry,advanceCell,validMidiState,solved}from'../midi-engine.js';
test('120 unique crosswords are connected, symmetric, fully checked and consistently clued',()=>{
 assert.equal(MIDIS.length,120);assert.equal(new Set(MIDIS.map(p=>p.solution)).size,120);assert.equal(new Set(MIDIS.map(p=>p.id)).size,120);
 for(const p of MIDIS){assert.equal(p.solution.length,49);const coverage=Array.from({length:49},()=>[]);const answers=new Set();
  for(const e of p.entries){assert.ok(e.clue.trim().length>0);assert.notEqual(e.clue.toUpperCase(),e.answer);assert.ok(e.answer.length>=3);assert.equal(e.cells.map(i=>p.solution[i]).join(''),e.answer);assert.ok(!answers.has(e.answer));answers.add(e.answer);e.cells.forEach((i,k)=>{coverage[i].push(e.direction);if(k)assert.equal(i-e.cells[k-1],e.direction==='across'?1:7);});}
  const white=[];for(let i=0;i<49;i++){assert.equal(p.solution[i]==='#',p.solution[48-i]==='#');if(p.solution[i]!=='#'){assert.deepEqual(coverage[i].sort(),['across','down']);white.push(i);}}
  const visited=new Set([white[0]]),queue=[white[0]];while(queue.length){const i=queue.shift();for(const j of white)if(!visited.has(j)&&Math.abs(i%7-j%7)+Math.abs(Math.floor(i/7)-Math.floor(j/7))===1){visited.add(j);queue.push(j);}}assert.equal(visited.size,white.length);
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
 const p=MIDIS[0],g=freshMidi(p);advanceCell(p,g);assert.equal(g.selected,1);g.selected=0;g.direction='down';advanceCell(p,g);assert.equal(g.selected,7);moveEntry(p,g);assert.equal(currentEntry(p,g).number,2);moveEntry(p,g,-1);assert.equal(currentEntry(p,g).number,1);
});
test('save validation accepts progress and rejects corrupt or falsely completed grids',()=>{
 const p=MIDIS[0],g=freshMidi(p),s={version:1,index:0,games:{[p.id]:g}};assert.equal(validMidiState(s),true);g.letters[0]='AA';assert.equal(validMidiState(s),false);g.letters[0]='';g.completed=true;assert.equal(validMidiState(s),false);g.completed=false;g.seconds=-1;assert.equal(validMidiState(s),false);
});
