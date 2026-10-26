import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TRAILS,validPath,spell,freshTrail,chooseCell,submitTrail,takeHint,validTrailsState} from '../trails-engine.js';
import {PUZZLES,ensurePuzzleCount,allWords} from '../thread-engine.js';
const dictionary=new Set(readFileSync(new URL('../trails-dictionary.txt',import.meta.url),'utf8').split('\n'));
test('every themed board covers all 48 cells with adjacent words and an opposite-edge spanning word',()=>{
 assert.equal(TRAILS.length,8);
 for(const p of TRAILS){
  const cells=p.words.flatMap(w=>w.path);assert.equal(cells.length,48);assert.equal(new Set(cells).size,48);
  assert.equal(p.words.filter(w=>w.span).length,1);
  for(const w of p.words){assert.ok(validPath(w.path));assert.equal(spell(p,w.path),w.word);}
  const span=p.words.find(w=>w.span).path;
  assert.ok((span.some(i=>i%6===0)&&span.some(i=>i%6===5))||(span.some(i=>i<6)&&span.some(i=>i>=42)));
 }
});
test('selection rejects jumps and used cells, backtracks and solves every theme',()=>{
 assert.equal(validPath([0,1,0]),false);assert.equal(validPath([5,6]),false);assert.equal(validPath([0,7]),true);
 for(const p of TRAILS){const g=freshTrail();chooseCell(p,g,0);assert.equal(chooseCell(p,g,47),false);g.selected=[];
  for(const w of p.words){g.selected=[...w.path];assert.match(submitTrail(p,g,dictionary),/found:/);assert.equal(chooseCell(p,g,w.path[0]),false);}
  assert.equal(g.found.length,p.words.length);
 }
});
test('bonus words are unique and three unlock a persistent hint',()=>{
 const p=TRAILS[0],g=freshTrail();
 // Find real dictionary words on the actual board rather than inventing hint credit.
 const prefixes=new Set();for(const w of dictionary)if(w.length<=7)for(let i=1;i<=w.length;i++)prefixes.add(w.slice(0,i));
 const found=new Map();
 function visit(path){const word=spell(p,path);if(!prefixes.has(word)||path.length>7)return;if(word.length>=4&&dictionary.has(word)&&!p.words.some(w=>w.word===word))found.set(word,path);if(found.size>=3)return;const last=path.at(-1);for(let i=0;i<48;i++)if(!path.includes(i)&&Math.abs(i%6-last%6)<=1&&Math.abs(Math.floor(i/6)-Math.floor(last/6))<=1)visit([...path,i]);}
 for(let i=0;i<48&&found.size<3;i++)visit([i]);assert.ok(found.size>=3);
 for(const path of [...found.values()].slice(0,3)){g.selected=path;assert.match(submitTrail(p,g,dictionary),/bonus word/);}
 g.selected=[...found.values()][0];assert.match(submitTrail(p,g,dictionary),/already used/);assert.equal(g.bonus.length,3);
 assert.equal(takeHint(p,g),true);assert.equal(takeHint(p,g),false);g.selected=[];
 assert.equal(validTrailsState({version:1,index:0,games:{[p.id]:g}},dictionary),true);
 const hinted=p.words.find(w=>w.word===g.hint);g.selected=hinted.path;submitTrail(p,g,dictionary);assert.equal(g.hint,null);
});
test('saved trail state rejects corrupt paths, words and unearned hints',()=>{
 const p=TRAILS[0],g=freshTrail(),s={version:1,index:0,games:{[p.id]:g}};
 assert.equal(validTrailsState(s,dictionary),true);g.selected=[0,47];assert.equal(validTrailsState(s,dictionary),false);
 g.selected=[];g.hints=1;assert.equal(validTrailsState(s,dictionary),false);
});
test('automatic packs keep difficulty, disjoint words and unique combinations',()=>{
 assert.ok(ensurePuzzleCount(144));const signatures=new Set();
 for(const p of PUZZLES){assert.equal(new Set(allWords(p)).size,16);const key=p.groups.map(g=>g.name).join('|');assert.ok(!signatures.has(key));signatures.add(key);}
 assert.ok(PUZZLES[120].id.startsWith('mix-'));assert.equal(ensurePuzzleCount(-1),false);
});
test('theme words have a single valid path, including diagonal alternatives',()=>{
 for(const p of TRAILS)for(const target of p.words){let count=0;
  function visit(path){const k=path.length;if(k===target.word.length){count++;return;}if(count>1)return;const last=path.at(-1);for(let i=0;i<48;i++)if(!path.includes(i)&&p.letters[i]===target.word[k]&&Math.abs(i%6-last%6)<=1&&Math.abs(Math.floor(i/6)-Math.floor(last/6))<=1)visit([...path,i]);}
  for(let i=0;i<48;i++)if(p.letters[i]===target.word[0])visit([i]);assert.equal(count,1,`${p.id}: ${target.word}`);
 }
});
