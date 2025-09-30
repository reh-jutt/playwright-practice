import { test } from "@playwright/test";
import { Loginpage } from "../Pages/loginpage";
import { Homepage } from "../Pages/homepage";
import { loginAsValidUser } from "../Helper/utils";

test.describe("Home Page Tests", () => {
  let loginpage: Loginpage;
  let homepage: Homepage;

  test.beforeEach(async ({ page }) => {
    // Perform login before home
    await loginAsValidUser(page);  
    //Home page object
    homepage = new Homepage(page);
    await homepage.goto();
  });

  test("Verify Home Page UI elements", async ({ page }) => {
    await homepage.verifyHomePageUI();
  });
  test("Verify Logout functionality", async ({ page }) => {
    await homepage.verifyLogout();
  });
  test("Verify Footer Section", async ({ page }) => {
    await homepage.verifyFooterSection();
  });
});

// import { test, expect } from '@playwright/test';
// import { performLogin } from '../Helper/utils';
// import { verifyFooterSection } from '../Helper/footersection';

// test.describe('Home Page Tests', () => {

//   test.beforeEach(async ({ page }) => {
//     // Reuse login function for authenticated state
//     await performLogin(page, 'tomsmith', 'SuperSecretPassword!');
//   });

//   test('Verify Home Page heading', async ({ page }) => {
//     await expect(page.getByRole("heading", { name: "Secure Area", level: 2 })).toHaveText("Secure Area");
//     await verifyFooterSection(page);
//   });

// });
