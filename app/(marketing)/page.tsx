import type { Metadata } from "next";
import Link from "next/link";
import { getPlanes } from "@/lib/marketing/planes";
import { formatCLP } from "@/lib/format";
import { ProspectForm } from "@/components/marketing/prospect-form";
import { PhoneMock, BrowserMock } from "@/components/marketing/mocks";
import {
  CheckCircle, Bolt, Clock, Search, Chat, Shield, Wallet, Unlock, Layers,
  ArrowRight, Chevron, Whatsapp, Stars,
} from "@/components/marketing/icons";

export const metadata: Metadata = {
  title: "RentFlow — Que tu negocio suene el teléfono este mes",
  description:
    "Landing pages en arriendo para pymes de Talca. Una página profesional que convierte visitas en contactos por WhatsApp. Plan mensual, todo incluido, lista en pocos días.",
};

const CTA_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#0f766e] to-[#10b981] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-teal-900/10 transition-transform active:scale-[0.98]";
const CTA_OUTLINE =
  "inline-flex items-center justify-center gap-2 rounded-full border border-[var(--brand)] px-6 py-3 text-base font-semibold text-[var(--brand)] transition-colors hover:bg-[var(--brand)]/5";

const RUBROS = [
  { id: "r-serv", panel: "serv", plantilla: "servicios" as const, label: "Taller", checked: true },
  { id: "r-gastro", panel: "gastro", plantilla: "gastronomia" as const, label: "Café", checked: false },
  { id: "r-inmo", panel: "inmo", plantilla: "inmobiliaria" as const, label: "Inmobiliaria", checked: false },
  { id: "r-retail", panel: "retail", plantilla: "retail" as const, label: "Tienda", checked: false },
];

const TRUST = [
  { icon: Clock, t: "Lista en 3–5 días" },
  { icon: Bolt, t: "Carga en menos de 1,5s" },
  { icon: Search, t: "Aparece en Google" },
  { icon: Chat, t: "Soporte por WhatsApp" },
];

const RESULTS = [
  { big: "3x", t: "más consultas que solo tener Facebook" },
  { big: "<1,5s", t: "en cargar, o la gente se va" },
  { big: "24/7", t: "recibiendo contactos, incluso cuando duermes" },
];

const DEMOS = [
  { slug: "servicios", t: "Servicios / Taller", d: "Agenda de mantenciones y frenos que llega directo a tu WhatsApp." },
  { slug: "gastronomia", t: "Gastronomía", d: "Carta, horarios y pedidos, siempre al día." },
  { slug: "inmobiliaria", t: "Inmobiliaria", d: "Tipologías y contactos calificados a la corredora." },
  { slug: "retail", t: "Tienda", d: "Catálogo con consulta por WhatsApp, sin comisiones de marketplace." },
] as const;

const STEPS = [
  { n: 1, icon: Chat, dia: "Día 1", t: "Nos cuentas de tu negocio", d: "Por WhatsApp, en 10 minutos. No necesitas tener nada listo." },
  { n: 2, icon: Layers, dia: "Día 2–4", t: "Armamos tu página", d: "Elegimos la plantilla de tu rubro y la dejamos con tu marca, fotos y textos, saliendo en Google." },
  { n: 3, icon: Whatsapp, dia: "Día 5", t: "Empiezas a recibir contactos", d: "Cada consulta te llega directo al WhatsApp. Tú solo respondes." },
];

const BENEFITS = [
  { icon: Wallet, t: "Cero costo para partir", d: "Empiezas con un plan mensual. Sin pagar desarrollo por adelantado." },
  { icon: Clock, t: "Lista en pocos días", d: "La tienes funcionando esta misma semana, no en meses." },
  { icon: Layers, t: "Todo incluido", d: "Hosting, dominio, actualizaciones y soporte en un solo pago." },
  { icon: Shield, t: "Siempre al día y segura", d: "La mantenemos actualizada, con respaldos. Tú no te preocupas de nada." },
  { icon: Bolt, t: "Rápida y sale en Google", d: "Carga en menos de 1,5s y está optimizada para que te encuentren." },
  { icon: Unlock, t: "Sin amarras", d: "Sin permanencia. La das de baja cuando quieras." },
];

