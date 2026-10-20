# Anchor Point Static Site

Responsive multipage static website using HTML, CSS, and vanilla JavaScript.

## Project structure
- `index.html`, `services.html`, `membership.html`, `faq.html` — source pages
- `partials/header.html`, `partials/footer.html` — global layout partials
- `css/`, `js/`, `img/` — source assets
- `public/` — favicons and other assets copied directly into the published site root
- `scripts/build-static.mjs` — compile script that injects partials and copies assets
- `dist/` — generated deployment output (do not edit directly)

## Pages
- `index.html` — homepage
- `services.html` — services and care capabilities
- `membership.html` — membership plans, pricing, household rates, and billing notes
- `faq.html` — frequently asked questions

## Brand
Uses the Anchor Point Modern Naval palette and the existing Cormorant Garamond + Inter font pairing.

## Local development
Run `npm run dev` for the main workflow.

This does two things at the same time:
- Watches source files and rebuilds automatically on save
- Serves `dist/` at `http://localhost:8080` with live reload

### First-time setup
1. Install Node.js 18+.
2. Run `npm install`.
3. Run `npm run dev`.

### Daily workflow
1. Keep `npm run dev` running.
2. Edit source files (`*.html`, `partials/*.html`, `css/*`, `js/*`, `img/*`).
3. Save your changes.
4. Build updates automatically and browser refreshes.

## Compile locally for deployment
This project can compile to a deployment-ready static folder with global header and footer baked into each page.

1. Run `npm run build` from the project root.
2. Deploy the generated `dist/` folder.

Favicon source files live in `public/`. The build copies its contents into `dist/`, so HTML references use `/favicon.ico` and `/favicon-light-32x32.png`, without a `public/` prefix. Light and dark 32px icons and 180px touch icons are linked on every page; 192px and 512px variants are also included in the build.

Optional local preview of built output:

- Run `npm run preview`
- Open `http://localhost:8080`

## Hosting configuration
### Netlify
- Build command: `npm run build`
- Publish directory: `dist`

### Production Netlify account

Homepage RSVP (`email-signup`) and member inquiries (`membership-inquiry`) both submit through Netlify Forms and redirect to `thank-you.html`. Email delivery is configured in Netlify, not the browser. After publishing, the production workflow runs `scripts/sync-form-notifications.mjs` to match RSVP notifications to the inquiry form's email destinations without duplicating site-wide rules. If a project has no inquiry email notification yet, it creates one for `matt@anchorpoint.med`, the verified development destination. The same script can be run for dev with that site's `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`.

Userback is included only in development and staging builds. `npm run dev` enables it locally. Set the development/staging Netlify project's build command to `npm run build:staging`. Both `npm run build` (default) and `npm run build:production` exclude Userback from generated HTML; the production workflow explicitly uses `build:production`. For other build integrations, `SITE_ENV=staging` enables the widget with `npm run build`.

The `Deploy production` GitHub Actions workflow (`.github/workflows/deploy-production.yml`) publishes `main` from `timhurt/apm-production` to the existing production Netlify project when manually triggered. Runs in other repositories are skipped. It uses its own credentials and project ID, so the local `.netlify/` link can remain pointed at the development site.

One-time setup:

1. Sign in to the production Netlify account and open the existing production project. Disable Git auto-deploys if releases should only happen through this workflow.
2. Copy its **Project ID** from **Project configuration → General → Project details → Project information**.
3. Create a personal access token while signed in to the production account. Treat it as a password; do not commit it or paste it into chat.
4. In `timhurt/apm-production`, open **Settings → Environments** and create an environment named `production`. A repository and an environment are separate; creating the repository does not create this environment. Add these environment secrets:
   - `NETLIFY_PRODUCTION_AUTH_TOKEN`: the production account's access token.
   - `NETLIFY_PRODUCTION_SITE_ID`: the production project's ID.
5. Restrict that environment to `main`. Add required reviewers if your GitHub plan supports them and you want release approval.
6. Add a production remote with `git remote add production https://github.com/timhurt/apm-production.git` (once), then commit the site source and workflow and run `git push production main` so GitHub can run it. The existing `apm` remote continues to target the development repository.

To release:

1. Commit the changes you want to publish, then run `git push production main`. Only committed changes are pushed.
2. In `timhurt/apm-production`, open **Actions → Deploy production → Run workflow**, select `main`, and run it.
3. Check the deployment URL in the job output and verify the live site. Runs from other branches are skipped.

The workflow installs dependencies, builds `dist/`, and explicitly deploys to the production project with `--prod`. It does not require switching your local Netlify login or relinking this directory. Configure the production domain and DNS in the production Netlify project. To roll back, republish a previous successful deploy from that project's Netlify dashboard.

Netlify references: [CLI authentication and project IDs](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/), [deploy command](https://cli.netlify.com/commands/deploy/).

### Cloudflare Pages
- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `dist`

## Before launch
Replace image placeholders, connect inquiry forms, and replace the LinkedIn/Instagram placeholder links in the footer with official profile URLs.
