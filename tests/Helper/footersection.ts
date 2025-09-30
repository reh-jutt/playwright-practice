import {expect, Page} from '@playwright/test';

//  Verify and click on the Footer Link
export const verifyFooterLink = async (page: Page) => {
  await expect(page.getByText("Powered by Elemental Selenium")).toBeVisible();
  // Listen for the new page (tab) after clicking the link
  const [newPage] = await Promise.all([
    page.context().waitForEvent("page"),
    page.getByRole("link", { name: "Elemental Selenium" }).click()
  ]);

  //Verify the URL of the new tab after clicking on the Footer Link
  await expect(newPage).toHaveURL("https://elementalselenium.com/");
};


// //  Verify and click on the Footer Link
// export const verifyFooterSection = async (page: Page) => {
//     await page.goto("");
//   await expect(page.getByText("Powered by Elemental Selenium")).toBeVisible();

//   // Listen for the new page (tab) after clicking the link
//   const [newPage] = await Promise.all([
//     page.context().waitForEvent("page"),
//     page.getByRole("link", { name: "Elemental Selenium" }).click()
//   ]);

//   //Verify the URL of the new tab after clicking on the Footer Link
//   await expect(newPage).toHaveURL("https://elementalselenium.com/");
// };

// // --- IGNORE ---