const TESTIMONIALS = [
  { ini: "MR", nom: "M. Rojas", rubro: "Taller mecánico, Talca", txt: "Desde que tengo la página me escriben por WhatsApp casi todos los días." },
  { ini: "CF", nom: "C. Fuentes", rubro: "Café, Talca", txt: "Antes perdía los mensajes; ahora todo me llega ordenado." },
  { ini: "PD", nom: "P. Díaz", rubro: "Inmobiliaria, Talca", txt: "La corredora recibe contactos ya filtrados." },
];

const FAQ = [
  { q: "¿Necesito saber de computación?", a: "No. Nosotros hacemos todo: la diseñamos, la publicamos y la dejamos funcionando. Tú solo respondes los contactos que te llegan por WhatsApp." },
  { q: "¿La página es mía?", a: "Sí: es tu marca, tu dominio y tu contenido. Nosotros nos encargamos de la parte técnica (hosting, actualizaciones, respaldos y soporte) para que esté siempre al día, sin costos de desarrollo por adelantado." },
  { q: "¿No me convendría más tener mi propia página aparte?", a: "Es exactamente lo que tienes con RentFlow: una página profesional con tu marca y tu dominio, tuya, pero sin desembolsar nada para partir y sin quedar a cargo de la tecnología. Nosotros la mantenemos rápida, segura y saliendo en Google; tú te dedicas a tus clientes. Y si no te sirve, la das de baja sin permanencia." },
  { q: "¿Aparezco en Google?", a: "Sí. La dejamos optimizada para buscadores y pensada para que te encuentren en Talca y tu rubro." },
  { q: "¿Puedo cambiar textos o fotos después?", a: "Cuando quieras. Nos escribes por WhatsApp y lo actualizamos por ti; va incluido en tu plan." },
  { q: "¿Cuánto se demora en estar lista?", a: "En pocos días desde que nos pasas tus datos (normalmente 3 a 5 días hábiles)." },
  { q: "¿Y si un mes no puedo pagar o quiero darla de baja?", a: "Sin dramas y sin permanencia: nos avisas y la pausamos o la das de baja cuando quieras." },
];

