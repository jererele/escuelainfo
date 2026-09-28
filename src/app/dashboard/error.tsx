"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import EscuelaInfoLogo from "@/components/shared/EscuelaInfoLogo";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[EscuelaInfo Dashboard Error]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="card glass max-w-md w-full p-6 sm:p-8 rounded-[32px] border border-[var(--border)] shadow-2xl text-center space-y-5 animate-zoom-in">
        <div className="flex flex-col items-center">
          <EscuelaInfoLogo size={46} />
          <h2 className="text-xl font-black title-font mt-2">Error en el Panel de Control</h2>
          <p className="text-xs text-[var(--text2)] mt-1">
            Se produjo un inconveniente al renderizar la sección activa. Tus datos y sesión están seguros.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] text-xs font-semibold flex items-center gap-2 text-left">
          <AlertTriangle size={18} className="shrink-0" />
          <span className="truncate">{error.message || "Error al procesar la vista"}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 min-h-[42px] px-4 py-2.5 rounded-xl bg-[var(--verde)] text-black text-xs font-black hover:brightness-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            <span>Reintentar Sección</span>
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = "/dashboard"; }}
            className="flex-1 min-h-[42px] px-4 py-2.5 rounded-xl bg-[var(--bg3)] text-[var(--text)] border border-[var(--border)] text-xs font-bold hover:bg-[var(--bg2)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LayoutDashboard size={14} />
            <span>Ir al Inicio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
