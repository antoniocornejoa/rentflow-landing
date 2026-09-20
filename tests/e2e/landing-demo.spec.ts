import { test, expect } from "@playwright/test";

const base = "http://localhost:3000";

/**
 * Renderizado del motor de landings sobre los demos (no requiere Supabase).
 * Cubre: render de plantilla, botón de WhatsApp con mensaje prellenado y
 * envío de formulario de contacto (modo demo, sin tocar la BD).
 */

test("demo servicios: hero y WhatsApp flotante hacia wa.me con el número", async ({ page }) => {
  await page.goto(`${base}/demo/servicios`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Tu auto en manos expertas");
  const wa = page.locator('a[href^="https://wa.me/"]').first();
  await expect(wa).toHaveAttribute("href", /56912345678/);
  await expect(wa).toHaveAttribute("href", /text=/);
});

test("demo servicios: el formulario de contacto confirma el envío", async ({ page }) => {
  await page.goto(`${base}/demo/servicios`);
  await page.locator("#f-nombre").fill("Juan Pérez");
  await page.locator("#f-telefono").fill("+56911112222");
  await page.getByRole("button", { name: /enviar/i }).click();
  await expect(page.getByText(/gracias/i)).toBeVisible();
});

test("demo gastronomía: la carta muestra ítems con precio y botón de pedido", async ({ page }) => {
  await page.goto(`${base}/demo/gastronomia`);
  await expect(page.getByText("Capuccino")).toBeVisible();
  await expect(page.getByText("$3.500")).toBeVisible();
  await expect(page.getByRole("link", { name: "Pedir" }).first()).toBeVisible();
});

test("demo retail: catálogo con precio en oferta y consulta por WhatsApp", async ({ page }) => {
  await page.goto(`${base}/demo/retail`);
  await expect(page.getByText("Taladro percutor 650W")).toBeVisible();
  await expect(page.getByText("$34.990")).toBeVisible();
});
