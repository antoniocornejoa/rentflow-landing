"use client";

import { useState, useTransition } from "react";
import { saveContent } from "@/app/(platform)/panel/tenants/actions";
import type { Plantilla } from "@/lib/content/schema";

export function ContentEditor({
  tenantId,
  plantilla,
  initial,
}: {
  tenantId: string;
  plantilla: Plantilla;
  initial: unknown;
}) {
  const [json, setJson] = useState(JSON.stringify(initial ?? {}, null, 2));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [pending, start] = useTransition();

  function onSave() {
    setMsg(null);
    start(async () => {
      const r = await saveContent(tenantId, plantilla, json);
      if (r.ok) {
        setMsg({ ok: true, text: "Publicado ✓" });
        setPreviewKey((k) => k + 1);
      } else {
        setMsg({ ok: false, text: r.error ?? "Error" });
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Contenido (JSON, plantilla {plantilla})</h3>
          <button
            onClick={onSave}
            disabled={pending}
            className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar y publicar"}
          </button>
        </div>
        {msg ? <p className={`text-sm ${msg.ok ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</p> : null}
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          spellCheck={false}
          className="h-[70vh] w-full rounded-xl border border-black/10 bg-slate-950 p-4 font-mono text-xs text-slate-100 outline-none"
        />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">Vista previa</h3>
        <iframe
          key={previewKey}
          src={`/tenants/${tenantId}/preview`}
          title="Vista previa"
          className="h-[70vh] w-full rounded-xl border border-black/10 bg-white"
        />
      </div>
    </div>
  );
}
