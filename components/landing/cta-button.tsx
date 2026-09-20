import type { CTA } from "@/lib/content/schema";
import { WhatsAppLink } from "@/components/landing/whatsapp-link";

export interface CtaContext {
  tenantId?: string;
  whatsappNumero: string;
  whatsappMensaje: string;
  demo?: boolean;
}

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition-transform active:scale-[0.98]";

const variantClass: Record<"primario" | "secundario", string> = {
  primario: "bg-[var(--brand)] text-white shadow-sm hover:opacity-90",
  secundario: "border border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)]/5",
};

/** Renderiza un CTA resolviendo su destino (whatsapp/tel/ancla/url/formulario). */
export function CtaButton({
  cta,
  ctx,
  variant = "primario",
}: {
  cta: CTA;
  ctx: CtaContext;
  variant?: "primario" | "secundario";
}) {
  const cls = `${baseClass} ${variantClass[variant]}`;

  if (cta.tipo === "whatsapp") {
    return (
      <WhatsAppLink
        tenantId={ctx.tenantId}
        numero={ctx.whatsappNumero}
        mensaje={ctx.whatsappMensaje}
        demo={ctx.demo}
        className={cls}
      >
        {cta.label}
      </WhatsAppLink>
    );
  }

  const href =
    cta.tipo === "telefono"
      ? `tel:${cta.destino === "default" ? ctx.whatsappNumero : cta.destino}`
      : cta.tipo === "formulario"
        ? "#contacto"
        : cta.destino; // ancla (#...) o url (https...)

  const external = cta.tipo === "url";
  return (
    <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {cta.label}
    </a>
  );
}
