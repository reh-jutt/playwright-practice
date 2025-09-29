// //This test cases is written for login page of the application
// import { test, expect } from "@playwright/test";

// test("Login page test", async ({ page }) => {
//   //navigate to login page
//   await page.goto("https://the-internet.herokuapp.com/login");

//   // Check the title of the page
//   await expect(page.getByRole("heading", { name: "Login Page" })).toHaveText(
//     "Login Page"
//   );

//   // Check the subheading of the page
//   await expect(
//     page.getByRole("heading", {
//       name: "This is where you can log into the secure area. Enter tomsmith for the username and SuperSecretPassword! for the password. If the information is wrong you should see error messages.",
//     })
//   ).toHaveText(
//     "This is where you can log into the secure area. Enter tomsmith for the username and SuperSecretPassword! for the password. If the information is wrong you should see error messages."
//   );

//   // Check the visibility of username, password input box and login button
//   await expect(page.getByLabel("Username")).toBeVisible();
//   await expect(page.getByLabel("Password")).toBeVisible();
//   await expect(page.getByRole("button", { name: "Login" })).toBeVisible();

//   //Fill the username and password input box and also click on the login button
//   await page.getByRole("textbox", { name: "Username" }).fill("tomsmith");
//   await page.getByRole("textbox", { name: "Password" }).fill("SuperSecretPassword!");
//   await page.getByRole("button", { name: "Login" }).click();

//   //Verify the URL after login
//   await expect(page).toHaveURL("https://the-internet.herokuapp.com/secure");

//   //Verify the success message after login
//   await expect(page.getByText("You logged into a secure area!")).toContainText("You logged into a secure area!");

//   //Verify the title of the page after login
//   await expect(page.getByRole("heading", { name: "Secure Area", level: 2 })).toHaveText("Secure Area");

//   //Verify the Subheading of the page after login
//   await expect(page.getByRole("heading", {name: "Welcome to the Secure Area. When you are done click logout below."})).toHaveText("Welcome to the Secure Area. When you are done click logout below.");

//   //Check the visibility of logout button
//   await expect(page.getByRole("link", { name: "Logout" })).toBeVisible();

//   //Click on the logout button
//   await page.getByRole("link", { name: "Logout" }).click();

//   //Verify the URL after logout
//   await expect(page).toHaveURL("https://the-internet.herokuapp.com/login");

//   //Verify and click on the Footer Link
//   await expect(page.getByText("Powered by Elemental Selenium")).toBeVisible();

//   // Listen for the new page (tab) after clicking the link
//   const [newPage] = await Promise.all([
//     page.context().waitForEvent("page"),
//     page.getByRole("link", { name: "Elemental Selenium" }).click()
//   ]);

//   //Verify the URL of the new tab after clicking on the Footer Link
//   await expect(newPage).toHaveURL("https://elementalselenium.com/");

//   // --- IGNORE ---
// });



import { test } from '@playwright/test';
import { LoginPage } from '../Pages/loginpage';
import  { performLogin } from '../Helper/utils';


test.describe('Login Module Tests', () => {

  test('Verify Login Page UI', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.verifyLoginPageUI();
    await loginPage.verifyFooterLink();
  });

  test('Login with valid credentials', async ({ page }) => {
    await performLogin(page, 'tomsmith', 'SuperSecretPassword!');
  });

});
// --- IGNORE ---   