# Fase 1 — Diseño de base de datos, RLS y contenido (para revisión)

> Documento de propuesta. **No se ha escrito código todavía.** Léelo, marca lo que
> quieras cambiar y responde las decisiones del §1. Cuando lo apruebes, escribo las
> migraciones SQL, el `middleware.ts` y el esqueleto del proyecto Next.js 15.

---

## 0. Resumen en una frase

Un solo proyecto Next.js en Vercel + una sola base Postgres en Supabase sirven a
los 50+ clientes. Cada cliente es **una fila** en `tenants` (+ contenido en `jsonb`
+ dominio apuntado). Las landings se renderizan con **ISR** cacheado en el edge y se
refrescan con **revalidación on-demand** cuando editas. El aislamiento entre clientes
es 100% por **RLS**. Dar de alta = INSERT + apuntar DNS. Cero código, cero deploy por
cliente. **Esto sí es alcanzable** con el diseño de abajo — salvo una restricción: el
tope de USD 25/mes (ver Decisión A).

---

## 1. Decisiones que necesito de ti antes de codear

Estas son las que tienen un trade-off real (según tu regla de "plantéamelo antes de
elegir por ti"). Mi recomendación va primero.

### A. Presupuesto de infraestructura — **la más importante, bloquea el resto**

El tope de **USD 25/mes para 50+ clientes no es alcanzable de forma legítima** con el
stack que fijaste. Números reales:

| Servicio | Plan | USD/mes | Por qué es el piso |
|---|---|---|---|
| Vercel | **Pro** | 20 | Hobby prohíbe uso comercial (Fair Use/ToS) y **gestionar dominios de terceros exige plan pagado** (`custom_domain_needs_upgrade`). |
| Supabase | **Pro** | 25 | Free = 500 MB de BD, se **pausa** tras inactividad y **sin backups**. `page_views` propio revienta los 500 MB en meses. Inaceptable cobrando. |
| Resend | Free (borde) → Pro | 0 → 20 | Free = 3.000/mes **y solo 100/día**; el tope diario se rompe en peaks y multi-dominio obliga Pro. |
| **Total fijo realista** | | **~45–65** | Excluye dominios `.cl` y fees de pasarela (variables). |

Contexto económico: a 50 clientes pagando el mínimo (~USD 30) tu ingreso es
**~USD 1.500/mes**; una infra de 45–65 es **3–4% del MRR** y **no escala por cliente**
(se mantiene plana hasta volúmenes muy superiores). El problema es el número objetivo,
no la arquitectura.

- **Opción A (recomendada):** aceptar ~USD 45–70/mes. Cumple ToS, backups, sin pausas, escala a 50+ sin cambios.
- **Opción B:** forzar free tiers → viola ToS de Vercel (riesgo de baneo) y Supabase Free pierde datos. **No recomendada** para un producto por el que cobras.
- **Opción C:** cambiar de stack (Cloudflare Pages/Workers/D1). Más barato pero fuera del stack que fijaste y pierdes la integración Supabase Auth/Storage/RLS.

**➡️ Necesito que decidas A, B o C.** Si no, todo lo demás queda en el aire.

### B. ¿Sobre qué se mide el SLA de "landing en producción en < 2 h"?

El wildcard `*.midominio.cl` cubre tus subdominios, **no** el dominio `.cl` del cliente.
El dominio del cliente hay que agregarlo al proyecto Vercel (automatizable por API en el
alta) **pero la verificación depende de que el cliente configure su DNS**, lo que puede
tardar horas — fuera de tu control.

- **Recomendado:** publicar de inmediato en `cliente.midominio.cl` (bajo tu control, cumple < 2 h con certeza) y **conmutar** al dominio `.cl` propio cuando su DNS propague.
- Alternativa: medir el SLA solo desde que el cliente ya apuntó su DNS.

**➡️ ¿El "< 2 h" se mide sobre tu subdominio (garantizable) o sobre el dominio del cliente?**

### C. ¿Cómo se capturan leads y visitas? (afecta seguridad y costo)

- **Recomendado:** el formulario y el clic de WhatsApp y las visitas se insertan **server-side** vía Route Handler con `service_role` + **Cloudflare Turnstile** + rate-limit + honeypot. Cierra el spam (la `anon key` es pública) y evita que inflen `page_views` y la BD. Las políticas anon quedan solo como defensa en profundidad.
- Alternativa: INSERT directo con `anon key` + política `WITH CHECK`. Más simple, pero abierto a abuso.

**➡️ ¿Voy con service_role + Turnstile (recomendado) o INSERT anon directo?**

### D. Cobros en CLP: ¿manual al inicio o pasarela desde ya?

No mencionaste pasarela. El modelo `subscriptions`/`payments` soporta ambos.

- **Recomendado:** cobro **manual** (tú marcas pagado/moroso, con recordatorios automáticos) hasta ~10 clientes para validar; integrar **Flow o Mercado Pago** (suscripción recurrente + webhooks) antes de escalar a 50, lo que además automatiza la suspensión por morosidad. Fee ~2,9–3,5% + IVA sale del ingreso, no del tope de infra.

**➡️ ¿Empezamos manual o integro pasarela desde el día 1?**

### Decisiones menores (puedo tomar el default si no opinas)

- **E.** Registro/pago de dominios `.cl`: **lo paga el cliente** (recomendado; mantiene la propiedad y saca el costo de tu presupuesto) vs. lo asumes tú (~USD 10–15/año c/u).
- **F.** ¿El cliente ve su morosidad (`estado_pago`, `monto`) en el portal, o eso queda admin-only? Default: mostrar plan y estado_pago, ocultar detalle de cobranza.
- **G.** Edición del cliente: **RPC con allowlist + Zod** (seguro, recomendado) vs. UPDATE directo de fila. Default: RPC con allowlist.

---

## 2. Esquema de base de datos (Postgres / Supabase)

**Extensiones:** `pgcrypto` (uuid), `citext` (email/dominio/slug case-insensitive),
`pg_partman` *opcional* (particiones de `page_views`; si no, se gestionan por migración + cron).

**Convenciones:** todo `timestamptz` con `now()`; `updated_at` por trigger; enums nativos
para vocabularios controlados; **dinero en CLP como `integer` de pesos enteros** (sin
decimales); `uuid` en todo lo expuesto por API/URL/RLS, `bigint` solo en `page_views`
(alto volumen, id no expuesto).

### 2.1 Tablas

| Tabla | Propósito | Notas clave |
|---|---|---|
| `tenants` | Fila maestra del cliente que el middleware resuelve por host. | `estado` (enum) es una **bandera de servicio derivada** que lee el edge. `fecha_corte` **NO** vive aquí. |
| `tenant_domains` | Todos los hostnames → tenant (apex, www, alias). Fuente de ruteo, espejada a **Vercel Edge Config** para lookup O(1) sin tocar Postgres por request. | `hostname` UNIQUE global; `UNIQUE(tenant_id) WHERE is_primary`. |
| `tenant_content` | Contenido de la landing en `jsonb`, 1:1 con el tenant. **`content_published`** (lo que ISR sirve en 1 lectura) + **`content_draft`** (buffer de edición/preview). | `schema_version`, `published_version`, `published_at`. Sin joins en el hot path. |
| `tenant_content_versions` | Historial append-only de snapshots publicados → **rollback** con soporte casi nulo. | `UNIQUE(tenant_id, version)`. Retención ~20 últimas por tenant. |
| `tenant_theme` | Colores, tipografía, logo → variables CSS. 1:1. | Solo **paths** de Storage (`logo_path`, `og_image_path`), nunca URLs. |
| `users` | Perfil + rol global, espejo de `auth.users`. | `rol` enum `app_rol` (`admin`/`cliente`). Poblado por trigger on `auth.users` insert. |
| `tenant_users` | N:M usuario↔tenant con rol por tenant. **Base del aislamiento RLS.** | PK `(tenant_id, user_id)`. |
| `leads` | Captación: formulario, clic WhatsApp, llamada. **Núcleo de valor.** | `origen` enum, `estado` enum, `utm_*`, `referrer`, `path`, `device`, `metadata jsonb`. Índices por `(tenant_id, created_at)`, `(tenant_id, estado)`, `(tenant_id, origen, created_at)`. |
| `page_views` | Ingesta cruda de visitas **sin cookies**. Particionada por mes, retención ~90 días vía `DROP PARTITION`. | Columnas mínimas: `path`, `referrer_host`, `device`, `visitor_hash?`. Sin IP/UA/URL cruda. |
| `page_view_daily` | **Rollup diario** por tenant (cron). Fuente del gráfico de 6 meses y del reporte. | PK `(tenant_id, fecha)`; desgloses en `jsonb` (`por_device`, `por_path`, `por_referrer`). ~18k filas/año a 50 tenants. |
| `subscriptions` | Relación comercial 1:1. **Fuente de verdad del dinero.** | `monto` (CLP int), `dia_cobro` (1–28), `estado_pago` enum, **`fecha_corte` vive aquí**, `ultimo_pago`. |
| `payments` | Historial de cobros por período → MRR, churn. | `UNIQUE(tenant_id, periodo)`. Trigger actualiza `subscriptions.ultimo_pago`/`estado_pago`. |
| `monthly_reports` | Histórico del reporte mensual automático (cron día 1). | `UNIQUE(tenant_id, periodo)`, `comparativa jsonb` vs mes anterior, `email_message_id`. |
| `change_requests` | Solicitudes de "cambios mayores" del portal. | `tipo`/`prioridad`/`estado` enums, `adjuntos jsonb` (paths). |
| `prospects` | Interesados del sitio comercial (aún no clientes). | `utm_*`, `estado` enum, `convertido_tenant_id` (traza conversión). |
| `planes` | Catálogo de los 3 planes (precio/features) **editable sin deploy**. Alimenta pricing, calculadora y monto por defecto. | PK = enum `plan`. `SELECT` público. |

### 2.2 Enums

`app_rol`(admin, cliente) · `tenant_rol`(propietario, editor) ·
`tenant_estado`(**onboarding, activo, suspendido, moroso, cancelado**) ·
`plan_tipo`(basico, pro, premium) · `plantilla_tipo`(servicios, gastronomia, inmobiliaria, retail) ·
`lead_origen`(formulario, whatsapp, llamada) · `lead_estado`(nuevo, contactado, atendido, descartado) ·
`device_tipo`(mobile, tablet, desktop) · `cuenta_estado_pago`(al_dia, pendiente, vencido) ·
`pago_estado`(pagado, pendiente, fallido, reembolsado) ·
`change_request_tipo`/`change_request_estado` · `prioridad`(baja, media, alta) ·
`prospect_estado`(nuevo, contactado, propuesta, convertido, descartado).

### 2.3 Decisiones de modelado (y por qué)

1. **`tenant_content` híbrido:** 1 fila caliente (`content_published` + `content_draft`) que ISR lee sin joins, **más** `tenant_content_versions` para rollback. Publicar = validar draft con Zod → copiar a published → snapshot → `revalidateTag('tenant:{id}')`.
2. **Morosidad sin duplicar la verdad:** `fecha_corte`/`estado_pago`/`ultimo_pago` viven **solo** en `subscriptions`. `tenants.estado` es una bandera derivada que escribe el cron/webhook, para que el middleware lea **una sola fila**.
3. **`page_views` a escala:** separar ingesta (raw particionado, retención corta) de consulta (`page_view_daily` rollup). El portal y el reporte leen siempre el rollup → BD chica y dashboards rápidos.
4. **Dinero en CLP entero:** sin float, sin centavos; `CHECK (>= 0)`, `moneda char(3)='CLP'`.
5. **Imágenes:** la BD guarda **solo keys** de Storage; las URLs AVIF/WebP se construyen en runtime con `next/image`.
6. **Ruteo host→tenant:** `tenant_domains` es la verdad, espejada a Edge Config para lookup en el edge sin golpear Postgres por request.

---

## 3. Seguridad — RLS (Row Level Security) en TODAS las tablas

### 3.1 Roles

- **`anon`** — visitante sin sesión. Recibe la `anon key` (pública). **No lee** `leads`/`page_views`/`subscriptions`. Con la Decisión C recomendada, ni siquiera inserta directo: todo pasa por `service_role` server-side.
- **`authenticated` = cliente pyme** — entra por magic link; acceso limitado a su(s) tenant(s) vía `tenant_users`.
- **`admin` = tú (operador)** — no es un rol Postgres aparte: es `authenticated` con claim `role='admin'` en **`app_metadata`** del JWT (no `user_metadata`, que el usuario puede editar). Ves todo.
- **`service_role`** — bypassa RLS; **solo server-side** (render ISR, crons, ingesta de leads). Nunca en el bundle cliente ni en `NEXT_PUBLIC_*`.

### 3.2 Funciones helper

- `public.is_admin()` — lee el claim `app_metadata.role` (sin query). Fuente de verdad sincronizada desde `users.rol` vía **Custom Access Token Hook**.
- `public.current_tenant_ids()` — `SECURITY DEFINER`, devuelve los `tenant_id` de `auth.uid()` sin recursión.
- `public.has_tenant_access(uuid)` — `is_admin() OR target IN current_tenant_ids()`. Predicado central del aislamiento.
- `public.is_active_tenant(uuid)` — `SECURITY DEFINER`, verdadero si el tenant existe y está `activo`. Usado en los `WITH CHECK` de inserción.

### 3.3 Matriz de políticas (resumen)

| Tabla | anon | cliente (authenticated) | admin / service_role |
|---|---|---|---|
| `tenants` | — (lee la view `v_public_tenant` de solo activos, no la tabla base) | SELECT own | ALL |
| `tenant_domains` | — | SELECT own | ALL / read para sync Edge Config |
| `tenant_content` | SELECT si activo *(defensa en prof.)* | SELECT/UPDATE own | ALL |
| `tenant_content_versions` | — | SELECT own | write service_role |
| `tenant_theme` | SELECT si activo | SELECT/UPDATE own | ALL |
| `users` | — | SELECT self | ALL (rol nunca editable por el usuario) |
| `tenant_users` | — | SELECT self *(usa `auth.uid()` directo, anti-recursión)* | ALL |
| `leads` | INSERT `WITH CHECK` si activo *(o nada, con Dec. C)* | SELECT/UPDATE own (marcar atendido) | ALL |
| `page_views` | INSERT `WITH CHECK` si activo *(o nada, con Dec. C)* | — *(lee `page_view_daily`)* | ALL |
| `page_view_daily` | — | SELECT own | write service_role |
| `subscriptions` | — | SELECT own *(según Dec. F)* | ALL / cron |
| `payments` | — | SELECT own *(o admin-only)* | write cron |
| `monthly_reports` | — | SELECT own | write cron |
| `change_requests` | — | INSERT/SELECT own | ALL + UPDATE (respuesta) |
| `prospects` | INSERT *(vía server + Turnstile)* | — | SELECT/UPDATE/DELETE admin |
| `planes` | **SELECT público** (pricing) | SELECT | UPDATE admin |
| Storage `tenant-media` | SELECT público (imágenes) | write solo su carpeta `{tenant_id}/…` | service_role libre |

> Baseline: `ENABLE ROW LEVEL SECURITY` en todas; `REVOKE ALL` + `GRANT` mínimo por
> comando/columna; sin política = deny. Se evalúa `FORCE ROW LEVEL SECURITY`.

### 3.4 Riesgos y mitigaciones

- **Tenant suspendido y cache ISR:** el render resuelve el tenant con `service_role`, lee `estado` y decide (activo→landing, suspendido/moroso→**página de mantención**, onboarding→coming-soon, cancelado→404/redirect). Al suspender: **patch a Edge Config + `revalidateTag`** para que la mantención tome efecto en segundos, sin deploy.
- **Spam de leads/visitas:** Decisión C (service_role + Turnstile + rate-limit + honeypot).
- **Fuga de `service_role`:** = compromiso total → solo en env server de Vercel, rotar ante sospecha.
- **Escalada a admin:** el flag va en `app_metadata` (solo `service_role`/Admin API lo escribe), nunca en `user_metadata`.
- **Control por-campo:** RLS no filtra por campo; la edición del cliente pasa por **RPC con allowlist + Zod** (Decisión G) para no romper el schema ni tocar campos protegidos.
- **Storage:** un bucket público `tenant-media` con carpeta `{tenant_id}/…`; la policy valida `foldername[1]::uuid ∈ current_tenant_ids()`. Nada sensible en el bucket público (contratos/comprobantes → bucket privado aparte).

---

## 4. Diseño del `jsonb` de contenido

Un sobre común + bloques compartidos + bloques propios por plantilla, todo validado por
Zod y discriminado por `plantilla`.

### 4.1 Sobre (root)

```jsonc
{
  "schema_version": 1,              // versión del contrato (migración)
  "plantilla": "servicios",          // discriminante; debe coincidir con tenants.plantilla
  "locale": "es-CL",                // i18n-lite (reservado)
  "orden": ["hero","servicios",…],  // orden/visibilidad de secciones (drag&drop)
  "hero": {…}, "confianza": {…}, …   // bloques
}
```

### 4.2 Bloques compartidos (las 4 plantillas)

`hero` (título=H1, CTA principal obligatorio) · `confianza` (métricas/logos/badges) ·
`galeria` (≤12 imgs) · `testimonios` (autor, texto, rating) · `ubicacion`
(dirección, comuna, lat/lng → Schema.org) · `horarios` (por día, tramos, `cerrado`) ·
`redes` (→ `sameAs`) · `whatsapp` (número E.164 + mensaje prellenado; el clic se
registra como lead) · `seo` (title ≤60, description ≤160, og_image, `indexable`) ·
`formulario` (campos dinámicos; al enviar guarda lead + email Resend; captura UTM).

Tipos base reutilizables: `ImageRef {path, alt(oblig.), width, height, blurDataURL}`,
`CTA {label, tipo, destino}`, `Phone (E.164)`, `HHmm`, `Money (CLP int)`.

### 4.3 Bloques propios por plantilla

| Plantilla | Bloques extra |
|---|---|
| `servicios` | `servicios` (lista con `precio_desde`) |
| `gastronomia` | `menu` (categorías → items con precio; **pedido por WhatsApp** que arma el mensaje con los ítems) |
| `inmobiliaria` | `tipologias` (dorm/m²/precio/plano), `cotizador` (referencial: pie %, tasa, plazos), `form_corredora` (email + campos extra) |
| `retail` | `catalogo` (categorías → productos con precio/oferta/stock; **consulta por WhatsApp** por producto) |

*(El documento incluye un `example_json` completo por plantilla en el anexo del código
cuando implemente; aquí basta el contrato.)*

### 4.4 Estrategia Zod (TS estricto, sin `any`)

- Hojas → bloques (`z.object(...).strict()`, con `.min/.max` para calidad y presupuesto de performance) → **base** `zBaseContent` → cada plantilla `.extend({ plantilla: z.literal(...), <bloques propios> })` → `zTenantContent = z.discriminatedUnion('plantilla', [...])`.
- Tipos derivados con `z.infer` (el `Json` de Supabase se convierte a `TenantContent` **solo** al cruzar el borde con `parse`/`safeParse`).
- **Al guardar** (server action): `parse()`; si falla, se devuelven issues a React Hook Form y **no** se escribe. Se valida cruzado `content.plantilla === tenants.plantilla`. Luego `revalidateTag`.
- **Al renderizar:** `safeParse()` con **fallback resiliente** (última versión válida o landing mínima segura) → la página del cliente **nunca** se cae.
- Red de seguridad en BD: `CHECK` livianos (`jsonb_typeof='object'`, contiene `schema_version` y `plantilla`) + trigger que asegura coherencia con `tenants.plantilla`.

### 4.5 Versionado del contenido

`schema_version` dentro del `jsonb`. Cambios **aditivos** (campo opcional/default) no
suben versión; cambios **rompientes** sí. Se conservan schemas históricos + migradores
puros encadenados (`migrate_1_2`, …); `migrateContent(json)` lleva cualquier fila a la
versión actual. Aplicación **lazy** (al leer se normaliza en memoria; al guardar se
persiste migrado) + **backfill** idempotente por script. Con el fallback de `safeParse`,
una migración a medias nunca tumba landings.

---

## 5. Correcciones aplicadas al reconciliar los diseños

El pase de crítica encontró incoherencias entre los sub-diseños; ya están resueltas en
esta propuesta:

1. **Nombre único de columna de contenido:** `content_published` / `content_draft` (se descartan `data` / `content` / `content_publicado`).
2. **Rol:** columna `users.rol` (español) → se sincroniza a `app_metadata.role` del JWT vía Custom Access Token Hook.
3. **Tabla del funnel:** `prospects` (unificada; se descarta `prospectos`).
4. **Convención de Storage:** siempre `{tenant_id}/archivo.webp` para que la policy `foldername[1]::uuid` valide; los `ImageRef.path` del `jsonb` la respetan.
5. **RLS completo:** se agregaron las políticas que faltaban para `tenant_domains`, `tenant_content_versions`, `page_view_daily`, `payments`, `change_requests` y `planes`.
6. **Alta < 15 min:** `confianza`/`galeria`/`testimonios` pasan a **opcionales** en Zod y habrá **seed por plantilla** (`plantilla_defaults`) para que un cliente sin fotos/reseñas pueda publicar igual.
7. **Estados de render completos:** `onboarding`→coming-soon y `cancelado`→404/redirect, además de activo/suspendido/moroso.
8. **Recharts** (panel/portal) **no** se bundlea en la landing pública (para sostener < 1,5 s y 95+ Lighthouse).

---

## 6. Preguntas abiertas (no bloquean; las resuelvo en la fase que corresponda)

- Legalidad de `visitor_hash` (IP+UA) bajo Ley 19.628 — ¿contamos únicos o solo visitas totales?
- Retención exacta del `page_views` raw (30/60/90 días) y nº de versiones de contenido a conservar.
- ¿Multiusuario real por tenant (equipos) o siempre 1 propietario?
- ¿UF en vivo (CMF) para inmobiliaria o valor estático con su moneda?
- Rendering y cache del sitio comercial `midominio.cl` (módulo 5) — se define en su fase.
- ¿`audit_log` de acciones de admin? ¿Soft-delete vs. borrado físico?

---

## 7. Qué construyo apenas apruebes (resto de Fase 1)

1. Scaffold Next.js 15 (App Router) + TS estricto + Tailwind v4 + estructura de carpetas.
2. Migraciones SQL: extensiones, enums, tablas, índices, triggers, **RLS + helpers**, buckets de Storage, seed de `planes` y `plantilla_defaults`.
3. `middleware.ts` multi-tenant (lookup host→tenant vía Edge Config, decisión de render por estado).
4. Clientes de Supabase (anon server/cliente, `service_role` server-only) tipados.
5. `.env.example` documentado + README con despliegue y **alta de cliente nuevo**.
6. Test base de Playwright para resolución de tenant por dominio.

Luego **me detengo** para tu aprobación antes de la Fase 2 (motor de landings + plantilla `servicios`).
