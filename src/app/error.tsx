"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard, ArrowLeft } from "lucide-react";
import EscuelaInfoLogo from "@/components/shared/EscuelaInfoLogo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[EscuelaInfo Root Error]:", error);
  }, [error]);

  return (
    <main className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-transparent text-[var(--text)]">
      {/* Decorative ambient glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--rojo-bg)] rounded-full blur-[140px] pointer-events-none opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--amarillo-bg)] rounded-full blur-[140px] pointer-events-none opacity-50" />

      <div className="card glass max-w-lg w-full p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-[var(--border)] shadow-2xl text-center relative z-10 animate-zoom-in space-y-6">
        {/* Institutional Branding */}
        <div className="flex flex-col items-center">
          <div className="mb-3 shrink-0 transition-transform duration-300 hover:scale-105">
            <EscuelaInfoLogo size={56} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
            Escuela N° 713 &quot;Juan Abdala Chayep&quot;
          </div>
        </div>

        {/* Hero Alert */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-[var(--rojo-bg)] border border-[var(--rojo-border)] flex items-center justify-center shadow-inner relative">
            <AlertTriangle size={38} className="text-[var(--rojo)] animate-pulse" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black title-font tracking-tight text-[var(--text)]">
              Se produjo un error inesperado
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text2)] max-w-sm leading-relaxed">
              Ocurrió una interrupción temporal al cargar los recursos de esta sección. Podés intentar recargarla de inmediato.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:flex-1 min-h-[46px] flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[var(--verde)] text-black font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <RefreshCw size={15} strokeWidth={2.5} />
            <span>Reintentar</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:flex-1 min-h-[46px] flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[var(--bg3)] text-[var(--text)] border border-[var(--border)] font-bold text-xs uppercase tracking-wider hover:bg-[var(--bg2)] active:scale-95 transition-all cursor-pointer"
          >
            <LayoutDashboard size={15} strokeWidth={2.5} />
            <span>Volver al Panel</span>
          </Link>
        </div>

        {/* Support Note */}
        <p className="text-[10px] text-[var(--text3)] uppercase tracking-widest font-semibold pt-2">
          EscuelaInfo · Sistema Institucional Protegido
        </p>
      </div>
    </main>
  );
}
