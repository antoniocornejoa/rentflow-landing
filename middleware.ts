import { NextResponse, type NextRequest } from "next/server";
import { classifyHost } from "@/lib/domains";
import { refreshSession } from "@/lib/supabase/middleware-session";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

/**
 * Ruteo multi-tenant por host. NO toca la base de datos (rápido en el edge):
 * solo reescribe la URL hacia la rama interna correcta. La resolución del
 * tenant (con cache/ISR) ocurre dentro de la ruta /_sites/[domain].
 *
 *   {root} / www.{root}  -> sitio comercial            (rutas raíz)
 *   app.{root}           -> panel + portal             (reescribe a /panel/*)
 *   otro host            -> landing del tenant          (reescribe a /sites/{host}/*)
 */
export async function middleware(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Las rutas de API se sirven igual en cualquier host (health, ingesta, crons).
  if (path.startsWith("/api")) return NextResponse.next();

  // Nadie accede directo a las ramas internas del ruteo. Comparación por
  // segmento exacto para no bloquear rutas legítimas como /paneles-solares.
  if (
    path === "/sites" ||
    path.startsWith("/sites/") ||
    path === "/panel" ||
    path.startsWith("/panel/")
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { kind, host } = classifyHost(req.headers.get("host"), ROOT_DOMAIN);

  if (kind === "marketing") {
    return NextResponse.next();
  }

  if (kind === "platform") {
    url.pathname = `/panel${path === "/" ? "" : path}`;
    const res = NextResponse.rewrite(url);
    // Refresca la sesión de Supabase (panel + portal usan magic link).
    await refreshSession(req, res);
    return res;
  }

  // tenant
  url.pathname = `/sites/${encodeURIComponent(host)}${path === "/" ? "" : path}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Ejecuta en todo, excepto estáticos de Next y archivos con extensión.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[\\w]+$).*)"],
};
