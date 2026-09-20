import type { ContenidoRetail } from "@/lib/content/schema";
import { Section } from "@/components/landing/section";
import { Img } from "@/components/landing/img";
import { WhatsAppLink } from "@/components/landing/whatsapp-link";
import type { CtaContext } from "@/components/landing/cta-button";
import { formatCLP } from "@/lib/format";

const STOCK_LABEL: Record<string, string> = {
  disponible: "Disponible",
  bajo_pedido: "Bajo pedido",
  agotado: "Agotado",
};

export function CatalogoBlock({ catalogo, ctx }: { catalogo: ContenidoRetail["catalogo"]; ctx: CtaContext }) {
  const consulta = catalogo.consulta_whatsapp;
  return (
    <Section id="catalogo" titulo="Catálogo">
      <div className="flex flex-col gap-10">
        {catalogo.categorias.map((cat, i) => (
          <div key={i}>
            <h3 className="mb-4 text-xl font-semibold">{cat.nombre}</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {cat.items.map((p, j) => {
                const enOferta = typeof p.precio_oferta === "number";
                const baseMsg = consulta?.mensaje_plantilla ?? "Hola, consulto por:";
                const mensaje = consulta?.incluir_producto === false ? baseMsg : `${baseMsg} ${p.nombre}`;
                return (
                  <article key={j} className="flex flex-col gap-2 rounded-2xl border border-black/5 bg-[var(--bg)] p-4 shadow-sm">
                    {p.imagen ? (
                      <Img image={p.imagen} sizes="(max-width:640px) 50vw, 25vw" className="aspect-square w-full rounded-xl object-cover" />
                    ) : null}
                    <h4 className="text-sm font-medium leading-tight">{p.nombre}</h4>
                    {catalogo.mostrar_precios && typeof p.precio === "number" ? (
                      <p className="text-sm">
                        {enOferta ? (
                          <>
                            <span className="font-semibold text-[var(--brand)]">{formatCLP(p.precio_oferta!)}</span>{" "}
                            <span className="text-xs text-[var(--muted)] line-through">{formatCLP(p.precio)}</span>
                          </>
                        ) : (
                          <span className="font-semibold">{formatCLP(p.precio)}</span>
                        )}
                      </p>
                    ) : null}
                    <span className="text-xs text-[var(--muted)]">{STOCK_LABEL[p.stock] ?? p.stock}</span>
                    {consulta?.activo && p.stock !== "agotado" ? (
                      <WhatsAppLink
                        tenantId={ctx.tenantId}
                        numero={ctx.whatsappNumero}
                        mensaje={mensaje}
                        demo={ctx.demo}
                        className="mt-auto rounded-full bg-[#25D366] px-3 py-1.5 text-center text-xs font-semibold text-white"
                      >
                        Consultar
                      </WhatsAppLink>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
