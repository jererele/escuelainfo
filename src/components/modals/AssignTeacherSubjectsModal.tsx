"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, BookOpen, Check, AlertCircle } from "lucide-react";
import { updateProfesor, saveProfesor, logAction, Profesor } from "@/lib/dataService";
import { account } from "@/lib/appwrite";
import UserAvatar from "@/components/ui/UserAvatar";
import { PLAN_DE_ESTUDIOS } from "@/lib/curriculum";

interface AssignTeacherSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacher: {
    id?: string;
    nombre: string;
    email: string;
    dni?: string;
    materias: string[];
  } | null;
  suggestedMaterias?: string[];
  showToast?: (message: string, type?: "success" | "error") => void;
}

export default function AssignTeacherSubjectsModal({
  isOpen,
  onClose,
  onSuccess,
  teacher,
  suggestedMaterias = [],
  showToast,
}: AssignTeacherSubjectsModalProps) {
  const [materias, setMaterias] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloqueo de scroll en el fondo mientras el modal está abierto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !teacher) {
      setMaterias([]);
      setError("");
      return;
    }
    setMaterias(teacher.materias ? [...teacher.materias] : []);
    setError("");
  }, [isOpen, teacher]);

  // Escuchar tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !teacher) return null;

  const handleAdd = (subjectName: string) => {
    const nameToAdd = subjectName.trim();
    if (!nameToAdd) return;

    const lower = nameToAdd.toLowerCase();
    if (materias.some((m) => m.trim().toLowerCase() === lower)) {
      setError(`"${nameToAdd}" ya está en la lista de materias de este docente.`);
      return;
    }

    setMaterias((prev) => [...prev, nameToAdd]);
    setError("");
  };

  const handleRemove = (index: number) => {
    setMaterias((prev) => prev.filter((_, i) => i !== index));
    setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (teacher.id) {
        await updateProfesor(teacher.id, {
          materias,
        });
      } else {
        // Docente registrado en usuarios pero sin registro en profesores
        await saveProfesor({
          nombre: teacher.nombre,
          dni: teacher.dni || "",
          materias,
          email: teacher.email.toLowerCase().trim(),
        });
      }

      let userEmail = "desconocido";
      try {
        const u = await account.get();
        userEmail = u.email;
      } catch {
        /* silent */
      }

      await logAction(
        userEmail,
        "EDITAR_DOCENTE",
        `Materias asignadas a ${teacher.nombre}: ${materias.join(", ") || "Sin materias"}`
      );

      if (showToast) {
        showToast(`Materias de ${teacher.nombre} actualizadas con éxito`, "success");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError("No se pudieron guardar las materias. Verificá la conexión y volvé a intentar.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !teacher || !mounted || typeof document === "undefined" || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm transition-all duration-300 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--bg)] w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[90dvh] overflow-y-auto custom-scrollbar my-0 sm:my-auto">
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3.5">
            <UserAvatar name={teacher.nombre} email={teacher.email} size={48} showRing={true} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black title-font text-[var(--text)]">
                  Asignar Materias
                </h2>
              </div>
              <p className="text-xs text-[var(--text2)] font-semibold truncate max-w-[240px] sm:max-w-[280px]">
                {teacher.nombre} · <span className="font-normal text-[var(--text3)]">{teacher.email}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all cursor-pointer"
            title="Cerrar ventana"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold mb-4">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Selector y entrada para nueva materia */}
        <div className="space-y-4">
          {/* Selector Oficial del Plan de Estudios */}
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2 flex items-center gap-1.5">
              <BookOpen size={12} className="text-[var(--verde)]" />
              <span>Seleccionar del Plan de Estudios Oficial</span>
            </label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  handleAdd(e.target.value);
                  e.target.value = "";
                }
              }}
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3.5 outline-none font-bold text-sm text-[var(--text)] focus:border-[var(--verde)] transition-all cursor-pointer shadow-xs"
            >
              <option value="">— + Seleccionar Materia del Plan de Estudios —</option>
              {PLAN_DE_ESTUDIOS.map((cat) => (
                <optgroup key={cat.id} label={`${cat.name} (${cat.materias.length})`}>
                  {cat.materias.map((m) => {
                    const alreadyHas = materias.some(
                      (curr) => curr.trim().toLowerCase() === m.trim().toLowerCase()
                    );
                    return (
                      <option key={m} value={m} disabled={alreadyHas}>
                        {m} {alreadyHas ? "✓ (Ya asignada)" : ""}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Listado de materias asignadas actualmente */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2 ml-2">
              <label className="text-[10px] font-black uppercase text-[var(--text3)]">
                Materias asignadas ({materias.length})
              </label>
              {materias.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMaterias([])}
                  className="text-[10px] font-bold text-[var(--rojo)] hover:underline cursor-pointer"
                >
                  Vaciar todas
                </button>
              )}
            </div>

            {materias.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg2)]/60 text-center">
                <BookOpen size={24} className="mx-auto text-[var(--text3)] mb-2 opacity-60" />
                <p className="text-xs text-[var(--text2)] font-bold">
                  El docente aún no tiene materias asignadas.
                </p>
                <p className="text-[11px] text-[var(--text3)] mt-0.5">
                  Escribí una materia arriba o seleccioná una sugerencia.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                {materias.map((m, idx) => (
                  <span
                    key={`${m}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg2)] border border-[var(--verde-border)] text-[var(--text)] text-xs font-bold shadow-xs hover:border-[var(--verde)] transition-colors group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--verde)]"></span>
                    <span>{m}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="text-[var(--text3)] hover:text-[var(--rojo)] p-0.5 rounded-md hover:bg-[var(--rojo-bg)] transition-colors cursor-pointer"
                      title={`Quitar ${m}`}
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-4 border-t border-[var(--border)]/70">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3.5 rounded-2xl border border-[var(--border)] font-bold text-sm hover:bg-[var(--bg3)] text-[var(--text)] transition-all active:scale-95 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 p-3.5 rounded-2xl bg-[var(--verde)] text-black font-black text-sm disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{saving ? "Guardando..." : "Guardar Materias"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
