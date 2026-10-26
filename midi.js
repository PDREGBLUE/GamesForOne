import{MIDIS,LEGACY_MIDIS,ALL_MIDIS,migrateMidiState,freshMidi,currentEntry,solved,writeCell,checkCells,revealCells,moveEntry,advanceCell,validMidiState}from'./midi-engine.js';
const $=id=>document.getElementById(id),KEY='games-for-one.midi.v2';
let state={version:2,index:0,games:{}},pencil=false,autoCheck=false,paused=false,lastTick=performance.now();
try{const raw=localStorage.getItem(KEY);if(raw){const s=JSON.parse(raw);if(validMidiState(s))state=s;}else{const old=localStorage.getItem('games-for-one.midi.v1');if(old){const migrated=migrateMidiState(JSON.parse(old));if(migrated)state=migrated;}}}catch{}
const puzzle=()=>ALL_MIDIS[state.index];const game=()=>state.games[puzzle().id]||=(freshMidi(puzzle()));
const allCells=()=>[...puzzle().solution].flatMap((l,i)=>l==='#'?[]:[i]);
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('midi-save').textContent='Saved on this device';}catch{$('midi-save').textContent='Progress won’t be saved';}}
function message(text){$('midi-message').textContent=text;}
function time(){const seconds=Math.floor(game().seconds);return`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
function render(){const p=puzzle(),g=game(),entry=currentEntry(p,g);
 $('midi-puzzle-label').textContent=`${p.size===7?'Earlier ':''}Puzzle ${String((state.index%MIDIS.length)+1).padStart(3,'0')}`;
 const wins=ALL_MIDIS.filter(p=>state.games[p.id]?.completed).length;
 $('midi-stats').textContent=`${wins} completed · ${g.assisted?'Assisted solve':'Unassisted'}${g.completed?' · Finished':''}`;
 $('midi-timer').textContent=time();$('midi-pause').textContent=paused?'Resume':'Pause';$('midi-pause').disabled=g.completed;
 $('midi-grid').style.setProperty('--grid-size',p.size);$('midi-grid').setAttribute('aria-label',`Crossword grid, ${p.size} rows and columns`);
 $('midi-grid').replaceChildren();const numbers=new Map(p.entries.map(e=>[e.cells[0],e.number]));
 for(let i=0;i<p.solution.length;i++){if(p.solution[i]==='#'){const block=document.createElement('span');block.className='cross-block';block.setAttribute('aria-hidden','true');$('midi-grid').append(block);continue;}
  const button=document.createElement('button');button.type='button';button.dataset.cell=i;
  button.className=`cross-cell ${entry.cells.includes(i)?'entry-selected':''} ${g.selected===i?'cell-selected':''} ${g.pencil.includes(i)?'pencil-cell':''} ${g.wrong.includes(i)?'wrong-cell':''} ${g.revealed.includes(i)?'revealed-cell':''}`;
  button.setAttribute('aria-label',`${numbers.has(i)?numbers.get(i)+', ':''}row ${Math.floor(i/p.size)+1}, column ${i%p.size+1}, ${g.letters[i]||'empty'}${g.wrong.includes(i)?', incorrect':''}${g.revealed.includes(i)?', revealed':''}`);
  button.setAttribute('aria-selected',String(g.selected===i));button.tabIndex=g.selected===i?0:-1;
  if(numbers.has(i)){const n=document.createElement('small');n.textContent=numbers.get(i);button.append(n);}
  const letter=document.createElement('span');letter.textContent=g.letters[i];button.append(letter);
  if(g.revealed.includes(i)){const mark=document.createElement('i');mark.textContent='•';mark.setAttribute('aria-hidden','true');button.append(mark);}
  button.addEventListener('click',()=>{if(paused)return;if(g.selected===i)g.direction=g.direction==='across'?'down':'across';g.selected=i;save();render();});$('midi-grid').append(button);
 }
 $('midi-clue').textContent=`${entry.number} ${entry.direction==='across'?'Across':'Down'} · ${entry.clue} (${entry.cells.length})`;
 $('midi-clue').setAttribute('aria-label',`Switch direction. ${$('midi-clue').textContent}`);
 $('midi-grid').hidden=paused;$('midi-paused').hidden=!paused;$('midi-clue').hidden=paused;
 $('midi-result').hidden=!g.completed;$('midi-result-detail').textContent=`${time()} · ${g.assisted?'Completed with assistance':'Solved without assistance'}`;
 $('midi-keyboard').hidden=g.completed||paused;$('midi-tools').hidden=paused||g.completed;
 $('midi-pencil').setAttribute('aria-pressed',String(pencil));$('midi-pencil').textContent=pencil?'Pencil on':'Pencil';
 $('midi-autocheck').checked=autoCheck;
}
function handleKey(key){if($('midi-screen').hidden||paused||document.querySelector('dialog[open]')||game().completed)return;const p=puzzle(),g=game();
 if(/^[A-Z]$/.test(key)){if(writeCell(p,g,key,pencil)){if(autoCheck){checkCells(p,g,[g.selected]);}if(!g.completed)advanceCell(p,g);}}
 else if(key==='Backspace'){if(!g.letters[g.selected]){const e=currentEntry(p,g),at=e.cells.indexOf(g.selected);if(at>0)g.selected=e.cells[at-1];}writeCell(p,g,'');}
 else if(key==='Delete'){writeCell(p,g,'');}
 else if(key==='Enter'||key===' '){g.direction=g.direction==='across'?'down':'across';}
 else if(key==='Tab'||key==='ShiftTab'){moveEntry(p,g,key==='Tab'?1:-1);}
 else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key)){const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-p.size,ArrowDown:p.size}[key];g.direction=Math.abs(step)===1?'across':'down';let next=g.selected+step;while(next>=0&&next<p.solution.length&&(Math.abs(step)===p.size||Math.floor(next/p.size)===Math.floor(g.selected/p.size))){if(p.solution[next]!=='#'){g.selected=next;break;}next+=step;}}
 else return;
 save();render();message(g.completed?'Puzzle complete. Nicely done!':'');
}
for(const row of ['Q W E R T Y U I O P','A S D F G H J K L','Backspace Z X C V B N M Enter']){const line=document.createElement('div');line.className='keyboard-row';for(const key of row.split(' ')){const b=document.createElement('button');b.className=`key ${key.length>1?'wide':''}`;b.dataset.midiKey=key;b.textContent=key==='Backspace'?'⌫':key==='Enter'?'↔':key;b.setAttribute('aria-label',key==='Enter'?'Switch Across or Down':key==='Backspace'?'Delete letter':key);b.addEventListener('click',()=>handleKey(key));line.append(b);}$('midi-keyboard').append(line);}
document.addEventListener('keydown',event=>{if($('midi-screen').hidden||event.ctrlKey||event.metaKey||event.altKey||document.querySelector('dialog[open]')||event.target.matches('input,select'))return;
 if(event.key==='Tab'&&!event.target.closest('#midi-grid'))return;
 if(['Enter',' '].includes(event.key)&&event.target.closest('button,a')&&!event.target.closest('#midi-grid'))return;
 if(/^[a-z]$/i.test(event.key)||['Backspace','Delete','Enter',' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(event.key)){const gridFocused=!!event.target.closest('#midi-grid');event.preventDefault();handleKey(event.key==='Tab'&&event.shiftKey?'ShiftTab':event.key.length===1?event.key.toUpperCase():event.key);if(gridFocused)$('midi-grid').querySelector(`[data-cell="${game().selected}"]`)?.focus({preventScroll:true});}
});
$('midi-clue').addEventListener('click',()=>{game().direction=game().direction==='across'?'down':'across';save();render();});
for(const [id,delta]of[['midi-previous',-1],['midi-forward',1]])$(id).addEventListener('click',()=>{moveEntry(puzzle(),game(),delta);save();render();});
$('midi-pencil').addEventListener('click',()=>{pencil=!pencil;render();});
$('midi-pause').addEventListener('click',()=>{paused=!paused;lastTick=performance.now();render();});
$('midi-autocheck').addEventListener('change',event=>{autoCheck=event.target.checked;message(autoCheck?'Auto-check on. Incorrect entries will be marked.':'Auto-check off.');});
function cellsFor(scope){return scope==='tile'?[game().selected]:scope==='word'?currentEntry(puzzle(),game()).cells:allCells();}
$('midi-check').addEventListener('click',()=>$('midi-check-dialog').showModal());
$('midi-reveal').addEventListener('click',()=>$('midi-reveal-dialog').showModal());
document.querySelectorAll('[data-check]').forEach(b=>b.addEventListener('click',()=>{const count=checkCells(puzzle(),game(),cellsFor(b.dataset.check));save();render();$('midi-check-dialog').close();message(count?`${count} incorrect ${count===1?'tile':'tiles'} marked in red with a slash.`:'No incorrect filled tiles in that selection.');}));
function reveal(scope){revealCells(puzzle(),game(),cellsFor(scope));save();render();message(game().completed?'Puzzle completed with assistance. Revealed tiles are marked.':'Revealed letters are marked with a blue dot.');}
document.querySelectorAll('[data-reveal]').forEach(b=>b.addEventListener('click',()=>{$('midi-reveal-dialog').close();if(b.dataset.reveal==='puzzle')$('midi-confirm-dialog').showModal();else reveal(b.dataset.reveal);}));
$('midi-confirm-reveal').addEventListener('click',()=>{$('midi-confirm-dialog').close();reveal('puzzle');});
$('midi-clues-button').addEventListener('click',()=>{for(const direction of ['across','down']){const list=$('midi-'+direction);list.replaceChildren();for(const entry of puzzle().entries.filter(e=>e.direction===direction)){const b=document.createElement('button');b.className='clue-option';b.textContent=`${entry.number}. ${entry.clue} (${entry.cells.length})`;b.addEventListener('click',()=>{game().selected=entry.cells[0];game().direction=direction;save();render();$('midi-clues-dialog').close();});list.append(b);}}$('midi-clues-dialog').showModal();});
function collection(){
 $('midi-edition').value=state.index>=MIDIS.length?'legacy':'new';
 $('midi-edition').onchange=()=>{populatePacks(0);drawCollection();};
 populatePacks(Math.floor((state.index%MIDIS.length)/12));drawCollection();$('midi-collection-dialog').showModal();
}
function populatePacks(selected){const pack=$('midi-pack');pack.replaceChildren();const count=$('midi-edition').value==='legacy'?LEGACY_MIDIS.length:MIDIS.length;for(let i=0;i<Math.ceil(count/12);i++)pack.add(new Option(`Pack ${i+1} · puzzles ${i*12+1}–${Math.min((i+1)*12,count)}`,String(i)));pack.value=String(selected);pack.onchange=drawCollection;}
function drawCollection(){const offset=$('midi-edition').value==='legacy'?MIDIS.length:0,first=Number($('midi-pack').value)*12;
 $('midi-puzzle-list').replaceChildren();ALL_MIDIS.slice(offset+first,offset+first+12).forEach((p,i)=>{const b=document.createElement('button');b.className=`puzzle-choice ${state.games[p.id]?.completed?'won':''}`;b.textContent=`${first+i+1}${state.games[p.id]?.completed?' ✓':''}`;b.setAttribute('aria-label',`${offset?'Earlier ':''}Midi puzzle ${first+i+1}`);b.addEventListener('click',()=>{state.index=offset+first+i;paused=false;game();save();render();$('midi-collection-dialog').close();message('A fresh crossword. Enjoy.');});$('midi-puzzle-list').append(b);});}
$('midi-collection-button').addEventListener('click',collection);
$('midi-next').addEventListener('click',()=>{const offset=state.index>=MIDIS.length?MIDIS.length:0,count=offset?LEGACY_MIDIS.length:MIDIS.length;for(let step=1;step<=count;step++){const index=offset+(state.index-offset+step)%count;if(!state.games[ALL_MIDIS[index].id]?.completed){state.index=index;paused=false;game();save();render();message('A new crossword is ready.');return;}}collection();});
$('midi-help').addEventListener('click',()=>$('midi-help-dialog').showModal());
setInterval(()=>{const now=performance.now(),elapsed=Math.min((now-lastTick)/1000,2);lastTick=now;if(!$('midi-screen').hidden&&!document.hidden&&!paused&&!document.querySelector('dialog[open]')&&!game().completed){game().seconds+=elapsed;$('midi-timer').textContent=time();save();}},1000);
document.addEventListener('visibilitychange',()=>{lastTick=performance.now();save();});
window.addEventListener('storage',event=>{if(event.key!==KEY||!event.newValue)return;try{const s=JSON.parse(event.newValue);if(validMidiState(s)){state=s;render();}}catch{}});
game();save();render();
