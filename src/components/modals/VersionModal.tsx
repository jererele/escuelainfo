"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Calendar, Clock, CheckCircle2, History, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { APP_VERSION, APP_BUILD_DATE, APP_RELEASE_NOTES, APP_VERSION_HISTORY } from "@/lib/version";

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VersionModal({ isOpen, onClose }: VersionModalProps) {
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({
    [APP_VERSION_HISTORY[0]?.version || ""]: true,
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleVersionExpand = (ver: string) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [ver]: !prev[ver],
    }));
  };

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--bg)] w-full max-w-xl rounded-[32px] border border-[var(--border)] shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] bg-[var(--bg2)] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] shadow-sm">
              <Sparkles size={24} />
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
                Centro de Versiones y Registro de Cambios
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

        {/* Tab Selector */}
        <div className="px-6 pt-4 pb-2 border-b border-[var(--border)] bg-[var(--bg)] flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("current")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === "current"
                ? "bg-[var(--verde)] text-black shadow-sm"
                : "bg-[var(--bg2)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)] border border-[var(--border)]"
            }`}
          >
            <Layers size={15} />
            Versión Actual ({APP_VERSION})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-[var(--verde)] text-black shadow-sm"
                : "bg-[var(--bg2)] text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)] border border-[var(--border)]"
            }`}
          >
            <History size={15} />
            Historial de Versiones ({APP_VERSION_HISTORY.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === "current" ? (
            <div className="space-y-6 animate-fade-in">
              {/* Metadata timestamp */}
              <div className="p-4 rounded-2xl bg-[var(--bg3)] border border-[var(--border)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text2)]">
                  <Calendar size={15} className="text-[var(--verde)] shrink-0" />
                  <span>Última Actualización:</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] rounded-xl font-mono text-xs font-black">
                  <Clock size={13} />
                  <span>{APP_BUILD_DATE}</span>
                </div>
              </div>

              {/* List of current changes */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text3)] mb-3">
                  Novedades introducidas en esta versión
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
          ) : (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text3)] mb-3">
                Histórico de Actualizaciones Anteriores
              </h4>
              <div className="space-y-3">
                {APP_VERSION_HISTORY.map((item) => {
                  const isExpanded = !!expandedVersions[item.version];
                  return (
                    <div
                      key={item.version}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)] overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => toggleVersionExpand(item.version)}
                        className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[var(--bg3)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-[var(--bg3)] text-[var(--text)] border border-[var(--border)]">
                            {item.version}
                          </span>
                          <span className="text-xs text-[var(--text2)] font-medium flex items-center gap-1.5">
                            <Calendar size={13} className="text-[var(--text3)]" />
                            {item.date}
                          </span>
                        </div>
                        <div className="text-[var(--text3)]">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 pt-1 border-t border-[var(--border)] bg-[var(--bg)]/40 space-y-2.5">
                          {item.notes.map((pastNote, nIdx) => (
                            <div key={nIdx} className="flex items-start gap-2.5 text-xs text-[var(--text2)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--verde)] shrink-0 mt-1.5" />
                              <span className="leading-relaxed">{pastNote}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg2)] flex justify-between items-center shrink-0">
          <p className="text-[11px] text-[var(--text3)] font-medium">
            Escuela 713 &quot;Juan Abdala Chayep&quot;
          </p>
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
