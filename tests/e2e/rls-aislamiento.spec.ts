import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Aislamiento RLS entre tenants (requiere un proyecto Supabase de PRUEBA con
 * las migraciones aplicadas). Define estas variables para ejecutarlo:
 *
 *   SUPABASE_TEST_URL
 *   SUPABASE_TEST_SERVICE_ROLE_KEY
 *   SUPABASE_TEST_ANON_KEY
 *
 * No requiere el Custom Access Token Hook: has_tenant_access() consulta
 * tenant_users por auth.uid() (SECURITY DEFINER), no el claim del JWT.
 */

const url = process.env.SUPABASE_TEST_URL;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY;

interface LeadRow {
  tenant_id: string;
  nombre: string | null;
}

test.describe("Aislamiento RLS entre tenants", () => {
  test.skip(
    !url || !serviceKey || !anonKey,
    "Define SUPABASE_TEST_URL / SUPABASE_TEST_SERVICE_ROLE_KEY / SUPABASE_TEST_ANON_KEY",
  );

  test("cada cliente solo ve los leads de su propio tenant; anon no ve ninguno", async () => {
    const admin = createClient(url!, serviceKey!, { auth: { persistSession: false } });
    const suffix = Date.now();
    const pass = "Test1234!seguro";
    const emailA = `rls-a-${suffix}@test.cl`;
    const emailB = `rls-b-${suffix}@test.cl`;

    let tenantAId = "";
    let tenantBId = "";
    let userAId = "";
    let userBId = "";

    try {
      // ── Setup con service_role (bypassa RLS) ─────────────────────────────
      const uA = await admin.auth.admin.createUser({ email: emailA, password: pass, email_confirm: true });
      const uB = await admin.auth.admin.createUser({ email: emailB, password: pass, email_confirm: true });
      userAId = uA.data.user!.id;
      userBId = uB.data.user!.id;

      const tA = await admin
        .from("tenants")
        .insert({ nombre_negocio: "Tenant A", slug: `rls-a-${suffix}`, plan: "basico", plantilla: "servicios", estado: "activo" })
        .select("id")
        .single();
      const tB = await admin
        .from("tenants")
        .insert({ nombre_negocio: "Tenant B", slug: `rls-b-${suffix}`, plan: "basico", plantilla: "retail", estado: "activo" })
        .select("id")
        .single();
      tenantAId = tA.data!.id;
      tenantBId = tB.data!.id;

      await admin.from("tenant_users").insert([
        { tenant_id: tenantAId, user_id: userAId, rol: "propietario" },
        { tenant_id: tenantBId, user_id: userBId, rol: "propietario" },
      ]);

      await admin.from("leads").insert([
        { tenant_id: tenantAId, origen: "formulario", nombre: "Lead de A", telefono: "+56900000001" },
        { tenant_id: tenantBId, origen: "formulario", nombre: "Lead de B", telefono: "+56900000002" },
      ]);

      // ── Cliente A: solo ve sus leads ─────────────────────────────────────
      const clientA = createClient(url!, anonKey!, { auth: { persistSession: false } });
      await clientA.auth.signInWithPassword({ email: emailA, password: pass });
      const seenA = await clientA.from("leads").select("tenant_id, nombre");
      const leadsA = (seenA.data ?? []) as LeadRow[];
      expect(leadsA.length).toBeGreaterThan(0);
      expect(leadsA.every((l) => l.tenant_id === tenantAId)).toBe(true);
      expect(leadsA.some((l) => l.tenant_id === tenantBId)).toBe(false);

      // ── Cliente B: no ve los leads de A ──────────────────────────────────
      const clientB = createClient(url!, anonKey!, { auth: { persistSession: false } });
      await clientB.auth.signInWithPassword({ email: emailB, password: pass });
      const seenB = await clientB.from("leads").select("tenant_id, nombre");
      const leadsB = (seenB.data ?? []) as LeadRow[];
      expect(leadsB.every((l) => l.tenant_id === tenantBId)).toBe(true);
      expect(leadsB.some((l) => l.tenant_id === tenantAId)).toBe(false);

      // ── Anónimo: no ve ningún lead ───────────────────────────────────────
      const anon = createClient(url!, anonKey!, { auth: { persistSession: false } });
      const seenAnon = await anon.from("leads").select("tenant_id");
      expect(seenAnon.data ?? []).toHaveLength(0);
    } finally {
      // ── Teardown ─────────────────────────────────────────────────────────
      if (tenantAId || tenantBId) {
        await admin.from("tenants").delete().in("id", [tenantAId, tenantBId].filter(Boolean));
      }
      if (userAId) await admin.auth.admin.deleteUser(userAId);
      if (userBId) await admin.auth.admin.deleteUser(userBId);
    }
  });
});
