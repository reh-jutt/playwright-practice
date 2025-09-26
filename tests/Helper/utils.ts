import { Page } from '@playwright/test';
import { LoginPage } from '../Pages/loginpage';

export async function performLogin(page: Page, username: string, password: string) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(username, password);
  await loginPage.verifySuccessfulLogin();
}
