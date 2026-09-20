import { test, expect } from "@playwright/test";

const base = "http://localhost:3000";

/** Sitio comercial (host raíz), sin Supabase: precios fallback, demos y calculadora. */

test("home muestra planes con precios y enlaces a demos", async ({ page }) => {
  await page.goto(`${base}/`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("capta clientes");
  await expect(page.getByText("$29.900/mes")).toBeVisible();
  await expect(page.getByRole("link", { name: "Servicios" })).toBeVisible();
});

test("la calculadora recalcula el costo del arriendo", async ({ page }) => {
  await page.goto(`${base}/#contacto`);
  // Valores por defecto: 29.900 * 12 = 358.800
  await expect(page.getByText("$358.800")).toBeVisible();
});

test("el formulario de prospecto está presente", async ({ page }) => {
  await page.goto(`${base}/`);
  await expect(page.getByPlaceholder("Nombre")).toBeVisible();
  await expect(page.getByRole("button", { name: /quiero mi landing/i })).toBeVisible();
});
