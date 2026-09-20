"use client";

import { useEffect, useRef } from "react";

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
    },
  ) => string;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

/**
 * Widget de Cloudflare Turnstile. Solo se renderiza si NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * está configurada; si no, no muestra nada (y el servidor tampoco exige token).
 */
export function TurnstileWidget({ onToken }: { onToken: (token: string | null) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (!siteKey || !ref.current || rendered.current) return;

    function doRender() {
      if (!window.turnstile || !ref.current || rendered.current) return;
      rendered.current = true;
      window.turnstile.render(ref.current, {
        sitekey: siteKey!,
        callback: (token) => onToken(token),
        "error-callback": () => onToken(null),
        "expired-callback": () => onToken(null),
      });
    }

    if (window.turnstile) {
      doRender();
    } else if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onload = doRender;
      document.head.appendChild(s);
    } else {
      document.getElementById(SCRIPT_ID)?.addEventListener("load", doRender);
    }
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return <div ref={ref} className="my-1" />;
}
