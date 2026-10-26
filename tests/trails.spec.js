import {test,expect} from '@playwright/test';
import {TRAILS} from '../trails-engine.js';
import {PUZZLES,allWords} from '../thread-engine.js';
async function start(page){await page.goto('/#word-trails');await expect(page.locator('#trails-collection-button')).toBeEnabled();}
async function word(page,path){for(const i of path)await page.locator(`[data-cell="${i}"]`).tap();await page.locator('#trails-submit').tap();}
test('Word Trails tap entry, coloured spanning path, reload, win and next puzzle',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
 const p=TRAILS[0],sp=p.words.find(w=>w.span);await word(page,sp.path);
 await expect(page.locator('.span-cell')).toHaveCount(sp.path.length);await expect(page.locator('#trails-message')).toContainText('Spanning word');
 await page.reload();await expect(page.locator('.span-cell')).toHaveCount(sp.path.length);
 for(const w of p.words.filter(w=>!w.span))await word(page,w.path);
 await expect(page.locator('#trails-result')).toBeVisible();await expect(page.locator('#trails-stats')).toContainText('1 puzzles solved');
 await page.locator('#trails-next').tap();await expect(page.locator('#trails-puzzle-label')).toHaveText('Puzzle 002');expect(errors).toEqual([]);
});
test('drag traces a word and submits on release',async({page})=>{
 await start(page);const w=TRAILS[0].words.find(w=>!w.span);
 for(let k=0;k<w.path.length;k++){const box=await page.locator(`[data-cell="${w.path[k]}"]`).boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);if(k===0)await page.mouse.down();}
 await page.mouse.up();await expect(page.locator('#trails-message')).toContainText(w.word);await expect(page.locator('.found-cell')).toHaveCount(w.path.length);
});
test('Word Trails runs offline and restores selected letters',async({page,context})=>{
 await start(page);await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
 await context.setOffline(true);await page.reload();await expect(page.locator('#trails-collection-button')).toBeEnabled();
 const w=TRAILS[0].words[0];await page.locator(`[data-cell="${w.path[0]}"]`).tap();await page.reload();await expect(page.locator('#trails-selection')).toHaveText(w.word[0]);
});
test('dark menu and all four screens fit phone and landscape viewports',async({page})=>{
 for(const size of [{width:320,height:568},{width:375,height:550},{width:390,height:664},{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
  await page.setViewportSize(size);
  for(const route of ['home','five-letters','common-thread','word-trails']){await page.goto('/#'+route);await expect(page.locator('#trails-collection-button')).toBeEnabled();expect(await page.evaluate(()=>({x:document.documentElement.scrollWidth<=innerWidth,y:document.documentElement.scrollHeight<=innerHeight+1,dark:getComputedStyle(document.documentElement).colorScheme}))).toEqual({x:true,y:true,dark:'dark'});}
 }
});
test('Common Thread automatically adds a new pack offline and preserves it on reload',async({page,context})=>{
 const first=PUZZLES.slice(0,120);await page.addInitScript(puzzles=>{const key='games-for-one.common-thread.v1';if(localStorage.getItem(key))return;const games={};for(const p of puzzles)games[p.id]={attempts:p.groups.map(g=>g.words),order:p.groups.flatMap(g=>g.words),selected:[]};localStorage.setItem(key,JSON.stringify({version:1,index:119,puzzleCount:120,games,results:puzzles.map(p=>p.id)}));},first);
 await page.goto('/#common-thread');await expect(page.locator('#thread-next')).toHaveText('Next pack →');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});await context.setOffline(true);
 await page.locator('#thread-next').click();await expect(page.locator('#thread-puzzle-label')).toHaveText('Puzzle 121');await expect(page.locator('#thread-message')).toContainText('new pack of 12');
 await page.reload();await expect(page.locator('#thread-puzzle-label')).toHaveText('Puzzle 121');await expect(page.locator('#thread-stats')).toContainText('120 wins');await page.locator('#thread-collection-button').click();await expect(page.locator('#thread-summary')).toContainText('of 132');
});
test('old twelve-puzzle save retains wins and automatically continues to puzzle thirteen',async({page})=>{
 await page.addInitScript(puzzles=>{const games={};for(const p of puzzles)games[p.id]={attempts:p.groups.map(g=>g.words),order:p.groups.flatMap(g=>g.words),selected:[]};localStorage.setItem('games-for-one.common-thread.v1',JSON.stringify({version:1,index:11,games,results:puzzles.map(p=>p.id)}));},PUZZLES.slice(0,12));
 await page.goto('/#common-thread');await expect(page.locator('#thread-stats')).toHaveText('12 wins · 12 current streak · 12 best streak');await page.locator('#thread-next').click();await expect(page.locator('#thread-puzzle-label')).toHaveText('Puzzle 013');
});
test('Word Trails keyboard selection, help and hint controls',async({page})=>{
 await start(page);const word=TRAILS[0].words[0];
 await page.locator(`[data-cell="${word.path[0]}"]`).focus();await page.keyboard.press('Enter');await expect(page.locator('#trails-selection')).toHaveText(word.word[0]);
 await page.locator('#trails-clear').click();await expect(page.locator('#trails-hint')).toBeDisabled();
 await page.locator('#trails-help').click();await expect(page.locator('#trails-help-dialog')).toBeVisible();await page.getByRole('button',{name:'Close Word Trails instructions'}).click();await expect(page.locator('#trails-help-dialog')).not.toBeVisible();
});
