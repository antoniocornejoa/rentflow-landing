import { test, expect } from "@playwright/test";

const base = "http://localhost:3000";

/** Sitio comercial (host raíz), sin Supabase: precios fallback, demos y hero interactivo. */

test("home muestra el titular, un plan con precio y enlaces a demos", async ({ page }) => {
  await page.goto(`${base}/`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("suene el teléfono");
  // Bloque de valor "Todo incluido": precio de entrada en un solo nodo de texto.
  await expect(page.getByText("desde $29.900/mes")).toBeVisible();
  // Vitrina de plantillas → enlaces a las demos por rubro.
  await expect(page.locator('a[href="/demo/servicios"]')).toBeVisible();
  await expect(page.locator('a[href="/demo/gastronomia"]')).toBeVisible();
});

test("los planes se muestran con sus nombres y precios", async ({ page }) => {
  await page.goto(`${base}/#planes`);
  await expect(page.getByRole("heading", { name: "Básico" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Premium" })).toBeVisible();
});

test("el selector de rubro cambia la vista previa (CSS :has, sin JS)", async ({ page }) => {
  await page.goto(`${base}/`);
  const serv = page.locator('[data-panel="serv"]');
  const gastro = page.locator('[data-panel="gastro"]');
  await expect(serv).toBeVisible();
  await expect(gastro).toBeHidden();
  // Clic en la pestaña "Café" (gastronomía): activa el radio y cambia el panel visible.
  await page.getByText("Café", { exact: true }).click();
  await expect(gastro).toBeVisible();
  await expect(serv).toBeHidden();
});

test("el formulario de prospecto está presente", async ({ page }) => {
  await page.goto(`${base}/#contacto`);
  await expect(page.getByPlaceholder("Nombre")).toBeVisible();
  await expect(page.getByRole("button", { name: /quiero mi página/i })).toBeVisible();
});
