"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  ShieldAlert, 
  Calendar, 
  Building2, 
  Check, 
  Loader2, 
  AlertTriangle,
  Info,
  Megaphone
} from "lucide-react";
import { AvisoParo, crearAvisoParo } from "@/lib/dataService";

interface NewStrikeNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nuevoAviso: AvisoParo) => void;
  operatorEmail: string;
  operatorNombre: string;
  operatorRole: string;
  schoolId?: string;
  schoolNombre?: string;
}

const COMMON_UNIONS = [
  "ATECh",
  "CTERA",
  "SADOP",
  "ATE",
  "UDA",
  "Medida Gremial Provincial",
  "Paro Nacional Docente"
];

export default function NewStrikeNoticeModal({
  isOpen,
  onClose,
  onSuccess,
  operatorEmail,
  operatorNombre,
  operatorRole,
  schoolId,
  schoolNombre
}: NewStrikeNoticeModalProps) {
  const todayStr = new Date().toLocaleDateString("en-CA");
  const [fechaInicio, setFechaInicio] = useState(todayStr);
  const [fechaFin, setFechaFin] = useState(todayStr);
  const [gremio, setGremio] = useState("ATECh");
  const [motivo, setMotivo] = useState("Medida de fuerza gremial de 24 horas");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFechaInicio(new Date().toLocaleDateString("en-CA"));
      setFechaFin(new Date().toLocaleDateString("en-CA"));
      setGremio("ATECh");
      setMotivo("Medida de fuerza gremial de 24 horas");
      setDescripcion("");
      setErrorMsg("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaInicio) {
      setErrorMsg("Debe especificar la fecha de inicio del paro.");
      return;
    }
    if (fechaFin && fechaFin < fechaInicio) {
      setErrorMsg("La fecha de finalización no puede ser anterior al inicio.");
      return;
    }
    if (!motivo.trim()) {
      setErrorMsg("Debe indicar el motivo de la medida de fuerza.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const nuevoAviso = await crearAvisoParo({
        fechaInicio,
        fechaFin: fechaFin || fechaInicio,
        gremio: gremio.trim() || "Gremial",
        motivo: motivo.trim(),
        descripcion: descripcion.trim(),
        activo: true,
        creadoPor: operatorEmail,
        creadoPorNombre: operatorNombre,
        creadoPorRol: operatorRole,
        schoolId: schoolId || ""
      });

      onSuccess(nuevoAviso);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al emitir el aviso oficial de paro.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={() => { if (!loading) onClose(); }}
    >
      <div 
        className="w-full max-w-lg bg-[var(--bg)] border border-[var(--border)] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <div className="p-4 sm:p-6 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg2)]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--rojo-bg)] border border-[var(--rojo-border)] flex items-center justify-center text-[var(--rojo)] shadow-inner">
              <Megaphone size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[var(--text)] tracking-tight flex items-center gap-2">
                <span>Emitir Aviso Oficial de Paro</span>
              </h3>
              <p className="text-xs text-[var(--text3)]">
                Habilita a los profesores a registrar su adhesión voluntaria a la medida de fuerza.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-xl bg-[var(--bg3)] hover:bg-[var(--rojo-bg)] hover:text-[var(--rojo)] flex items-center justify-center text-[var(--text3)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* CONTENIDO FORM */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] rounded-xl text-xs text-[var(--rojo)] flex items-center gap-2 font-medium">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {schoolNombre && (
            <div className="p-2.5 rounded-xl bg-[var(--bg3)] border border-[var(--border)] text-xs flex items-center gap-2 text-[var(--text2)]">
              <Building2 size={14} className="text-[var(--verde)] shrink-0" />
              <span className="truncate">Institución: <strong>{schoolNombre}</strong></span>
            </div>
          )}

          {/* FECHAS DE LA MEDIDA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                <Calendar size={13} className="text-[var(--rojo)]" />
                Fecha Inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  if (fechaFin < e.target.value) setFechaFin(e.target.value);
                }}
                className="w-full bg-[var(--bg3)] border border-[var(--border)] focus:border-[var(--rojo)] rounded-xl py-2 px-3 text-xs outline-none font-semibold text-[var(--text)]"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                <Calendar size={13} className="text-[var(--rojo)]" />
                Fecha Fin
              </label>
              <input
                type="date"
                value={fechaFin}
                min={fechaInicio}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-[var(--bg3)] border border-[var(--border)] focus:border-[var(--rojo)] rounded-xl py-2 px-3 text-xs outline-none font-semibold text-[var(--text)]"
                required
              />
            </div>
          </div>

          {/* GREMIO / CONVOCANTE */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text)]">
              Gremio o Entidad Convocante
            </label>
            <input
              type="text"
              value={gremio}
              onChange={(e) => setGremio(e.target.value)}
              placeholder="Ej: ATECh, CTERA, SADOP, etc."
              className="w-full bg-[var(--bg3)] border border-[var(--border)] focus:border-[var(--rojo)] rounded-xl py-2.5 px-3 text-xs outline-none font-semibold text-[var(--text)]"
              required
            />
            {/* Botones sugeridos */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_UNIONS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setGremio(u)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    gremio === u
                      ? "bg-[var(--rojo)] text-white shadow-xs"
                      : "bg-[var(--bg3)] text-[var(--text3)] hover:text-[var(--text)] border border-[var(--border)]"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* MOTIVO */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text)]">
              Motivo o Carácter de la Medida
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Paro docente provincial de 24 hs por reclamo salarial"
              className="w-full bg-[var(--bg3)] border border-[var(--border)] focus:border-[var(--rojo)] rounded-xl py-2.5 px-3 text-xs outline-none font-medium text-[var(--text)]"
              required
            />
          </div>

          {/* DESCRIPCIÓN U OBSERVACIONES */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[var(--text)] flex items-center justify-between">
              <span>Observaciones / Alcance (Opcional)</span>
              <span className="text-[10px] text-[var(--text3)] font-normal">Aparecerá en el comunicado</span>
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Ej: Afecta a todos los turnos. Los docentes que asistan dictarán clases con normalidad."
              className="w-full bg-[var(--bg3)] border border-[var(--border)] focus:border-[var(--rojo)] rounded-xl py-2 px-3 text-xs outline-none font-medium text-[var(--text)] resize-none"
            />
          </div>

          {/* MENSAJE EXPLICATIVO */}
          <div className="p-3 bg-[var(--rojo-bg)]/50 border border-[var(--rojo-border)] rounded-2xl flex items-start gap-2.5 text-xs text-[var(--text2)]">
            <Info size={16} className="text-[var(--rojo)] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-[var(--text)] font-bold">Efecto Inmediato:</strong> Al confirmar, se habilitará la opción para que los profesores y preceptores puedan marcar su adhesión con un solo clic. Sus materias pasarán automáticamente a figurar como Hora Libre en el horario institucional.
            </div>
          </div>

          {/* PIE DE ACCIONES */}
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text2)] hover:bg-[var(--bg3)] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--rojo)] text-white font-black text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Publicando Aviso...</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={14} strokeWidth={2.5} />
                  <span>Publicar Aviso de Paro</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
