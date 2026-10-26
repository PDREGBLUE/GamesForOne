import { test, expect } from '@playwright/test';
import { ANSWERS } from '../engine.js';
const key = 'games-for-one.five-letters.v1';
async function start(page, extra = '') {
  await page.addInitScript(({ key, answers }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ version: 1, order: ['APPLE', ...answers.filter(w => w !== 'APPLE')], index: 0, games: {} }));
  }, { key, answers: ANSWERS });
  await page.goto('/' + extra + '#five-letters');
  await expect(page.locator('#collection-button')).toBeEnabled();
}
async function guess(page, word) {
  await page.keyboard.type(word);
  await page.keyboard.press('Enter');
}
test('touch keyboard, invalid guesses, duplicate scoring, reload and winning', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await start(page);
  await page.locator('[data-key="Enter"]').tap();
  await expect(page.locator('#message')).toContainText('five letters');
  await guess(page, 'XXXXX');
  await expect(page.locator('#message')).toContainText('dictionary');
  for (let i = 0; i < 5; i++) await page.locator('[data-key="Backspace"]').tap();
  for (const letter of 'ALLEY') await page.locator(`[data-key="${letter}"]`).tap();
  await page.locator('[data-key="Enter"]').tap();
  await expect(page.locator('.board-row').first().locator('.tile.correct')).toHaveCount(1);
  await expect(page.locator('.board-row').first().locator('.tile.present')).toHaveCount(2);
  await page.locator('[data-key="A"]').tap();
  await page.reload();
  await expect(page.locator('.board-row').nth(1)).toContainText('A');
  await page.keyboard.type('PPLE');
  await page.keyboard.press('Enter');
  await expect(page.locator('#result')).toBeVisible();
  await expect(page.locator('#result-detail')).toHaveText('APPLE · Solved in 2 of 6.');
  await expect(page.locator('[data-key="A"]')).toBeDisabled();
  await page.locator('#next-button').tap();
  await expect(page.locator('#puzzle-label')).toHaveText('Puzzle 002');
  expect(errors).toEqual([]);
});
test('loss ends after six guesses and collection preserves completed puzzles', async ({ page }) => {
  await start(page);
  for (const word of ['BEACH', 'CRANE', 'DRIFT', 'FLUTE', 'GRASS', 'HONEY']) await guess(page, word);
  await expect(page.locator('#result-detail')).toHaveText('The word was APPLE.');
  await page.locator('#next-button').tap();
  await page.locator('#collection-button').tap();
  await page.getByRole('button', { name: 'Puzzle 1, finished', exact: true }).tap();
  await expect(page.locator('#result-detail')).toHaveText('The word was APPLE.');
  await page.reload();
  await expect(page.locator('#result-detail')).toHaveText('The word was APPLE.');
});
test('collection switching keeps unfinished guesses; help blocks typing', async ({ page }) => {
  await start(page);
  await guess(page, 'CRANE');
  await page.keyboard.type('AP');
  await page.locator('#collection-button').tap();
  await page.getByRole('button', { name: 'Puzzle 2, not started', exact: true }).tap();
  await page.locator('#collection-button').tap();
  await page.getByRole('button', { name: 'Puzzle 1, in progress', exact: true }).tap();
  await expect(page.locator('.board-row').nth(1)).toContainText('AP');
  await page.locator('#five-help').tap();
  await page.keyboard.type('XYZ');
  await page.getByRole('button', { name: 'Close instructions' }).tap();
  await expect(page.locator('.board-row').nth(1)).toHaveText('AP');
});
test('offline reload works with all assets and the dictionary', async ({ page, context }) => {
  await start(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#collection-button')).toBeEnabled();
  await guess(page, 'APPLE');
  await expect(page.locator('#result-detail')).toHaveText('APPLE · Solved in 1 of 6.');
});
test('storage unavailable still allows play and explains limitation', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Unavailable', 'QuotaExceededError'); };
  });
  await page.goto('/#five-letters');
  await expect(page.locator('#save-status')).toHaveText('Progress won’t be saved');
  await guess(page, 'CRANE');
  await expect(page.locator('.board-row').first().locator('.tile small')).toHaveCount(5);
});
test('phone and desktop layout have no horizontal overflow', async ({ page }) => {
  await start(page);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('[data-key="Enter"]')).toBeInViewport();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/five-letters-iphone.png', fullPage: true });
});
