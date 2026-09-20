import { test, expect } from "@playwright/test";

const PORT = 3000;
const base = `http://localhost:${PORT}`;

/**
 * Ruteo multi-tenant por host (no requiere Supabase).
 * El host se fuerza con el header `Host` para no depender de la resolución DNS
 * de *.localhost.
 */

test("health responde ok", async ({ request }) => {
  const res = await request.get(`${base}/api/health`);
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { ok: boolean };
  expect(body.ok).toBe(true);
});

test("host raíz -> sitio comercial", async ({ request }) => {
  const res = await request.get(`${base}/`, { headers: { host: `localhost:${PORT}` } });
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("capta clientes");
});

test("app.{root} -> panel", async ({ request }) => {
  const res = await request.get(`${base}/`, { headers: { host: `app.localhost:${PORT}` } });
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("Panel RentFlow");
});

test("acceso directo a ruta interna -> 404", async ({ request }) => {
  const res = await request.get(`${base}/sites/cualquier-cosa`);
  expect(res.status()).toBe(404);
});
