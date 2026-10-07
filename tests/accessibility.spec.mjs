import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const pages = ['index.html','about.html','services.html','membership.html','faq.html','private-primary-care-bethesda.html','onboarding.html','privacy.html','terms.html','thank-you.html'];
test.beforeEach(async ({ page }) => {
  // Audit first-party UI without sending analytics or loading the feedback widget.
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
});
for (const width of [1280, 901, 320]) {
  for (const path of pages) {
    test(`${path} accessibility at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/'+path);
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveCount(1);
      await page.locator('img').evaluateAll(async imgs => {
        imgs.forEach(img => img.loading = 'eager');
        await Promise.all(imgs.map(img => img.decode().catch(() => {})));
      });
      await page.addScriptTag({ path: axePath });
      const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: {type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']} })).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))})));
      expect(violations).toEqual([]);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
      expect(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete || !i.naturalWidth).map(i=>i.src))).toEqual([]);
    });
  }
}
test('skip link and mobile menu keyboard behavior',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.keyboard.press('Tab');
 await expect(page.locator('.skip-link')).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(page.locator('main')).toBeFocused();
 const menu=page.getByRole('button',{name:'Menu',exact:true});
 await menu.focus();await page.keyboard.press('Enter');
 await expect(menu).toHaveAttribute('aria-expanded','true');
 await page.keyboard.press('Tab');
 await expect(page.locator('.site-nav a').first()).toBeFocused();
 await page.keyboard.press('Escape');
 await expect(menu).toBeFocused();
 await expect(menu).toHaveAttribute('aria-expanded','false');
});
test('inquiry errors are described and failed requests retain data',async({page})=>{
 await page.goto('/onboarding.html');
 await page.getByRole('button',{name:'Send Inquiry'}).click();
 await expect(page.locator('#first-name')).toBeFocused();
 await expect(page.locator('#first-name')).toHaveAttribute('aria-invalid','true');
 await expect(page.locator('#first-name')).toHaveAttribute('aria-describedby',/first-name-error/);
 await page.locator('#first-name').fill('Test');await page.locator('#last-name').fill('Visitor');await page.locator('#onboarding-email').fill('test@example.com');
 await page.route('http://127.0.0.1:8091/',r=>r.fulfill({status:500,body:'Failed'}));
 await page.getByRole('button',{name:'Send Inquiry'}).click();
 await expect(page.getByRole('status')).toContainText('couldn’t send');
 await expect(page.locator('#onboarding-email')).toHaveValue('test@example.com');
});
test('content and navigation remain usable without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
 await context.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
 const page=await context.newPage();await page.goto('http://127.0.0.1:8091/');
 await expect(page.locator('.site-nav')).toBeVisible();
 await expect(page.locator('.editorial-copy.reveal').first()).toHaveCSS('opacity','1');
 await context.close();
});
test('FAQ expands with the keyboard', async ({page}) => {
 await page.goto('/faq.html');
 const summary=page.locator('summary').nth(1);
 await summary.focus(); await page.keyboard.press('Enter');
 await expect(page.locator('details').nth(1)).toHaveAttribute('open','');
 await page.keyboard.press('Space');
 await expect(page.locator('details').nth(1)).not.toHaveAttribute('open','');
});
test('signup reports errors and redirects only after successful submission', async ({page}) => {
 await page.goto('/');
 await page.getByRole('button',{name:'Reserve My Spot'}).click();
 await expect(page.locator('#email')).toBeFocused();
 await expect(page.locator('#email')).toHaveAttribute('aria-invalid','true');
 await page.locator('#email').fill('test@example.com');
 await page.route('http://127.0.0.1:8091/',r=>r.request().method()==='POST'?r.fulfill({status:200,body:'OK'}):r.continue());
 await page.getByRole('button',{name:'Reserve My Spot'}).click();
 await expect(page).toHaveURL(/thank-you.html$/);
});
test('reduced motion disables the sticky founder image', async ({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('/');
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.editorial-pair--about .editorial-image')).toHaveCSS('position','relative');
});
for (const path of pages) {
 test(`${path} supports larger text and text spacing`,async({page})=>{
  await page.setViewportSize({width:640,height:900});
  await page.goto('/'+path);
  await page.addStyleTag({content:'html {font-size:200% !important;} * {line-height:1.5 !important; letter-spacing:.12em !important; word-spacing:.16em !important;} p {margin-bottom:2em !important;}'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 });
}
