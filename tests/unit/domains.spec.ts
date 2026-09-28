import { test, expect } from "@playwright/test";
import { classifyHost, normalizeHost } from "../../lib/domains";

const ROOT = "midominio.cl";

test.describe("classifyHost — resolución de tipo de host", () => {
  test("dominio raíz y www -> marketing", () => {
    expect(classifyHost("midominio.cl", ROOT).kind).toBe("marketing");
    expect(classifyHost("www.midominio.cl", ROOT).kind).toBe("marketing");
  });

  test("app.{root} -> platform (panel + portal)", () => {
    expect(classifyHost("app.midominio.cl", ROOT).kind).toBe("platform");
  });

  test("dominio de tercero (cliente) -> tenant, host normalizado", () => {
    const r = classifyHost("Taller.CL", ROOT);
    expect(r.kind).toBe("tenant");
    expect(r.host).toBe("taller.cl");
  });

  test("subdominio propio del cliente -> tenant", () => {
    expect(classifyHost("cliente.midominio.cl", ROOT).kind).toBe("tenant");
  });

  test("funciona con puerto en desarrollo", () => {
    const rootDev = "localhost:3000";
    expect(classifyHost("localhost:3000", rootDev).kind).toBe("marketing");
    expect(classifyHost("app.localhost:3000", rootDev).kind).toBe("platform");
    expect(classifyHost("taller.localhost:3000", rootDev).kind).toBe("tenant");
  });

  test("host de plataforma explícito -> platform (dirección de prueba)", () => {
    const plat = "rentflow-admin-talca.vercel.app";
    expect(classifyHost(plat, ROOT, plat).kind).toBe("platform");
    // Sin el 3er argumento, ese mismo host sería un tenant.
    expect(classifyHost(plat, ROOT).kind).toBe("tenant");
    // El host de marketing sigue siendo marketing aunque se defina platformHost.
    expect(classifyHost("midominio.cl", ROOT, plat).kind).toBe("marketing");
  });

  test("host vacío o ausente -> marketing (defensivo)", () => {
    expect(classifyHost("", ROOT).kind).toBe("marketing");
    expect(classifyHost(null, ROOT).kind).toBe("marketing");
  });

  test("normalizeHost: minúsculas y sin punto final", () => {
    expect(normalizeHost("Taller.CL.")).toBe("taller.cl");
    expect(normalizeHost(null)).toBe("");
  });
});
