# Accessibility review

Reviewed October 2, 2026. This is an implementation and test record, not a Section 508 certification or Accessibility Conformance Report.

The target is WCAG 2.0 A/AA, the web criteria referenced by the Revised Section 508 Standards. Automated checks additionally cover WCAG 2.1 A/AA and axe best practices. Reference: https://www.section508.gov/test/websites/.

## Implemented

- Skip navigation and programmatically focusable main content on every page.
- Semantic footer navigation, descriptive links, correct active-page labels, and image alternative text. Decorative artwork is excluded from screen-reader announcements.
- Keyboard-operable mobile navigation with Escape dismissal, focus return, and a scrollable menu on short screens.
- Visible two-color focus indicators, darker text accents and input borders, and underlined links within prose.
- Field-specific inquiry errors associated using aria-describedby and aria-invalid; live submission status; preserved data after submission failure.
- Native form validation and navigation without JavaScript; reveal content is visible by default.
- Reduced-motion support for scroll animations, sticky artwork, and preference changes.
- Inactive social links are noninteractive text with a coming-soon description.
- Corrected portrait filename capitalization for case-sensitive hosting.

## Repeatable checks

Run `npm run test:a11y`. Requires installed Google Chrome; configured in playwright.config.mjs.

The suite checks all ten built pages at 1280, 901, and 320 CSS pixels using axe-core; verifies one main landmark and H1, image loading, and document overflow; and exercises skip links, mobile navigation, FAQs, form errors, mocked successful/failed submissions, no-JavaScript content, and reduced-motion preference changes. It also checks horizontal overflow with increased root font size and text spacing at a 640px viewport.

External requests (including Google fonts, Bootstrap icons, analytics, and Userback) are blocked in these tests. Form responses are mocked: no test emails or production submissions are sent. Passing these checks is not proof that every WCAG criterion is met.

## Remaining manual verification

- VoiceOver/Safari and NVDA/Firefox or Chrome: reading order, headings, table header announcements, labels, error announcements, and complete form tasks.
- Real browser zoom to 200% and 400%, text-only enlargement, focus visibility throughout the complete tab sequence, and Windows forced-colors mode. Automated overflow checks do not assess every clipping or overlap condition.
- Production fonts/icons and the Userback feedback widget, including its dialogs, keyboard focus behavior, and accessible names. The external patient portal is outside this repository.
- Production Netlify form receipt, error behavior, thank-you redirect, and email delivery with an authorized test submission.

Do not publish a blanket Section 508 conformance claim until the remaining manual and third-party checks have been completed and documented.
