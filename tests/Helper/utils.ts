// Helper/utils.ts
import { Loginpage } from "../Pages/loginpage";

export async function loginAsValidUser(page) {
  const loginPage = new Loginpage(page);
  await loginPage.goto();
  await loginPage.verifyLogin("tomsmith", "SuperSecretPassword!");
  await loginPage.verifySuccessfulLogin();
}
