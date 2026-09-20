import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

/**
 * Reescribe hacia `url` refrescando la sesión de Supabase (patrón oficial SSR):
 * las cookies renovadas se escriben en la respuesta Y se propagan al request
 * reenviado, para que el render del panel vea el token recién rotado y no rebote
 * al login. No-op de sesión si aún no hay credenciales configuradas.
 */
export async function rewriteWithSession(req: NextRequest, url: URL): Promise<NextResponse> {
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let res = NextResponse.rewrite(url, { request: req });
  if (!supaUrl || !anonKey) return res;

  try {
    const supabase = createServerClient(supaUrl, anonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.rewrite(url, { request: req });
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
  } catch {
    // Nunca romper el ruteo por un fallo de refresco de sesión.
  }
  return res;
}
