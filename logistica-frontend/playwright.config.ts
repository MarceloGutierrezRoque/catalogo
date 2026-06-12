/**
 * Playwright E2E config — logistica-frontend
 *
 * ── Prerequisitos ──────────────────────────────────────────────────
 * 1. Backend Django corriendo en http://localhost:8000
 *    $ cd logistica-api && python manage.py runserver
 * 2. Frontend Next.js corriendo en http://localhost:3000
 *    $ npm run dev
 * 3. Un usuario de test en la base de datos:
 *    $ python manage.py shell -c "from django.contrib.auth.models import User; User.objects.create_superuser('admin','admin@example.com','admin123')"
 *
 * Los valores por defecto de E2E_USERNAME / E2E_PASSWORD asumen
 * un usuario "admin" con password "admin123".
 *
 * El server se levanta manualmente (regla del proyecto); NO se usa
 * webServer automático.
 * ───────────────────────────────────────────────────────────────────
 */

import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 30_000,

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      testMatch: /auth\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "chromium-warehouses",
      dependencies: ["setup"],
      testMatch: /warehouses\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
    },
    {
      name: "chromium-products",
      dependencies: ["setup"],
      testMatch: /products\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
    },
    {
      name: "chromium-drivers",
      dependencies: ["setup"],
      testMatch: /drivers\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
    },
    {
      name: "chromium-shipments",
      dependencies: ["setup"],
      testMatch: /shipments\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/user.json",
      },
    },
  ],

  reporter: [["html"], ["list"]],
})
