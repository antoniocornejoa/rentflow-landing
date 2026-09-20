import { defineConfig } from "@playwright/test";

const PORT = 3000;

/**
 * Los tests E2E levantan el servidor de Next automáticamente.
 * Para el routing por subdominio (app.localhost / {tenant}.localhost) el sistema
 * debe resolver *.localhost a 127.0.0.1 (habitual en macOS/Linux; en CI puede
 * requerir una entrada en /etc/hosts).
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_ROOT_DOMAIN: `localhost:${PORT}`,
    },
  },
});
