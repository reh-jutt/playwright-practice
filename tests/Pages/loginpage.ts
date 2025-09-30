import { Page, expect } from "@playwright/test";
import { verifyFooterLink } from "../Helper/footersection";

export class Loginpage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login"); // uses baseURL
  }

  // ------ Locators ------
  usernameInput = () => this.page.getByLabel("Username");
  passwordInput = () => this.page.getByLabel("Password");
  loginButton = () => this.page.getByRole("button", { name: "Login" });
  flashMessage = () => this.page.locator("#flash"); // error / success banner
  CloseFlashButton = () => this.flashMessage().locator("a"); // Close X on the flash message

  // ------ Methods ------

  async verifyLogin(username: string, password: string) {
    await this.usernameInput().fill(username);
    await this.passwordInput().fill(password);
    await this.loginButton().click();
    await this.flashMessage().waitFor();
  }

  // Verify the successful login
  async verifySuccessfulLogin() {
    await expect(this.page).toHaveURL("/secure");
    await expect(
      this.page.getByRole("heading", { name: "Secure Area", level: 2 })
    ).toHaveText("Secure Area");
    await expect(this.flashMessage()).toContainText(
      "You logged into a secure area!"
    );
    await expect(this.flashMessage()).toBeVisible();
    await expect(this.CloseFlashButton()).toBeVisible();
    // Close the flash message
    await this.CloseFlashButton().click();
  }

  // Verify the unsuccessful login
  async verifyUnsuccessfulLogin() {
    await expect(this.page).toHaveURL("/login");
    await expect(this.flashMessage()).toContainText(/Your (username|password) is invalid!/);
    await expect(this.flashMessage()).toBeVisible();
    await expect(this.CloseFlashButton()).toBeVisible();

    // Close the flash message
    await this.CloseFlashButton().click();
  }

  // Verify the UI elements on the login page
  async verifyLoginPageUI() {
    await expect(
      this.page.getByRole("heading", { name: "Login Page" })
    ).toHaveText("Login Page");
    await expect(
      this.page.getByText(
        "This is where you can log into the secure area. Enter tomsmith for the username and SuperSecretPassword! for the password. If the information is wrong you should see error messages."
      )
    ).toHaveText(
      "This is where you can log into the secure area. Enter tomsmith for the username and SuperSecretPassword! for the password. If the information is wrong you should see error messages."
    );
    await expect(this.usernameInput()).toBeVisible();
    await expect(this.passwordInput()).toBeVisible();
    await expect(this.loginButton()).toBeVisible();
  }

  async verifyFooterLink() {
    await verifyFooterLink(this.page);
  }
}

// import { Page, expect } from "@playwright/test";
// import { verifyFooterSection } from "../Helper/footersection";

// export class LoginPage {
//   constructor(private page: Page) {}

//   async goto() {
//     await this.page.goto("/login"); // uses baseURL
//   }

//   // ------ Locators ------
//   usernameInput = () => this.page.getByLabel("Username");
//   passwordInput = () => this.page.getByLabel("Password");
//   loginButton = () => this.page.getByRole("button", { name: "Login" });
//   // flashMessage  = () => this.page.locator('#flash');   // error / success banner

//   async login(username: string, password: string) {
//     await this.usernameInput().fill(username);
//     await this.passwordInput().fill(password);
//     await this.loginButton().click();
//   }

//   async verifySuccessfulLogin() {
//     await expect(this.page).toHaveURL("/secure");
//     await expect(
//       this.page.getByRole("heading", { name: "Secure Area", level: 2 })
//     ).toHaveText("Secure Area");
//   }

//   async verifyLoginPageUI() {
//     await expect(
//       this.page.getByRole("heading", { name: "Login Page" })
//     ).toHaveText("Login Page");
//     await expect(this.page.getByLabel("Username")).toBeVisible();
//     await expect(this.page.getByLabel("Password")).toBeVisible();
//     await expect(
//       this.page.getByRole("button", { name: "Login" })
//     ).toBeVisible();
//   }

//   async verifyFooterLink() {
//     await verifyFooterSection(this.page);
//   }
// }
