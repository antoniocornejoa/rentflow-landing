/** Construye una URL de WhatsApp (wa.me) con mensaje prellenado. Función pura. */
export function buildWhatsappUrl(numero: string, mensaje: string): string {
  // wa.me usa el número sin '+' ni separadores.
  const digits = numero.replace(/[^\d]/g, "");
  const texto = encodeURIComponent(mensaje);
  return `https://wa.me/${digits}?text=${texto}`;
}
