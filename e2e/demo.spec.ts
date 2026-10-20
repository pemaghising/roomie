import { expect, test } from '@playwright/test';

/** The demo flat needs no account or backend: a usability tester can do all four test-plan tasks. */
test('demo flat: claim, complete, answer a swap, approve the plan — no account needed', async ({ page }) => {
  await page.goto('/welcome');
  await page.getByRole('link', { name: 'Explore a demo flat' }).click();

  await expect(page.getByRole('heading', { name: 'Hello, Rahul.' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Demo mode' })).toBeVisible();
  await page.screenshot({ path: 'test-results/demo-1-home.png' });

  // 1. Claim the chore Aman missed
  await page.getByRole('link', { name: /up for grabs/ }).click();
  await expect(page).toHaveURL(/\/chores/);
  await page.screenshot({ path: 'test-results/demo-2-chores.png' });
  await page.getByRole('button', { name: /^Claim/ }).first().click();
  await expect(page.getByText("It's yours — thanks for covering.")).toBeVisible();

  // 2. Finish a chore of my own
  await page.getByRole('button', { name: /^Mark .* done$/ }).first().click();
  await expect(page.getByText(/Nice one|Wonderful|covered/i).first()).toBeVisible();
  await page.screenshot({ path: 'test-results/demo-3-done.png' });

  // 3 & 4. Answer Aman's swap and approve next week's plan
  await page.goto('/plan');
  await page.getByRole('tab', { name: 'Next week' }).click();
  await page.getByRole('button', { name: 'Accept' }).click();
  await expect(page.getByText("Swapped — it's on your list.")).toBeVisible();
  await page.getByRole('button', { name: 'Looks good' }).click();
  await expect(page.getByRole('button', { name: 'Looks good' })).toBeHidden();
  await page.screenshot({ path: 'test-results/demo-4-plan.png', fullPage: true });

  // Reset gives a fresh flat; Exit leaves demo mode
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.getByText('Aman wants to trade')).toBeVisible();
  await page.getByRole('button', { name: 'Exit' }).click();
  await expect(page).toHaveURL(/\/welcome/);
  await expect(page.getByRole('region', { name: 'Demo mode' })).toHaveCount(0);
});
