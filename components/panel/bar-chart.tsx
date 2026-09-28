"use client";

import dynamic from "next/dynamic";

interface Props {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color?: string;
}

// recharts pesa ~100 KB gzip. Se carga de forma diferida (chunk async, sin SSR)
// para que NO entre al First Load JS del panel: el gráfico está bajo el pliegue
// y ResponsiveContainer necesita medir el ancho en el cliente de todos modos.
const Impl = dynamic(() => import("./bar-chart-impl").then((m) => m.SimpleBarChart), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-black/5" />,
});

/** Gráfico de barras simple (una serie) para el panel/portal. Wrapper con carga diferida. */
export function SimpleBarChart(props: Props) {
  return <Impl {...props} />;
}
