import type { ReactNode } from "react";
import type { TenantContent, CampoFormulario } from "@/lib/content/schema";
import { themeToCssVars, type TenantTheme } from "@/lib/theme";
import type { CtaContext } from "@/components/landing/cta-button";
import { Hero } from "@/components/landing/hero";
import { Confianza } from "@/components/landing/confianza";
import { Galeria } from "@/components/landing/galeria";
import { Testimonios } from "@/components/landing/testimonios";
import { UbicacionBlock } from "@/components/landing/ubicacion";
import { Footer } from "@/components/landing/footer";
import { WhatsAppFloat } from "@/components/landing/whatsapp-float";
import { ServiciosBlock } from "@/components/landing/servicios-block";
import { MenuBlock } from "@/components/landing/menu-block";
import { TipologiasBlock } from "@/components/landing/tipologias-block";
import { CotizadorBlock } from "@/components/landing/cotizador-block";
import { CatalogoBlock } from "@/components/landing/catalogo-block";
import { ContactForm } from "@/components/landing/contact-form";
import { Section } from "@/components/landing/section";
import { SchemaOrg } from "@/components/landing/schema-org";

const ORDEN_DEFAULT = [
  "confianza",
  "servicios",
  "menu",
  "tipologias",
  "catalogo",
  "galeria",
  "cotizador",
  "testimonios",
  "ubicacion",
];

export function TenantLanding({
  content,
  nombreNegocio,
  tenantId,
  theme,
  demo = false,
  url,
}: {
  content: TenantContent;
  nombreNegocio: string;
  tenantId?: string;
  theme?: TenantTheme | null;
  demo?: boolean;
  url?: string;
}) {
  const ctx: CtaContext = {
    tenantId,
    whatsappNumero: content.whatsapp.numero,
    whatsappMensaje: content.whatsapp.mensaje_prellenado,
    demo,
  };

  // Bloques disponibles (con narrowing por plantilla).
  const bloques: Record<string, ReactNode> = {};
  if (content.confianza) bloques.confianza = <Confianza confianza={content.confianza} />;
  if (content.galeria) bloques.galeria = <Galeria galeria={content.galeria} />;
  if (content.testimonios) bloques.testimonios = <Testimonios testimonios={content.testimonios} />;
  if (content.ubicacion) bloques.ubicacion = <UbicacionBlock ubicacion={content.ubicacion} />;

  let camposExtra: CampoFormulario[] = [];
  let extraForm: Record<string, string> | undefined;

  if (content.plantilla === "servicios") {
    bloques.servicios = <ServiciosBlock servicios={content.servicios} />;
  } else if (content.plantilla === "gastronomia") {
    bloques.menu = <MenuBlock menu={content.menu} ctx={ctx} />;
  } else if (content.plantilla === "inmobiliaria") {
    bloques.tipologias = <TipologiasBlock tipologias={content.tipologias} />;
    if (content.cotizador?.activo) bloques.cotizador = <CotizadorBlock cotizador={content.cotizador} />;
    if (content.form_corredora) {
      camposExtra = content.form_corredora.campos_extra;
      extraForm = { email_corredora: content.form_corredora.email_corredora };
    }
  } else if (content.plantilla === "retail") {
    bloques.catalogo = <CatalogoBlock catalogo={content.catalogo} ctx={ctx} />;
  }

  const orden = (content.orden && content.orden.length ? content.orden : ORDEN_DEFAULT).filter(
    (k, i, arr) => k in bloques && arr.indexOf(k) === i,
  );

  const campos = [...content.formulario.campos, ...camposExtra];

  return (
    <div style={themeToCssVars(theme)} className="bg-[var(--bg)] text-[var(--text)]">
      <SchemaOrg content={content} nombreNegocio={nombreNegocio} url={url} />
      <Hero hero={content.hero} ctx={ctx} />

      {orden.map((key) => (
        <div key={key}>{bloques[key]}</div>
      ))}

      <Section id="contacto" titulo={content.formulario.titulo ?? "Contáctanos"} surface>
        <div className="mx-auto max-w-xl">
          <ContactForm
            tenantId={tenantId}
            campos={campos}
            botonTexto={content.formulario.boton_texto}
            mensajeExito={content.formulario.mensaje_exito}
            consentimiento={content.formulario.consentimiento}
            demo={demo}
            extra={extraForm}
          />
        </div>
      </Section>

      <Footer
        nombre={nombreNegocio}
        horarios={content.horarios}
        redes={content.redes}
        ubicacion={content.ubicacion}
      />

      <WhatsAppFloat whatsapp={content.whatsapp} ctx={ctx} />
    </div>
  );
}
