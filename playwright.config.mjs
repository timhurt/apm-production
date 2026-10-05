import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  workers: 1,
  reporter: 'list',
  use: { channel: 'chrome', baseURL: 'http://127.0.0.1:8091', reducedMotion: 'reduce' },
  webServer: { command: 'python3 -m http.server 8091 --bind 127.0.0.1 --directory dist', url: 'http://127.0.0.1:8091', reuseExistingServer: false },
});
