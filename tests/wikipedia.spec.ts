import {test, expect} from '@playwright/test';

test.beforeEach("Wikipedia search link", async ({page}) => {
    
    //navigate to wikipedia
    await page.goto('https://www.wikipedia.org/');
})

test('wikipedia test case', async ({page})=>{
    //fill search box (role-based locator)
    await page.getByRole('searchbox', {name: 'Search Wikipedia'}).fill('Playwright');
    //click on search button (accessible role)
    await page.getByRole('button', {name: 'Search'}).click();
    //verify page title
    await expect(page).toHaveTitle(/Playwright/);
})

test('test', async ({ page }) => {
  await page.goto('https://www.wikipedia.org/');
  await expect(page.getByRole('heading')).toContainText('The Free Encyclopedi');
  await page.getByRole('searchbox', { name: 'Search Wikipedia' }).click();
  await page.getByRole('button', { name: 'Search' }).click();
  await page.goto('https://www.wikipedia.org/');
  await page.getByRole('link', { name: 'Português 1.155.000+ artigos' }).click();
  await page.getByRole('link', { name: 'Wiki Loves Monuments:' }).click();
});