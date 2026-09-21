import type { ReactNode } from "react";
import { Sora } from "next/font/google";

// Fuente display solo para el sitio comercial (titulares). Cuerpo = system stack.
const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <div className={sora.variable}>{children}</div>;
}
