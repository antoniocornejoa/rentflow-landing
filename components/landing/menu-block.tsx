import type { ContenidoGastronomia } from "@/lib/content/schema";
import { Section } from "@/components/landing/section";
import { WhatsAppLink } from "@/components/landing/whatsapp-link";
import type { CtaContext } from "@/components/landing/cta-button";
import { formatCLP } from "@/lib/format";

export function MenuBlock({ menu, ctx }: { menu: ContenidoGastronomia["menu"]; ctx: CtaContext }) {
  const pedido = menu.pedido_whatsapp;
  return (
    <Section id="menu" titulo="Nuestra carta">
      <div className="grid gap-8 md:grid-cols-2">
        {menu.categorias.map((cat, i) => (
          <div key={i}>
            <h3 className="mb-3 border-b border-black/10 pb-2 text-xl font-semibold">{cat.nombre}</h3>
            <ul className="divide-y divide-black/5">
              {cat.items.map((item, j) => {
                const base = pedido?.mensaje_plantilla ?? "Hola, quiero pedir:";
                const mensaje = pedido?.incluir_items === false ? base : `${base} ${item.nombre}`;
                return (
                  <li key={j} className="flex items-start justify-between gap-4 py-3">
                    <div>
                      <p className="font-medium">
                        {item.nombre}
                        {item.etiquetas?.includes("destacado") ? (
                          <span className="ml-2 rounded bg-[var(--brand)]/10 px-2 py-0.5 text-xs text-[var(--brand)]">
                            Destacado
                          </span>
                        ) : null}
                        {item.disponible === false ? (
                          <span className="ml-2 text-xs text-[var(--muted)]">(no disponible)</span>
                        ) : null}
                      </p>
                      {item.descripcion ? <p className="text-sm text-[var(--muted)]">{item.descripcion}</p> : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-semibold">{formatCLP(item.precio)}</span>
                      {pedido?.activo && item.disponible !== false ? (
                        <WhatsAppLink
                          tenantId={ctx.tenantId}
                          numero={ctx.whatsappNumero}
                          mensaje={mensaje}
                          demo={ctx.demo}
                          className="text-xs font-medium text-[#25D366]"
                        >
                          Pedir
                        </WhatsAppLink>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
