"use client";

import React, { useState } from "react";
import { ShieldAlert, Users, Calendar, ArrowRight, CheckCircle2, X } from "lucide-react";
import { UserProfile, Ausencia } from "@/lib/dataService";
import UserAvatar from "@/components/ui/UserAvatar";

interface PreceptorCoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  ausencia: Ausencia | null;
  cursosAfectados: string[];
  preceptores: UserProfile[];
  onConfirmCoverage: (selectedPreceptores: UserProfile[]) => Promise<void>;
}

export default function PreceptorCoverageModal({
  isOpen,
  onClose,
  ausencia,
  cursosAfectados,
  preceptores,
  onConfirmCoverage,
}: PreceptorCoverageModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !ausencia) return null;

  // Filtrar para no seleccionarse a sí mismo como cubridor
  const availablePreceptores = preceptores.filter(p => {
    const isSameId = ausencia.profId && (String(p.uid) === String(ausencia.profId) || String(p.id) === String(ausencia.profId));
    const isSameName = p.nombre && p.nombre.trim().toLowerCase() === (ausencia.profNombre || "").trim().toLowerCase();
    return !isSameId && !isSameName;
  });

  const togglePreceptor = (id: string) => {
    setError("");
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) {
      setError("Por favor, seleccioná al menos un preceptor para cubrir la licencia.");
      return;
    }

    const selectedUsers = availablePreceptores.filter(p => 
      selectedIds.includes(String(p.uid || p.id || p.email))
    );

    setIsSubmitting(true);
    try {
      await onConfirmCoverage(selectedUsers);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al asignar la cobertura.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOneDay = ausencia.inicio === ausencia.fin;
  const fechaTexto = isOneDay ? ausencia.inicio : `${ausencia.inicio} al ${ausencia.fin}`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="card glass relative w-full max-w-lg rounded-[28px] border border-[var(--azul-border)] bg-[var(--bg2)]/95 shadow-2xl p-6 sm:p-7 space-y-5 overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--azul-bg)] border border-[var(--azul-border)] flex items-center justify-center text-[var(--azul)] shrink-0 shadow-inner">
              <ShieldAlert size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--azul)] block">
                Equipo Directivo · Cobertura Requerida
              </span>
              <h2 className="title-font font-black text-lg sm:text-xl text-[var(--text)]">
                Licencia de Preceptor Aprobada
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Información de la licencia aprobada */}
        <div className="p-4 rounded-2xl bg-[var(--bg3)]/60 border border-[var(--border)] space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--text2)]">Preceptor Titular:</span>
            <span className="font-black text-[var(--text)]">{ausencia.profNombre}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--text2)]">Período de Licencia:</span>
            <span className="font-mono font-bold text-[var(--verde)] flex items-center gap-1.5">
              <Calendar size={13} />
              {fechaTexto}
            </span>
          </div>
          <div>
            <span className="font-bold text-[var(--text2)] block mb-1">Cursos que quedan sin cobertura:</span>
            <div className="flex flex-wrap gap-1.5">
              {cursosAfectados.length > 0 ? (
                cursosAfectados.map(c => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold text-[11px]"
                  >
                    {c}
                  </span>
                ))
              ) : (
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[11px]">
                  Turno Completo de Preceptoría
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Selección de preceptores para cubrir */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
              <Users size={14} className="text-[var(--azul)]" />
              <span>Seleccionar Preceptor(es) de Cobertura:</span>
            </label>
            <span className="text-[10px] text-[var(--text3)] font-bold">
              {selectedIds.length} seleccionado(s)
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {availablePreceptores.length === 0 ? (
              <p className="text-xs text-[var(--text3)] italic py-3 text-center">
                No hay otros preceptores activos registrados en el sistema.
              </p>
            ) : (
              availablePreceptores.map((p) => {
                const pId = String(p.uid || p.id || p.email);
                const isSelected = selectedIds.includes(pId);
                return (
                  <div
                    key={pId}
                    onClick={() => togglePreceptor(pId)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-[var(--azul-bg)] border-[var(--azul)] text-[var(--text)] shadow-sm"
                        : "bg-[var(--bg3)]/30 border-[var(--border)] hover:bg-[var(--bg3)]/60 text-[var(--text2)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={p.nombre} size={28} showRing={false} />
                      <div>
                        <div className="font-bold text-xs text-[var(--text)]">{p.nombre}</div>
                        <div className="text-[10px] text-[var(--text3)]">
                          {p.cursos && p.cursos.length > 0 ? `A cargo: ${p.cursos.join(", ")}` : p.email}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-[var(--azul)] border-[var(--azul)] text-black"
                          : "border-[var(--border)] bg-transparent"
                      }`}
                    >
                      {isSelected && <CheckCircle2 size={13} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <p className="text-[10px] text-[var(--text3)] leading-relaxed">
            Al confirmar, se enviará una notificación instantánea y un correo institucional formal a los preceptores elegidos informándoles los cursos asignados a su cargo.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text2)] hover:bg-[var(--bg3)] transition-colors cursor-pointer"
          >
            Omitir por ahora
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || selectedIds.length === 0}
            className="px-5 py-2.5 rounded-xl bg-[var(--azul)] hover:brightness-110 text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <span>Asignando cobertura...</span>
            ) : (
              <>
                <span>Notificar y Asignar</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
