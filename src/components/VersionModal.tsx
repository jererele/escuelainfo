"use client";

import { useEffect } from "react";
import { X, Sparkles, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { APP_VERSION, APP_BUILD_DATE, APP_RELEASE_NOTES } from "@/lib/version";

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VersionModal({ isOpen, onClose }: VersionModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--bg)] w-full max-w-lg rounded-[32px] border border-[var(--border)] shadow-2xl overflow-hidden animate-zoom-in">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] bg-[var(--bg2)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] shadow-sm">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-[var(--text)] text-lg leading-tight">
                  Escuela<span className="text-[var(--verde)]">Info</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)]">
                  {APP_VERSION}
                </span>
              </div>
              <p className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-wider mt-0.5">
                Novedades y Registro de Cambios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] hover:text-[var(--text)] transition-all cursor-pointer"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Metadata timestamp */}
          <div className="p-4 rounded-2xl bg-[var(--bg3)] border border-[var(--border)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text2)]">
              <Calendar size={15} className="text-[var(--verde)] shrink-0" />
              <span>Fecha y Hora de Cambio:</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] rounded-xl font-mono text-xs font-black">
              <Clock size={13} />
              <span>{APP_BUILD_DATE}</span>
            </div>
          </div>

          {/* List of changes */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text3)] mb-3">
              ¿Qué hay de nuevo en esta versión?
            </h4>
            <div className="space-y-3">
              {APP_RELEASE_NOTES.map((note, index) => (
                <div
                  key={index}
                  className="p-4 rounded-2xl bg-[var(--bg2)] border border-[var(--border)] flex items-start gap-3 hover:border-[var(--verde-border)] transition-colors"
                >
                  <CheckCircle2 size={18} className="text-[var(--verde)] shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-[var(--text)] leading-relaxed">
                    {note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg2)] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[var(--verde)] text-black font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
