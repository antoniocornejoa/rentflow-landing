/**
 * Verifica que la request venga del Vercel Cron (o de un llamado autorizado).
 * Vercel añade `Authorization: Bearer $CRON_SECRET` cuando CRON_SECRET está en env.
 * Si no hay CRON_SECRET configurado, se rechaza (fail-safe).
 */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
