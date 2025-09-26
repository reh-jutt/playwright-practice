import { test, expect } from '@playwright/test';
import { performLogin } from '../Helper/utils';

test.describe('Home Page Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Reuse login function for authenticated state
    await performLogin(page, 'tomsmith', 'SuperSecretPassword!');
  });

  test('Verify Home Page heading', async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Secure Area", level: 2 })).toHaveText("Secure Area");
  });

});
