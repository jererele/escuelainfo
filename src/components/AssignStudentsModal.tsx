"use client";

import { useEffect, useState, useMemo } from "react";
import { X, Search, UserCheck, Users, AlertCircle, GraduationCap } from "lucide-react";
import { Alumno, Curso, updateAlumno, logAction } from "@/lib/dataService";
import { account } from "@/lib/appwrite";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  curso: Curso | null;
  alumnos: Alumno[];
  cursos: Curso[];
}

export default function AssignStudentsModal({ isOpen, onClose, onSuccess, curso, alumnos, cursos }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Pre-select students already in this course
  useEffect(() => {
    if (!isOpen || !curso) return;
    setSearch("");
    setError("");
    const preSelected = new Set(
      alumnos.filter(a => a.curso === curso.nombre).map(a => a.id!)
    );
    setSelected(preSelected);
  }, [isOpen, curso, alumnos]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const filteredAlumnos = useMemo(() => {
    const q = search.toLowerCase();
    return alumnos.filter(a =>
      a.nombre.toLowerCase().includes(q) ||
      a.dni.includes(q) ||
      a.email.toLowerCase().includes(q)
    );
  }, [alumnos, search]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (filteredAlumnos.every(a => selected.has(a.id!))) {
      // Deselect all visible
      setSelected(prev => {
        const next = new Set(prev);
        filteredAlumnos.forEach(a => next.delete(a.id!));
        return next;
      });
    } else {
      // Select all visible
      setSelected(prev => {
        const next = new Set(prev);
        filteredAlumnos.forEach(a => next.add(a.id!));
        return next;
      });
    }
  };

  const handleSave = async () => {
    if (!curso) return;
    setSaving(true);
    setError("");
    try {
      let count = 0;
      for (const alumno of alumnos) {
        const shouldBeInCourse = selected.has(alumno.id!);
        const isInCourse = alumno.curso === curso.nombre;
        if (shouldBeInCourse && !isInCourse) {
          await updateAlumno(alumno.id!, { curso: curso.nombre });
          count++;
        }
      }
      let userEmail = "desconocido";
      try { const u = await account.get(); userEmail = u.email; } catch {}
      await logAction(userEmail, "ASIGNAR_ALUMNOS_CURSO", `Curso: ${curso.nombre}, Asignados: ${count}`);
      onSuccess();
      onClose();
    } catch {
      setError("Error al guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !curso) return null;

  const allVisibleSelected = filteredAlumnos.length > 0 && filteredAlumnos.every(a => selected.has(a.id!));
  const selectedCount = selected.size;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--bg)] w-full max-w-2xl max-h-[90vh] rounded-[32px] border border-[var(--border)] shadow-2xl animate-zoom-in flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 sm:p-8 border-b border-[var(--border)] shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-full">
                {curso.nombre}
              </span>
            </div>
            <h2 className="text-2xl font-black title-font text-[var(--text)]">Asignar Alumnos al Curso</h2>
            <p className="text-xs text-[var(--text2)] mt-1 font-medium">
              Seleccioná los alumnos que pertenecen a este curso. Los que ya estén asignados aparecen marcados.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all shrink-0 ml-4">
            <X size={18} />
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 px-6 sm:px-8 py-3 bg-[var(--bg3)]/50 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--verde)]">
            <UserCheck size={14} />
            <span>{selectedCount} seleccionados</span>
          </div>
          <div className="w-px h-4 bg-[var(--border)]" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text2)]">
            <Users size={14} />
            <span>{alumnos.length} alumnos totales</span>
          </div>
        </div>

        {/* Search + toggle all */}
        <div className="px-6 sm:px-8 py-4 border-b border-[var(--border)] shrink-0 space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o correo..."
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl pl-10 pr-4 py-3 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {filteredAlumnos.length > 0 && (
            <button
              onClick={toggleAll}
              className="text-xs font-black uppercase tracking-wider text-[var(--azul)] hover:text-[var(--verde)] transition-colors"
            >
              {allVisibleSelected ? "✗ Deseleccionar todos los visibles" : "✓ Seleccionar todos los visibles"}
            </button>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {filteredAlumnos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--text3)]">
              <GraduationCap size={40} className="mb-3 opacity-40" />
              <p className="text-sm font-bold">No se encontraron alumnos</p>
              <p className="text-xs mt-1">Probá con otro término de búsqueda</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {filteredAlumnos.map(alumno => {
                const isChecked = selected.has(alumno.id!);
                const inThisCourse = alumno.curso === curso.nombre;
                return (
                  <label
                    key={alumno.id}
                    className={`flex items-center gap-4 px-6 sm:px-8 py-4 cursor-pointer transition-all hover:bg-[var(--bg3)]/30 ${isChecked ? "bg-[var(--verde-bg)]/20" : ""}`}
                  >
                    {/* Custom checkbox */}
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                      isChecked
                        ? "bg-[var(--verde)] border-[var(--verde)] text-black"
                        : "border-[var(--border)] bg-[var(--bg3)]"
                    }`}>
                      {isChecked && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isChecked}
                      onChange={() => toggle(alumno.id!)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[var(--text)] truncate">{alumno.nombre}</div>
                      <div className="text-[10px] text-[var(--text3)] font-medium mt-0.5">
                        DNI: {alumno.dni || "—"} · {alumno.email}
                      </div>
                    </div>
                    {/* Current course badge */}
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border shrink-0 ${
                      inThisCourse
                        ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)]"
                        : alumno.curso === "pendiente"
                        ? "bg-[var(--amarillo-bg)] text-[var(--amarillo)] border-[var(--amarillo-border)]"
                        : "bg-[var(--bg3)] text-[var(--text3)] border-[var(--border)]"
                    }`}>
                      {inThisCourse ? "Ya en este curso" : (alumno.curso || "Sin curso")}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 sm:mx-8 mt-4 flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold shrink-0">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-4 p-6 sm:p-8 border-t border-[var(--border)] shrink-0">
          <button
            onClick={onClose}
            className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] text-[var(--text)] transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <UserCheck size={16} />
                Guardar Asignaciones
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
