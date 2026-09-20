import type { NextConfig } from "next";

/**
 * Config única para TODOS los tenants (un solo proyecto Vercel).
 * El ruteo por dominio lo resuelve `middleware.ts`, no aquí.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    // Las imágenes viven en Supabase Storage y se sirven vía next/image (AVIF/WebP).
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "*.supabase.in", pathname: "/storage/v1/object/public/**" },
    ],
    // TTL alto: las imágenes de una landing cambian poco → menos transformaciones/egress.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
