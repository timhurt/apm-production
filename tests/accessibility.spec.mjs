import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const pages = ['index.html','about.html','services.html','membership.html','faq.html','private-primary-care-bethesda.html','onboarding.html','privacy.html','terms.html','thank-you.html','concierge-medicine-bethesda.html','membership-landing.html'];
test('family inquiry preselects Family and limits the counter to four', async ({page}) => {
  await page.goto('/membership.html');
  await expect(page.locator('#family .cta-primary')).toHaveAttribute('href', 'https://calendar.app.google/kogvg1zvvhRYvxt47');
  await page.goto('/onboarding.html?membership=family');
  await expect(page.locator('#membership-type')).toHaveValue('Family');
  const count = page.getByRole('spinbutton', {name: 'Family Members'});
  const plus = page.getByRole('button', {name: 'Increase family members'});
  const minus = page.getByRole('button', {name: 'Decrease family members'});
  await expect(count).toHaveValue('2');
  await plus.click(); await plus.click();
  await expect(count).toHaveValue('4');
  await expect(plus).toBeDisabled();
  await minus.click(); await minus.click(); await minus.click();
  await expect(count).toHaveValue('1');
  await expect(minus).toBeDisabled();
  await count.fill('5');
  expect(await count.evaluate(input => input.validity.valid)).toBe(false);
});
test('family membership includes dependants only while selected', async ({page}) => {
  await page.goto('/onboarding.html');
  const type = page.locator('#membership-type');
  const count = page.locator('#family-dependants');
  await expect(count).toBeHidden();
  await expect(count).toBeDisabled();
  await type.selectOption('Family');
  await expect(count).toBeVisible();
  await count.fill('2');
  expect(await page.locator('#onboarding-form').evaluate(form => Object.fromEntries(new FormData(form)))).toMatchObject({membershipType: 'Family', familyMembers: '2'});
  await count.fill('-1');
  expect(await count.evaluate(input => input.validity.valid)).toBe(false);
  await type.selectOption('Individual');
  expect(await page.locator('#onboarding-form').evaluate(form => new FormData(form).has('familyMembers'))).toBe(false);
  await type.selectOption('Family');
  await expect(count).toHaveValue('2');
  await page.locator('#onboarding-form').evaluate(form => form.reset());
  await expect(type).toHaveValue('Individual');
  await expect(count).toBeHidden();
});
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
 const menu=page.locator('.menu-toggle');
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

test('availability progressively reveals periods and clears hidden submissions', async ({page}) => {
 await page.goto('/onboarding.html');
 await expect(page.locator('.reach-preferences')).toBeHidden();
 await page.locator('#contact-phone').check();
 const periods=page.locator('#availability-periods');
 const monday=page.locator('[data-day="Monday"]');
 await expect(periods).toHaveAttribute('aria-hidden','true');
 await monday.focus();await page.keyboard.press('Space');
 await expect(monday).toHaveAttribute('aria-pressed','true');
 await expect(periods).toHaveAttribute('aria-hidden','false');
 await page.getByRole('button',{name:'Wednesday',exact:true}).click();
 await page.getByRole('button',{name:'Morning Before 12 PM'}).click();
 await page.getByRole('button',{name:'Evening After 5 PM'}).click();
 const availability=()=>page.locator('#onboarding-form').evaluate(form=>{
  const data=new FormData(form);
  return {days:data.getAll('preferredDays'),periods:data.getAll('preferredTimePeriods'),start:data.get('preferredTimeStart'),end:data.get('preferredTimeEnd')};
 });
 expect(await availability()).toEqual({days:['Monday','Wednesday'],periods:['Morning','Evening'],start:'00:00',end:'23:59'});
 await monday.click();
 await expect(periods).toHaveAttribute('aria-hidden','false');
 await page.getByRole('button',{name:'Wednesday',exact:true}).click();
 await expect(periods).toHaveAttribute('aria-hidden','true');
 expect(await availability()).toEqual({days:[],periods:[],start:null,end:null});
 await monday.click();
 await expect(page.getByRole('button',{name:'Morning Before 12 PM'})).toHaveAttribute('aria-pressed','false');
 await page.locator('#contact-phone').uncheck();
 await expect(page.locator('.reach-preferences')).toBeHidden();
 expect(await availability()).toEqual({days:[],periods:[],start:null,end:null});
 await page.locator('#onboarding-form').evaluate(form=>form.reset());
 await expect(monday).toHaveAttribute('aria-pressed','false');
 await expect(periods).toHaveAttribute('aria-hidden','true');
});

test('inquiry sending preserves scroll and waits before confirmation', async ({page}) => {
 await page.goto('/onboarding.html');
 await page.locator('#first-name').fill('Test');await page.locator('#last-name').fill('Visitor');await page.locator('#onboarding-email').fill('test@example.com');
 await page.route('http://127.0.0.1:8091/',r=>r.fulfill({status:200,body:'OK'}));
 const submit=page.getByRole('button',{name:'Send Inquiry'});
 await submit.scrollIntoViewIfNeeded();
 const before=await page.evaluate(()=>scrollY);
 const started=Date.now();
 await submit.click();
 await expect(page.getByRole('status')).toHaveText('Sending…');
 expect(Math.abs(await page.evaluate(()=>scrollY)-before)).toBeLessThan(2);
 await page.waitForTimeout(1000);
 await expect(page).toHaveURL(/onboarding.html$/);
 await expect(page).toHaveURL(/thank-you.html$/);
 expect(Date.now()-started).toBeGreaterThanOrEqual(2400);
});

test('office gallery opens, cycles, swipes and restores focus', async ({page}) => {
  await page.goto('/membership.html');
  const opener = page.getByRole('button', {name: 'View photos of our office'});
  await opener.click();
  const dialog = page.getByRole('dialog', {name: 'Inside Anchor Point'});
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', {name: 'Next office photo'}).click();
  await expect(dialog.locator('figcaption')).toHaveText('Office · 2 of 3');
  await page.keyboard.press('ArrowRight');
  await expect(dialog.locator('figcaption')).toHaveText('Exam room · 3 of 3');
  await dialog.getByRole('button', {name: 'Next office photo'}).click();
  await expect(dialog.locator('figcaption')).toHaveText('Waiting area · 1 of 3');
  await dialog.getByRole('button', {name: 'Previous office photo'}).click();
  await expect(dialog.locator('figcaption')).toHaveText('Exam room · 3 of 3');
  const bounds = await dialog.locator('img').boundingBox();
  await page.mouse.move(bounds.x + bounds.width * .7, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * .3, bounds.y + bounds.height / 2);
  await page.mouse.up();
  await expect(dialog.locator('figcaption')).toHaveText('Waiting area · 1 of 3');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await dialog.getByRole('button', {name: 'Next office photo'}).click();
  await dialog.getByRole('button', {name: 'Close office photos'}).click();
  await expect(opener.locator('img')).toHaveAttribute('src', 'img/anchorpoint-office.jpg');
  await opener.click();
  await expect(dialog.locator('figcaption')).toHaveText('Office · 2 of 3');
});

test('office photo expands and collapses with motion enabled', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto('/membership.html');
  await page.getByRole('button', {name: 'View photos of our office'}).click();
  const dialog = page.getByRole('dialog', {name: 'Inside Anchor Point'});
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.office-gallery-transition')).toHaveCount(0);
  await expect(dialog.locator('img')).toBeVisible();
  await dialog.getByRole('button', {name: 'Close office photos'}).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.office-gallery-transition')).toHaveCount(0);
});
