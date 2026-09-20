import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PLANTILLAS, getSampleContent } from "@/lib/content/samples";
import type { Plantilla } from "@/lib/content/schema";
import { TenantLanding } from "@/components/landing/tenant-landing";

export const dynamicParams = false;

export function generateStaticParams() {
  return PLANTILLAS.map((plantilla) => ({ plantilla }));
}

const NOMBRES: Record<Plantilla, string> = {
  servicios: "Taller Los Andes",
  gastronomia: "Café Central Talca",
  inmobiliaria: "Mirador del Maule",
  retail: "Distribuidora El Roble",
};

function isPlantilla(x: string): x is Plantilla {
  return (PLANTILLAS as string[]).includes(x);
}

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function DemoPage({ params }: { params: Promise<{ plantilla: string }> }) {
  const { plantilla } = await params;
  if (!isPlantilla(plantilla)) notFound();
  const content = getSampleContent(plantilla);
  if (!content) notFound();

  return (
    <>
      <div className="bg-[var(--brand,#0f766e)] px-4 py-2 text-center text-sm text-white">
        Demo de la plantilla <strong>{plantilla}</strong> · contenido de ejemplo ·{" "}
        <Link href="/demo" className="underline">
          ver otras plantillas
        </Link>
      </div>
      <TenantLanding content={content} nombreNegocio={NOMBRES[plantilla]} demo />
    </>
  );
}
