import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login'); // uses baseURL
  }

  async login(username: string, password: string) {
    await this.page.getByLabel('Username').fill(username);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  async verifySuccessfulLogin() {
    await expect(this.page).toHaveURL('/secure');
    await expect(this.page.getByRole("heading", { name: "Secure Area", level: 2 })).toHaveText("Secure Area");
  }

  async verifyLoginPageUI() {
    await expect(this.page.getByRole('heading', { name: 'Login Page' }))
      .toHaveText('Login Page');
    await expect(this.page.getByLabel('Username')).toBeVisible();
    await expect(this.page.getByLabel('Password')).toBeVisible();
    await expect(this.page.getByRole('button', { name: 'Login' })).toBeVisible();
  }
}
