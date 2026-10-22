import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const partialsDir = path.join(rootDir, 'partials');

const pages = ['index.html', 'about.html', 'services.html', 'membership.html', 'faq.html', 'private-primary-care-bethesda.html', 'onboarding.html', 'thank-you.html', 'privacy.html', 'terms.html', 'membership-landing.html'];
const staticDirs = ['css', 'js', 'img'];
const environment = process.argv.find(arg => arg.startsWith('--environment='))?.split('=')[1]
  || process.env.SITE_ENV || 'production';
if (!['production', 'development', 'staging'].includes(environment)) {
  throw new Error(`Unsupported site environment: ${environment}`);
}

function injectPartials(html, headerMarkup, footerMarkup) {
  return html
    .replace(/<div\s+id="site-header"\s*><\/div>/i, headerMarkup)
    .replace(/<div\s+id="site-footer"\s*><\/div>/i, footerMarkup);
}

async function build() {
  const [headerMarkup, footerMarkup] = await Promise.all([
    readFile(path.join(partialsDir, 'header.html'), 'utf8'),
    readFile(path.join(partialsDir, 'footer.html'), 'utf8')
  ]);
  const footer = environment === 'production'
    ? footerMarkup.replace(/<!-- USERBACK:START -->[\s\S]*?<!-- USERBACK:END -->\s*/g, '')
    : footerMarkup;
  if (environment === 'production' && /userback/i.test(footer)) {
    throw new Error('Production footer still contains Userback.');
  }

  await mkdir(distDir, { recursive: true });

  await Promise.all(
    pages.map(async page => {
      const sourcePath = path.join(rootDir, page);
      const distPath = path.join(distDir, page);
      const html = await readFile(sourcePath, 'utf8');
      const compiled = injectPartials(html, headerMarkup, footer);
      if (environment === 'production' && /userback/i.test(compiled)) {
        throw new Error(`Production page ${page} still contains Userback.`);
      }
      await writeFile(distPath, compiled, 'utf8');
    })
  );

  await Promise.all(
    staticDirs.map(async dir => {
      const sourceDir = path.join(rootDir, dir);
      const outDir = path.join(distDir, dir);

      await rm(outDir, { recursive: true, force: true });
      await cp(sourceDir, outDir, { recursive: true });
    })
  );

  // Public assets are served at the site root (for example, /favicon.ico).
  await cp(path.join(rootDir, 'public'), distDir, { recursive: true });

  console.log(`Build complete (${environment}): dist folder is ready for deployment.`);
}

build().catch(error => {
  console.error(error);
  process.exit(1);
});
