import { TRAILS, freshTrail, chooseCell, submitTrail, takeHint, spell, validTrailsState } from './trails-engine.js';
const $=id=>document.getElementById(id);
const KEY='games-for-one.word-trails.v1';
let state={version:1,index:0,games:{}},dictionary,ready=false,drag=null;
const puzzle=()=>TRAILS[state.index];
const game=()=>state.games[puzzle().id] ||= freshTrail();
const done=()=>game().found.length===puzzle().words.length;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('trails-save').textContent='Saved on this device';}catch{$('trails-save').textContent='Progress won’t be saved';}}
function message(text){$('trails-message').textContent=text;}
const svgNS='http://www.w3.org/2000/svg';
function drawPath(path,type){
  const line=document.createElementNS(svgNS,'polyline');
  line.setAttribute('points',path.map(i=>`${i%6*100+50},${Math.floor(i/6)*100+50}`).join(' '));
  line.setAttribute('class',type);$('trails-lines').append(line);
}
function render(){
  const p=puzzle(),g=game();
  $('trails-clue').textContent=p.clue;
  $('trails-puzzle-label').textContent=`Puzzle ${String(state.index+1).padStart(3,'0')}`;
  const wins=TRAILS.filter(p=>state.games[p.id]?.found.length===p.words.length).length;
  $('trails-stats').textContent=`${g.found.length} of ${p.words.length} words · ${wins} puzzles solved`;
  $('trails-lines').replaceChildren();
  const used=new Map();
  for(const word of g.found){const w=p.words.find(w=>w.word===word);drawPath(w.path,w.span?'span-line':'found-line');w.path.forEach(i=>used.set(i,w.span?'span-cell':'found-cell'));}
  drawPath(g.selected,'selection-line');
  const hint=p.words.find(w=>w.word===g.hint);
  [...$('trails-cells').children].forEach((button,i)=>{
    button.textContent=p.letters[i];
    button.className=`trail-cell ${used.get(i)||''} ${g.selected.includes(i)?'selected-cell':''} ${hint?.path.includes(i)?'hint-cell':''}`;
    button.setAttribute('aria-pressed',String(g.selected.includes(i)));
    button.setAttribute('aria-label',`${p.letters[i]}, row ${Math.floor(i/6)+1}, column ${i%6+1}${used.has(i)?', found':hint?.path.includes(i)?', hint':''}`);
    button.disabled=used.has(i)||done();
  });
  $('trails-selection').textContent=g.selected.length?spell(p,g.selected):'Tap letters or trace a word';
  $('trails-submit').disabled=g.selected.length<4||done();
  $('trails-clear').disabled=!g.selected.length;
  const credits=g.bonus.length-g.hints*3;
  $('trails-hint').textContent=g.hint?'Hint highlighted':credits>=3?'Use hint':`Hint ${credits}/3`;
  $('trails-hint').disabled=credits<3||!!g.hint||done();
  $('trails-controls').hidden=done();$('trails-result').hidden=!done();
  $('trails-next').textContent=wins===TRAILS.length?'View collection →':'Next puzzle →';
  $('trails-found').textContent=g.found.length ? g.found.map(w=>(p.words.find(e=>e.word===w).span?'★ ':'✓ ')+w).join(' · ') : 'Blue: theme words · Gold ★: spanning word';
}
function inputCell(cell){if(!ready||done())return;chooseCell(puzzle(),game(),cell);save();render();}
function submit(){if(!ready||done())return;const result=submitTrail(puzzle(),game(),dictionary);save();render();message(done()?'Every letter connected. Nicely done!':result);}
for(let i=0;i<48;i++){
  const b=document.createElement('button');b.className='trail-cell';b.dataset.cell=i;b.disabled=true;
  b.addEventListener('click',event=>{if(event.detail===0)inputCell(i);});
  $('trails-cells').append(b);
}
$('trails-cells').addEventListener('pointerdown',event=>{
  const b=event.target.closest('[data-cell]');if(!ready||!b||b.disabled||event.button!==0)return;
  event.preventDefault();drag={id:event.pointerId,start:Number(b.dataset.cell),last:Number(b.dataset.cell),moved:false};
  inputCell(drag.start);$('trails-cells').setPointerCapture(event.pointerId);
});
$('trails-cells').addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const b=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-cell]');
  if(!b||b.disabled||Number(b.dataset.cell)===drag.last)return;
  drag.last=Number(b.dataset.cell);drag.moved=true;inputCell(drag.last);
});
$('trails-cells').addEventListener('pointerup',event=>{if(!drag||event.pointerId!==drag.id)return;const moved=drag.moved;drag=null;if(moved)submit();});
$('trails-cells').addEventListener('pointercancel',()=>{drag=null;});
$('trails-submit').addEventListener('click',submit);
$('trails-clear').addEventListener('click',()=>{game().selected=[];save();render();message('Path cleared.');});
$('trails-hint').addEventListener('click',()=>{if(takeHint(puzzle(),game())){save();render();message('The outlined letters form a theme word. Connect them in order.');}});
function collection(){
  $('trails-puzzle-list').replaceChildren();
  TRAILS.forEach((p,index)=>{const b=document.createElement('button');const solved=state.games[p.id]?.found.length===p.words.length;b.className=`puzzle-choice ${solved?'won':''}`;b.textContent=`${index+1} ${solved?'✓':''}`;b.setAttribute('aria-label',`Word Trails puzzle ${index+1}`);b.addEventListener('click',()=>{state.index=index;game();save();render();$('trails-collection-dialog').close();message('Follow the clue and find the theme words.');});$('trails-puzzle-list').append(b);});
  $('trails-collection-dialog').showModal();
}
$('trails-collection-button').addEventListener('click',()=>{if(ready)collection();});
$('trails-next').addEventListener('click',()=>{
  for(let offset=1;offset<=TRAILS.length;offset++){const index=(state.index+offset)%TRAILS.length,p=TRAILS[index];if(state.games[p.id]?.found.length!==p.words.length){state.index=index;game();save();render();message('A new theme to unravel.');return;}}
  collection();
});
$('trails-help').addEventListener('click',()=>$('trails-help-dialog').showModal());
async function init(){try{
  const response=await fetch('./trails-dictionary.txt');if(!response.ok)throw Error('dictionary');dictionary=new Set((await response.text()).split('\n'));
  let recovery=false;try{const raw=localStorage.getItem(KEY);if(raw){const saved=JSON.parse(raw);if(validTrailsState(saved,dictionary))state=saved;else recovery=true;}}catch{recovery=true;}
  ready=true;game();save();render();$('trails-collection-button').disabled=false;
  message(recovery?'Saved progress couldn’t be restored. A new collection is ready.':'Find words connected to the theme.');
}catch{message('Couldn’t load Word Trails. Connect and reload to try again.');}}
init();
window.addEventListener('storage',event=>{if(!ready||event.key!==KEY||!event.newValue)return;try{const s=JSON.parse(event.newValue);if(validTrailsState(s,dictionary)){state=s;render();message('Progress updated from another window.');}}catch{}});