export default async function MarketingHome() {
  const planes = await getPlanes();
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="font-display text-lg font-extrabold">RentFlow</span>
          <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] sm:flex">
            <a href="#como" className="hover:text-[var(--foreground)]">Cómo funciona</a>
            <a href="#planes" className="hover:text-[var(--foreground)]">Planes</a>
            <a href="#contacto" className="hover:text-[var(--foreground)]">Contacto</a>
          </nav>
          <a href="#contacto" className="rounded-full bg-gradient-to-br from-[#0f766e] to-[#10b981] px-4 py-2 text-sm font-semibold text-white">
            Quiero mi página
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#0f766e]/10 via-transparent to-[#10b981]/10" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <span className="w-fit rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
              Landing pages en arriendo · Talca, Chile
            </span>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl">
              Que tu negocio <span className="bg-gradient-to-br from-[#0f766e] to-[#10b981] bg-clip-text text-transparent">suene el teléfono</span> este mes
            </h1>
            <p className="max-w-xl text-pretty text-lg text-[var(--muted)]">
              Te armamos una página profesional que convierte visitas en contactos por WhatsApp. Sin pagar
              desarrollo: un plan mensual con todo incluido y lista en pocos días. Elige tu rubro y mira cómo
              se vería la tuya.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#contacto" className={CTA_PRIMARY}>Quiero recibir más contactos <ArrowRight width={18} height={18} /></a>
              <a href="#demos" className={CTA_OUTLINE}>Ver un ejemplo real</a>
            </div>
            <p className="text-sm text-[var(--muted)]">Sin tarjeta · Coordinamos por WhatsApp · Sin permanencia</p>
          </div>

          {/* Selector de rubro en vivo (CSS puro) */}
          <div className="rubro" aria-label="Elige tu rubro">
            <div className="flex flex-wrap justify-center gap-2">
              {RUBROS.map((r) => (
                <label
                  key={r.id}
                  className="cursor-pointer rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium transition-colors has-[:checked]:border-transparent has-[:checked]:bg-gradient-to-br has-[:checked]:from-[#0f766e] has-[:checked]:to-[#10b981] has-[:checked]:text-white"
                >
                  <input id={r.id} type="radio" name="rubro" defaultChecked={r.checked} className="sr-only" />
                  {r.label}
                </label>
              ))}
            </div>

            <div className="relative mx-auto mt-8 w-fit">
              {RUBROS.map((r) => (
                <div key={r.panel} data-panel={r.panel}>
                  <PhoneMock plantilla={r.plantilla} />
                </div>
              ))}
              <div className="anim-float absolute -right-3 top-10 max-w-[190px] rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 shadow-lg">
                <p className="text-[11px] font-semibold text-[var(--foreground)]">Nuevo contacto</p>
                <p className="text-[11px] text-[var(--muted)]">Juan quiere cotizar</p>
              </div>
              <div className="absolute -left-3 bottom-8 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-center shadow-lg">
                <p className="text-lg font-extrabold tabular-nums text-[var(--brand)]">+38</p>
                <p className="text-[10px] text-[var(--muted)]">contactos este mes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4">
          {TRUST.map((x, i) => (
            <div key={i} className="flex items-center justify-center gap-2 text-sm font-medium">
              <x.icon width={20} height={20} className="text-[var(--brand)]" />
              {x.t}
            </div>
          ))}
        </div>
      </section>

      {/* Resultados */}
      <Section id="resultados" eyebrow="Resultados" titulo="Lo que importa es que te contacten">
        <div className="grid gap-5 sm:grid-cols-3">
          {RESULTS.map((r, i) => (
            <div key={i} className="reveal rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
              <p className="font-display text-4xl font-extrabold tabular-nums text-[var(--brand)]">{r.big}</p>
              <p className="mt-2 text-[var(--muted)]">{r.t}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Cifras estimadas según buenas prácticas de landing pages; tus resultados dependen de tu rubro y difusión.
        </p>
      </Section>

      {/* Vitrina de plantillas */}
      <Section id="demos" eyebrow="Ejemplos por rubro" titulo="Mira cómo se vería la tuya" sub="Elige el punto de partida. Después la hacemos tuya.">
        <div className="grid gap-6 sm:grid-cols-2">
          {DEMOS.map((d) => (
            <Link key={d.slug} href={`/demo/${d.slug}`} className="reveal group rounded-3xl border border-[var(--border)] bg-[var(--background)] p-5 transition-all hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-lg">
              <BrowserMock plantilla={d.slug} />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{d.t}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{d.d}</p>
                </div>
                <span className="mt-1 shrink-0 text-sm font-medium text-[var(--brand)] opacity-0 transition-opacity group-hover:opacity-100">Ver demo →</span>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">Personalizamos colores, textos y fotos con lo tuyo. Esto es solo un ejemplo.</p>
      </Section>

      {/* Cómo funciona */}
      <Section id="como" eyebrow="Cómo funciona" titulo="Tenerla es más fácil de lo que crees" surface>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="reveal rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#10b981] text-white">
                <s.icon width={22} height={22} />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">{s.dia}</p>
              <h3 className="mt-1 text-lg font-semibold">{s.n}. {s.t}</h3>
              <p className="mt-1 text-[var(--muted)]">{s.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-[var(--muted)]">Nosotros mantenemos todo funcionando; tú te dedicas a lo tuyo.</p>
      </Section>

      {/* Todo incluido (reemplazo de la calculadora) */}
      <Section eyebrow="Sin letra chica" titulo="Todo incluido, sin invertir de entrada">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b, i) => (
            <div key={i} className="reveal flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <b.icon width={26} height={26} className="mt-0.5 shrink-0 text-[var(--brand)]" />
              <div>
                <h3 className="font-semibold">{b.t}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{b.d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-[var(--brand)]/20 bg-gradient-to-br from-[#0f766e]/5 to-[#10b981]/5 p-8 text-center">
          <p className="font-display text-3xl font-extrabold tabular-nums">desde $29.900/mes</p>
          <p className="mt-1 text-[var(--muted)]">Menos que un almuerzo a la semana — y tu negocio disponible 24/7 recibiendo contactos.</p>
          <a href="#planes" className={`${CTA_OUTLINE} mt-4`}>Ver planes</a>
        </div>
      </Section>

      {/* Planes */}
      <Section id="planes" eyebrow="Planes" titulo="Elige tu plan y parte" sub="Todos incluyen hosting, dominio, actualizaciones y soporte. Sin costo de instalación." surface>
        <div className="grid gap-6 md:grid-cols-3">
          {planes.map((p, i) => {
            const featured = i === 1;
            return (
              <div key={p.plan} className={`relative flex flex-col gap-4 rounded-3xl bg-[var(--background)] p-7 ${featured ? "border-2 border-[var(--brand)] shadow-lg sm:scale-[1.03]" : "border border-[var(--border)] shadow-sm"}`}>
                {featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3 py-0.5 text-xs font-semibold text-slate-900">Más elegido</span>
                ) : null}
                <h3 className="font-display text-xl font-bold">{p.nombre}</h3>
                <p className="font-display text-4xl font-extrabold tabular-nums">
                  {formatCLP(p.precio)}<span className="text-base font-normal text-[var(--muted)]">/mes</span>
                </p>
                {p.descripcion ? <p className="text-sm text-[var(--muted)]">{p.descripcion}</p> : null}
                <ul className="flex flex-col gap-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle width={18} height={18} className="mt-0.5 shrink-0 text-[var(--brand)]" /> {f}
                    </li>
                  ))}
                </ul>
                <a href="#contacto" className={`${featured ? CTA_PRIMARY : CTA_OUTLINE} mt-auto`}>Empezar a recibir contactos</a>
                <p className="text-center text-xs text-[var(--muted)]">Sin costo de instalación. Cancelas cuando quieras.</p>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">Cambias de plan cuando lo necesites.</p>
      </Section>

      {/* Testimonios */}
      <Section eyebrow="Testimonios ilustrativos" titulo="Dueños como tú">
        <div className="grid gap-5 sm:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <figure key={i} className="reveal flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <Stars n={5} />
              <blockquote className="text-pretty text-slate-700 dark:text-slate-200">“{t.txt}”</blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#10b981] text-sm font-bold text-white">{t.ini}</span>
                <span className="text-sm"><span className="font-medium">{t.nom}</span><br /><span className="text-[var(--muted)]">{t.rubro}</span></span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* Riesgo cero + urgencia */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-[#0f766e] to-[#10b981] p-10 text-center text-white">
          <h2 className="font-display text-3xl font-extrabold">Sin permanencia. Si no te sirve, la das de baja.</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">Tomamos pocos negocios nuevos por semana para cuidar la calidad. Aún hay cupos este mes.</p>
          <a href="#contacto" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-[var(--brand)]">Reservar mi cupo</a>
        </div>
      </section>

      {/* Contacto */}
      <Section id="contacto" titulo="Cuéntanos de tu negocio y te mostramos tu página" sub="Te respondemos por WhatsApp el mismo día hábil.">
        <div className="mx-auto max-w-xl">
          <ProspectForm />
          <p className="mt-4 text-center text-xs text-[var(--muted)]">Sin costo de entrada · Sin permanencia · Coordinamos por WhatsApp</p>
        </div>
      </Section>

      {/* FAQ */}
      <Section eyebrow="Preguntas frecuentes" titulo="Todo lo que quizás te preguntas" surface>
        <div className="mx-auto max-w-2xl divide-y divide-[var(--border)]">
          {FAQ.map((f, i) => (
            <details key={i} className="group py-4">
              <summary className="flex items-center justify-between gap-4 text-left font-medium">
                {f.q}
                <Chevron width={20} height={20} className="faq-chevron shrink-0 text-[var(--muted)] transition-transform" />
              </summary>
              <p className="mt-2 text-[var(--muted)]">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      <footer className="border-t border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--muted)]">
        <p className="font-display font-bold text-[var(--foreground)]">RentFlow</p>
        <p className="mt-1">Landing pages en arriendo · Talca, Chile · © 2026</p>
      </footer>
    </div>
  );
}

function Section({
  id, eyebrow, titulo, sub, surface, children,
}: {
  id?: string; eyebrow?: string; titulo: string; sub?: string; surface?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-16 px-4 py-16 sm:py-24 ${surface ? "bg-[var(--surface)]" : ""}`}>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand)]">{eyebrow}</p> : null}
          <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{titulo}</h2>
          {sub ? <p className="mt-3 text-lg text-[var(--muted)]">{sub}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}
