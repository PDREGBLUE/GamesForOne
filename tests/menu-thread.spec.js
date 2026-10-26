import { test, expect } from '@playwright/test';
import { PUZZLES } from '../thread-engine.js';
import { ANSWERS } from '../engine.js';
async function select(page, words) {
  for (const word of words) await page.getByRole('button', {name:word,exact:true}).click();
  await page.locator('#thread-submit').click();
}
async function fit(page) {
  expect(await page.evaluate(() => ({x:document.documentElement.scrollWidth <= innerWidth, y:document.documentElement.scrollHeight <= innerHeight + 1}))).toEqual({x:true,y:true});
}
test('menu navigation preserves drafts and does not type into hidden game', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('#home-screen')).toBeVisible();
  await page.getByRole('link', {name:/Five Letters One word/}).click();
  await expect(page.locator('#collection-button')).toBeEnabled();
  await page.keyboard.type('CR');
  await page.getByRole('link', {name:'← Games'}).first().click();
  await page.keyboard.type('ANE');
  await page.getByRole('link', {name:/Common Thread Sixteen/}).click();
  await page.getByRole('link', {name:'← Games'}).last().click();
  await page.getByRole('link', {name:/Five Letters One word/}).click();
  await expect(page.locator('.board-row').first()).toHaveText('CR');
});
test('Five Letters migrates old wins and tracks consecutive wins without counting revisits', async ({page}) => {
  await page.addInitScript(({answers}) => {
    const key='games-for-one.five-letters.v1';
    if (!localStorage.getItem(key)) localStorage.setItem(key,JSON.stringify({version:1,index:0,order:['APPLE','BEACH',...answers.filter(w=>!['APPLE','BEACH'].includes(w))],games:{CRANE:{guesses:['CRANE'],draft:''}}}));
  },{answers:ANSWERS});
  await page.goto('/#five-letters');
  await expect(page.locator('#five-stats')).toHaveText('1 wins · 0 current streak · 0 best streak');
  await page.keyboard.type('APPLE');await page.keyboard.press('Enter');
  await expect(page.locator('#five-stats')).toHaveText('2 wins · 1 current streak · 1 best streak');
  await page.reload();
  await expect(page.locator('#five-stats')).toContainText('2 wins · 1 current streak');
  await page.locator('#next-button').click();
  await page.locator('h1').filter({hasText:'Five Letters'}).click();
  for(const word of ['CRANE','DRIFT','FLUTE','GRASS','HONEY','APPLE']) {await page.keyboard.type(word);await page.keyboard.press('Enter');}
  await expect(page.locator('#five-stats')).toHaveText('2 wins · 0 current streak · 1 best streak');
});
test('Common Thread selection, one away, shuffle, reload, win and stats', async ({page}) => {
  await page.goto('/#common-thread');
  await expect(page.locator('#thread-submit')).toBeDisabled();
  await select(page,['ROOT','TRUNK','BRANCH','PIANO']);
  await expect(page.locator('#thread-message')).toContainText('One away');
  await expect(page.locator('#thread-lives')).toContainText('Mistakes left: 3');
  await select(page,['PIANO','BRANCH','TRUNK','ROOT']);
  await expect(page.locator('#thread-message')).toContainText('already tried');
  await expect(page.locator('#thread-lives')).toContainText('Mistakes left: 3');
  await page.locator('#thread-clear').click();
  await page.getByRole('button',{name:'LEAF',exact:true}).click();
  await page.locator('#thread-shuffle').click();
  await page.reload();
  await expect(page.getByRole('button',{name:'LEAF',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.locator('#thread-clear').click();
  for(const group of PUZZLES[0].groups) await select(page,group.words);
  await expect(page.locator('#thread-result-title')).toHaveText('All connected.');
  await expect(page.locator('#thread-stats')).toHaveText('1 wins · 1 current streak · 1 best streak');
  await page.reload();
  await expect(page.locator('#thread-stats')).toHaveText('1 wins · 1 current streak · 1 best streak');
  await page.locator('#thread-next').click();
  await expect(page.locator('#thread-puzzle-label')).toHaveText('Puzzle 002');
});
test('Common Thread loss reveals answers, resets streak, persists and supports switching', async ({page}) => {
  await page.goto('/#common-thread');
  for(const group of PUZZLES[0].groups) await select(page,group.words);
  await page.locator('#thread-next').click();
  for(let i=0;i<4;i++) await select(page,PUZZLES[1].groups.map(g=>g.words[i]));
  await expect(page.locator('#thread-result-title')).toHaveText('Threads revealed.');
  await expect(page.locator('.solved-group')).toHaveCount(4);
  await expect(page.locator('#thread-stats')).toHaveText('1 wins · 0 current streak · 1 best streak');
  await page.reload();
  await expect(page.locator('#thread-result-title')).toHaveText('Threads revealed.');
  await page.locator('#thread-collection-button').click();
  await page.getByRole('button',{name:'Common Thread puzzle 1, won',exact:true}).click();
  await expect(page.locator('#thread-stats')).toHaveText('1 wins · 0 current streak · 1 best streak');
});
test('all screens fit short phones, Safari-sized viewports, tablets, desktop and landscape', async ({page}) => {
  for(const size of [{width:320,height:568},{width:375,height:550},{width:390,height:664},{width:390,height:844},{width:768,height:1024},{width:1440,height:900},{width:844,height:390}]) {
    await page.setViewportSize(size);
    for(const route of ['home','five-letters','common-thread']) {
      await page.goto('/#'+route);
      await expect(page.locator('#collection-button')).toBeEnabled();
      await fit(page);
      if(route==='five-letters') {
        await expect(page.locator('[data-key="Enter"]')).toBeInViewport({ratio:1});
        await expect(page.locator('.board-row').last()).toBeInViewport({ratio:1});
      }
      if(route==='common-thread') await expect(page.locator('#thread-submit')).toBeInViewport({ratio:1});
    }
  }
});
test('finished game and error messages still fit on a short phone', async ({page}) => {
  await page.setViewportSize({width:320,height:568});
  await page.goto('/#five-letters');
  await expect(page.locator('#collection-button')).toBeEnabled();
  for(const word of ['CRANE','DRIFT','FLUTE','GRASS','HONEY','APPLE']) {await page.keyboard.type(word);await page.keyboard.press('Enter');}
  await expect(page.locator('#result')).toBeVisible();
  await fit(page);
  await expect(page.locator('#next-button')).toBeInViewport({ratio:1});
  await page.goto('/#common-thread');
  for(let i=0;i<4;i++) await select(page,PUZZLES[0].groups.map(g=>g.words[i]));
  await fit(page);
  await expect(page.locator('#thread-next')).toBeInViewport({ratio:1});
});
test('Common Thread and menu load offline and save a correct group', async ({page,context}) => {
  await page.goto('/');
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('link',{name:/Common Thread Sixteen/}).click();
  await select(page,PUZZLES[0].groups[0].words);
  await page.reload();
  await expect(page.locator('.solved-group')).toHaveCount(1);
});
