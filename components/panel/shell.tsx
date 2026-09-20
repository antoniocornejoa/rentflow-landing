import type { ReactNode } from "react";
import Link from "next/link";
import type { AppUser } from "@/lib/auth";

/** Marco del panel/portal: header con navegación y cierre de sesión. */
export function PanelShell({
  user,
  children,
  nav,
}: {
  user: AppUser;
  children: ReactNode;
  nav?: { href: string; label: string }[];
}) {
  return (
    <div className="min-h-dvh bg-[var(--surface)]">
      <header className="border-b border-black/10 bg-[var(--bg)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="text-lg font-semibold">
            RentFlow{user.rol === "admin" ? " · Admin" : ""}
          </Link>
          <nav className="hidden items-center gap-4 text-sm sm:flex">
            {(nav ?? []).map((n) => (
              <Link key={n.href} href={n.href} className="text-slate-600 hover:text-slate-900">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[var(--muted)] sm:inline">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="rounded-full border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
