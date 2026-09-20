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

test("app.{root} sin sesión -> redirige al login", async ({ request }) => {
  const res = await request.get(`${base}/`, {
    headers: { host: `app.localhost:${PORT}` },
    maxRedirects: 0,
  });
  // El panel requiere sesión: responde con redirección a /login.
  expect([302, 303, 307, 308]).toContain(res.status());
  expect(res.headers()["location"] ?? "").toContain("/login");
});

test("acceso directo a ruta interna -> 404", async ({ request }) => {
  const res = await request.get(`${base}/sites/cualquier-cosa`);
  expect(res.status()).toBe(404);
});

test("app.{root}/login -> pantalla de acceso por enlace mágico", async ({ request }) => {
  const res = await request.get(`${base}/login`, { headers: { host: `app.localhost:${PORT}` } });
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain("enlace mágico");
});
