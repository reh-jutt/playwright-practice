import { Page, expect } from "@playwright/test";
import { verifyFooterLink } from "../Helper/footersection";
export class Homepage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/secure"); // uses baseURL
  }

  logoutButton = () => this.page.getByRole("link", { name: "Logout" });

  // Verify the Home Page UI elements
  async verifyHomePageUI() {
    await expect(
      this.page.getByRole("heading", { name: "Secure Area", level: 2 })
    ).toBeVisible();
    await expect(
      this.page.getByRole("heading", { name: "Secure Area", level: 2 })
    ).toHaveText("Secure Area");
    await expect(
      this.page.getByText(
        "Welcome to the Secure Area. When you are done click logout below."
      )
    ).toBeVisible();
    await expect(this.logoutButton()).toBeVisible();
  }

  // Verify the logout functionality
  async verifyLogout() {
    await this.logoutButton().click();
    await expect(this.page).toHaveURL("/login");
  }
  async verifyFooterSection() {
    await verifyFooterLink(this.page);
  }
}
