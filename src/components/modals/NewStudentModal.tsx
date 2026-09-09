"use client";

import { useEffect, useState, useRef } from "react";
import { account } from "@/lib/appwrite";
import { getAlumnos, updateAlumno, logAction, getCursos, Curso, Alumno } from "@/lib/dataService";
import { X, AlertCircle, Search, UserCheck, UserPlus } from "lucide-react";

interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void; }

export default function NewStudentModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [cursos, setCursosList] = useState<Curso[]>([]);
  const [curso, setCurso] = useState("");
  const [error, setError] = useState("");

  // Búsqueda de alumno existente
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Alumno[]>([]);
  const [allAlumnos, setAllAlumnos] = useState<Alumno[]>([]);
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      getCursos().then(setCursosList);
      getAlumnos(true).then(setAllAlumnos);
    }
  }, [isOpen]);

  // Filtrar alumnos mientras escribe
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results = allAlumnos.filter(a =>
      a.nombre.toLowerCase().includes(q) ||
      a.dni.includes(q) ||
      a.email.toLowerCase().includes(q)
    );
    setSearchResults(results);
    setShowDropdown(results.length > 0);
  }, [searchQuery, allAlumnos]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleSelectAlumno = (alumno: Alumno) => {
    setSelectedAlumno(alumno);
    setSearchQuery(alumno.nombre);
    setShowDropdown(false);
    setError("");
    // Pre-seleccionar su curso actual si tiene uno
    if (alumno.curso && alumno.curso !== "pendiente" && alumno.curso !== "") {
      setCurso(alumno.curso);
    } else {
      setCurso("");
    }
  };

  const handleClearSelection = () => {
    setSelectedAlumno(null);
    setSearchQuery("");
    setCurso("");
    setError("");
    setSearchResults([]);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedAlumno) {
      setError("Buscá y seleccioná un alumno de la lista antes de continuar.");
      return;
    }
    if (!curso) {
      setError("Seleccioná un curso para asignar al alumno.");
      return;
    }

    setLoading(true);
    try {
      await updateAlumno(selectedAlumno.id!, { curso });

      let userEmail = "desconocido";
      try { const user = await account.get(); userEmail = user.email; } catch { /* silent */ }
      await logAction(userEmail, "ASIGNAR_CURSO_ALUMNO", `Alumno: ${selectedAlumno.nombre}, DNI: ${selectedAlumno.dni}, Curso: ${curso}`);

      onSuccess();
      onClose();
      handleClearSelection();
    } catch {
      setError("Error al asignar el curso. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[var(--bg)] w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[90dvh] overflow-y-auto custom-scrollbar mt-auto sm:mt-0">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl font-black title-font text-[var(--text)]">Inscribir Alumno</h2>
            <p className="text-[var(--text2)] text-xs mt-1 font-bold uppercase tracking-wider">Asignar alumno existente a un curso</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all"><X size={18} /></button>
        </div>

        {/* Info banner */}
        <div className="mt-4 flex items-start gap-2 bg-[var(--azul-bg)] border border-[var(--azul-border)] text-[var(--azul)] px-4 py-3 rounded-xl text-xs font-semibold">
          <Search size={14} className="shrink-0 mt-0.5" />
          <span>Buscá por nombre, DNI o email al alumno que ya está registrado en el sistema y asignale un curso.</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold mt-4">
            <AlertCircle size={14} className="shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {/* Búsqueda de alumno */}
          <div ref={searchRef} className="relative">
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">
              Buscar Alumno en el Sistema
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
              <input
                type="text"
                placeholder="Escribí el nombre, DNI o email..."
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 pl-10 outline-none font-bold focus:border-[var(--verde)] transition-all"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedAlumno) handleClearSelection();
                }}
              />
              {selectedAlumno && (
                <button type="button" onClick={handleClearSelection}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--rojo)] transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown de resultados */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.map(alumno => (
                  <button
                    key={alumno.id}
                    type="button"
                    onClick={() => handleSelectAlumno(alumno)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg3)] transition-colors text-left border-b border-[var(--border)] last:border-none"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[var(--verde-bg)] text-[var(--verde)] flex items-center justify-center shrink-0">
                      <UserCheck size={14} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[var(--text)]">{alumno.nombre}</div>
                      <div className="text-[10px] text-[var(--text3)]">DNI: {alumno.dni || "—"} · {alumno.email}</div>
                      {alumno.curso && alumno.curso !== "pendiente" && (
                        <div className="text-[10px] text-[var(--verde)] font-bold mt-0.5">Curso actual: {alumno.curso}</div>
                      )}
                      {(!alumno.curso || alumno.curso === "pendiente") && (
                        <div className="text-[10px] text-[var(--amarillo)] font-bold mt-0.5">⚠ Sin curso asignado</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.trim().length >= 2 && searchResults.length === 0 && !selectedAlumno && (
              <div className="mt-2 flex items-center gap-2 text-xs font-bold text-[var(--text3)] px-2">
                <UserPlus size={14} />
                No se encontró ningún alumno con ese criterio. Verificá que esté registrado en el sistema.
              </div>
            )}
          </div>

          {/* Alumno seleccionado — panel de confirmación */}
          {selectedAlumno && (
            <div className="bg-[var(--verde-bg)] border border-[var(--verde-border)] rounded-2xl p-4 space-y-1">
              <div className="text-[10px] font-black uppercase text-[var(--verde)] tracking-wider mb-2">✓ Alumno Seleccionado</div>
              <div className="font-black text-[var(--text)]">{selectedAlumno.nombre}</div>
              <div className="text-xs text-[var(--text2)] font-semibold">DNI: {selectedAlumno.dni || "—"} · {selectedAlumno.email}</div>
              {selectedAlumno.curso && selectedAlumno.curso !== "pendiente" && (
                <div className="text-xs text-[var(--text3)] font-semibold mt-1">
                  Curso actual: <span className="font-black text-[var(--text)]">{selectedAlumno.curso}</span>
                </div>
              )}
            </div>
          )}

          {/* Selector de curso */}
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">
              Curso a Asignar
              <span className="text-[var(--rojo)] ml-1">*</span>
            </label>
            <select
              required
              className={`w-full bg-[var(--bg3)] border rounded-2xl p-4 outline-none font-bold transition-all ${
                !curso
                  ? "border-[var(--rojo-border)] focus:border-[var(--rojo)] text-[var(--text3)]"
                  : "border-[var(--border)] focus:border-[var(--verde)] text-[var(--text)]"
              }`}
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
            >
              <option value="" disabled>— Seleccionar Curso Obligatorio —</option>
              {cursos.length === 0
                ? <option disabled>No hay cursos — agregalos primero.</option>
                : cursos.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)
              }
            </select>
            {!curso && (
              <p className="text-[10px] text-[var(--rojo)] font-bold mt-1.5 ml-2 flex items-center gap-1">
                <span>⚠</span> Este campo es obligatorio para asignar al alumno.
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] transition-all active:scale-95">Cancelar</button>
            <button type="submit" disabled={loading || !selectedAlumno || !curso}
              className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all">
              {loading ? "Guardando..." : "Asignar Curso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
