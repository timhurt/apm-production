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

### Cloudflare Pages
- Framework preset: `None`
- Build command: `npm run build`
- Build output directory: `dist`

## Before launch
Replace image placeholders, connect inquiry forms, and replace the LinkedIn/Instagram placeholder links in the footer with official profile URLs.
