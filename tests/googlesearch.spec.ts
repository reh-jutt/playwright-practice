import { test, expect } from "@playwright/test";

test('Google Search Test', async ({ page }) => {
    // Navigate to Google
    await page.goto("https://www.google.com");
      // Fill search box (role-based locator)
    await page.getByRole('combobox', { name: 'Search' }).fill('Playwright');
      // Click on "Google Search" button (accessible role)
    // await page.getByRole('button', { name: 'Google Search' }).click(); 
    await page.keyboard.press('Enter'); // Press Enter key to search
    //verify page title
    await expect(page).toHaveTitle(/Playwright/);
});

