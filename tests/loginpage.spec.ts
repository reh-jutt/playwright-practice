import { test, expect } from "@playwright/test";

test('login test', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.fill('input[name="username"]', 'myusername');
  await page.fill('input[name="password"]', 'mypassword');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('https://example.com/dashboard');
});
