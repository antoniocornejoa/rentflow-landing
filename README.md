# RentFlow — Plataforma de landing pages en arriendo

Plataforma **multi-tenant** para arrendar landing pages a pymes. Un solo proyecto
Next.js en Vercel + una sola base Postgres en Supabase sirven a todos los clientes.
Dar de alta un cliente = **crear un registro + apuntar un dominio**. Cero código y
cero deploy por cliente.

> Estado: **Fase 1** (setup, esquema de BD, RLS y middleware multi-tenant).
> Ver `docs/fase-1-diseno.md` para el diseño completo y las decisiones tomadas.

---

## Arquitectura

- **`middleware.ts`** resuelve el `host` de cada request y reescribe a la rama interna:
  - `midominio.cl` / `www` → **sitio comercial** (`app/(marketing)`)
  - `app.midominio.cl` → **panel + portal** (`app/(platform)/panel`)
  - cualquier otro host → **landing del tenant** (`app/sites/[domain]`)
- La **resolución del tenant** (host → registro) vive en `lib/tenant/resolve.ts`,
  cacheada con `unstable_cache` (ISR: `revalidate 3600` + invalidación on-demand por tag).
- Las landings **no** consultan la BD en el edge: el middleware solo rutea; la lectura
  cacheada ocurre en la ruta del tenant. El render usa `service_role` (server-side) para
  poder decidir la página según el estado (activo / mantención / coming-soon / 404).
- **RLS** en todas las tablas aísla a cada cliente. La ingesta de leads/visitas es
  server-side con `service_role` (Fase 5).

## Stack

Next.js 15 (App Router) · TypeScript estricto · Tailwind CSS v4 · Supabase
(Postgres + Auth + Storage) · Zod · Vercel · Resend (Fase 5).

---

## Puesta en marcha (local)

Requisitos: Node 20+ y una cuenta de Supabase.

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env.local   # y completa los valores

# 3. Base de datos (elige A o B)
```

**A) Con Supabase CLI (recomendado para desarrollo):**

```bash
supabase link --project-ref TU_PROJECT_REF
supabase db push            # aplica supabase/migrations/*.sql
npm run db:types            # regenera lib/supabase/database.types.ts
```

**B) Manual:** ejecuta en orden los archivos de `supabase/migrations/` en el editor
SQL del panel de Supabase (0001 → 0008).

Después:

```bash
npm run dev                 # http://localhost:3000
```

En local, `NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000`. Para probar un tenant usa un
subdominio que resuelva a 127.0.0.1, p. ej. `http://taller.localhost:3000`.

### Habilitar el rol admin (una vez)

1. Supabase → **Authentication → Hooks** → *Customize Access Token (JWT) Claims* →
   apunta a `public.custom_access_token_hook`.
2. Marca a tu usuario como admin:
   ```sql
   update public.users set rol = 'admin' where email = 'tucorreo@dominio.cl';
   ```
   (Cierra sesión y vuelve a entrar para refrescar el JWT.)

---

## Estructura

```
app/
  (marketing)/page.tsx        # sitio comercial (midominio.cl)
  (platform)/panel/page.tsx   # panel + portal (app.midominio.cl)
  sites/[domain]/             # landing del tenant (resuelto por host)
  api/health/route.ts
lib/
  domains.ts                  # clasificación de host (edge-safe)
  env.ts / env.server.ts      # validación de entorno (público / secreto)
  supabase/{admin,server,client}.ts
  tenant/resolve.ts           # host → tenant (cacheado)
middleware.ts                 # ruteo multi-tenant
supabase/migrations/          # esquema + RLS + storage + seed
tests/                        # Playwright (unit + e2e)
docs/fase-1-diseno.md         # diseño y decisiones
```

## Migraciones y seguridad

| Archivo | Contenido |
|---|---|
| `0001` | extensiones + enums |
| `0002` | tablas núcleo (tenants, dominios, usuarios, contenido, tema, planes) |
| `0003` | negocio (leads, subscriptions, payments, reportes, cambios, prospectos) |
| `0004` | analítica (`page_views` particionado + rollup `page_view_daily`) |
| `0005` | funciones, triggers y helpers de RLS + auth hook |
| `0006` | **RLS** en todas las tablas |
| `0007` | Storage (bucket `tenant-media` + políticas) |
| `0008` | seed (planes + contenido/tema por plantilla) |

---

## Despliegue

**Supabase:** crea un proyecto (plan Pro recomendado), aplica las migraciones
(`supabase db push`) y habilita el auth hook.

**Vercel:** importa el repo como **un** proyecto (plan Pro, necesario para dominios de
terceros). Variables de entorno: las de `.env.example` (marca `SUPABASE_SERVICE_ROLE_KEY`,
`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `CRON_SECRET` como *secretas*, no `NEXT_PUBLIC`).
Configura el wildcard `*.midominio.cl` y el apex/`app` como dominios del proyecto.

## Alta de un cliente nuevo

> El panel (Fase 4) hará esto en un formulario en < 15 min. Hasta entonces, el
> procedimiento manual es:

1. **Crear el tenant + contenido semilla + suscripción** (SQL, con service_role):
   ```sql
   with nuevo as (
     insert into public.tenants (nombre_negocio, slug, plan, plantilla, estado)
     values ('Taller Los Andes', 'taller-los-andes', 'basico', 'servicios', 'onboarding')
     returning id, plantilla
   )
   insert into public.tenant_content (tenant_id, plantilla, content_published)
   select n.id, n.plantilla, d.content
   from nuevo n join public.plantilla_defaults d on d.plantilla = n.plantilla;
   -- (repetir un patrón similar para tenant_theme desde plantilla_defaults.theme
   --  y crear la fila en public.subscriptions con monto y dia_cobro)
   ```
2. **Apuntar el dominio**: inserta el/los hostnames en `public.tenant_domains`
   (`hostname`, `is_primary`), agrega el dominio al proyecto en Vercel e indica al
   cliente el registro DNS (A/CNAME). Mientras propaga, se puede publicar de inmediato
   en `cliente.midominio.cl` (subdominio propio, bajo tu control).
3. **Publicar**: cuando el contenido esté listo, cambia `tenants.estado` a `'activo'`.
   (La invalidación de cache on-demand por tag se automatiza en la Fase 2/3.)

## Tests

```bash
npm run typecheck      # TypeScript estricto
npm run lint
npm run test:e2e       # Playwright: routing por host + aislamiento RLS
```

- `tests/unit/domains.spec.ts` — resolución de tipo de host (sin servidor).
- `tests/e2e/tenant-routing.spec.ts` — ruteo por host (levanta el server; requiere que
  `*.localhost` resuelva a 127.0.0.1).
- `tests/e2e/rls-aislamiento.spec.ts` — aislamiento RLS entre tenants (requiere un
  proyecto Supabase de prueba; ver variables `SUPABASE_TEST_*`).

Los tests de envío de formulario y clic de WhatsApp llegan con la Fase 5.

## Roadmap por fases

1. ✅ Setup, esquema, migraciones, RLS, middleware multi-tenant
2. Motor de landings + plantilla `servicios`
3. Las otras 3 plantillas
4. Panel de administración
5. Portal del cliente + captura de leads end-to-end
6. Reportes automáticos + sitio comercial
