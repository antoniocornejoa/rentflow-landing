/**
 * Construye la URL pública de una imagen del bucket `tenant-media` de Supabase
 * a partir de su path. next/image la sirve en AVIF/WebP.
 */
export function storageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const clean = path.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/tenant-media/${clean}`;
}
