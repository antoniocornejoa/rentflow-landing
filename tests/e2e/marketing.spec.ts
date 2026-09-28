import { test, expect } from "@playwright/test";

const base = "http://localhost:3000";

/** Sitio comercial (host raíz), sin Supabase: titular, planes y formulario. */

test("home muestra el titular y el precio de entrada", async ({ page }) => {
  await page.goto(`${base}/`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("suene el teléfono");
  // Bloque de valor "Todo incluido": precio de entrada en un solo nodo de texto.
  await expect(page.getByText("desde $29.900/mes")).toBeVisible();
});

test("los planes se muestran con sus nombres y precios", async ({ page }) => {
  await page.goto(`${base}/#planes`);
  await expect(page.getByRole("heading", { name: "Básico" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Premium" })).toBeVisible();
});

test("el formulario de prospecto está presente", async ({ page }) => {
  await page.goto(`${base}/#contacto`);
  await expect(page.getByPlaceholder("Nombre")).toBeVisible();
  await expect(page.getByRole("button", { name: /quiero mi página/i })).toBeVisible();
});
