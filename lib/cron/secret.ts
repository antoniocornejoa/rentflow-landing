import { timingSafeEqual } from "node:crypto";

/**
 * Verifica que la request venga del Vercel Cron (o de un llamado autorizado).
 * Vercel añade `Authorization: Bearer $CRON_SECRET` cuando CRON_SECRET está en env.
 * Si no hay CRON_SECRET configurado, se rechaza (fail-safe). Comparación
 * constant-time para no filtrar el secreto por temporización.
 */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const provided = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}
