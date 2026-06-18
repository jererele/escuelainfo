"use client";

import { useState, useEffect } from "react";
import { account } from "@/lib/appwrite";
import { saveHorario, getProfesores, Profesor, getHorarios, logAction, getCursos, MODULO_MAP } from "@/lib/dataService";
import { X, AlertCircle } from "lucide-react";

interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void; }

// TIME_SLOTS generado dinámicamente desde MODULO_MAP (fuente única de verdad)
const TIME_SLOTS = Object.values(MODULO_MAP);

export default function NewScheduleModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [dia, setDia] = useState("Lunes");
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [profId, setProfId] = useState("");
  const [materia, setMateria] = useState("");
  const [curso, setCurso] = useState("");
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [cursos, setCursosList] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      getProfesores().then(setProfesores);
      getCursos().then(data => setCursosList(data.map(c => c.nombre).sort()));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedProfesor = profesores.find(p => p.id === profId);

  const toggleHour = (h: string) =>
    setSelectedHours(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (selectedHours.length === 0) { setError("Seleccioná al menos una hora cátedra."); return; }
    if (!profId) { setError("Seleccioná un profesor antes de continuar."); return; }

    setLoading(true);
    try {
      const currentHorarios = await getHorarios();

      for (const hora of selectedHours) {
        const profConflict = currentHorarios.find(item =>
          item.dia === dia && item.hora === hora &&
          item.profesor.toLowerCase() === selectedProfesor?.nombre.toLowerCase()
        );
        if (profConflict) {
          setError(`Conflicto de Profesor: ${selectedProfesor?.nombre} ya tiene "${profConflict.materia}" en ${profConflict.curso} el ${dia} a las ${hora}.`);
          setLoading(false); return;
        }

        const cursoConflict = currentHorarios.find(item =>
          item.dia === dia && item.hora === hora && item.curso === curso
        );
        if (cursoConflict) {
          setError(`Conflicto de Curso: ${curso} ya tiene "${cursoConflict.materia}" con ${cursoConflict.profesor} el ${dia} a las ${hora}.`);
          setLoading(false); return;
        }
      }

      for (const hora of selectedHours) {
        await saveHorario({ dia, hora, materia, profesor: selectedProfesor?.nombre || "", curso });
      }

      let userEmail = "desconocido";
      try { const user = await account.get(); userEmail = user.email; } catch { /* silent */ }
      await logAction(
        userEmail, "PROGRAMAR_CLASE",
        `Curso: ${curso}, Materia: ${materia}, Profesor: ${selectedProfesor?.nombre}, Día: ${dia}, Horas: ${selectedHours.join(", ")}`
      );

      onSuccess(); onClose();
      setSelectedHours([]); setMateria(""); setProfId(""); setCurso("");
    } catch { setError("Error al guardar el horario. Intentá de nuevo."); }
    finally { setLoading(false); }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--bg)] w-full max-w-2xl rounded-[32px] border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center sticky top-0 bg-[var(--bg)] z-10">
          <h2 className="text-2xl font-black title-font text-[var(--text)]">Programar Clases</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all"><X size={18} /></button>
        </div>

        {error && (
          <div className="mx-6 mt-5 flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold">
            <AlertCircle size={14} className="shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-2 block">Día de la semana</label>
              <select className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all"
                value={dia} onChange={(e) => setDia(e.target.value)}>
                {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-2 block">Curso</label>
              <select required className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all"
                value={curso} onChange={(e) => setCurso(e.target.value)}>
                <option value="">Seleccionar Curso</option>
                {cursos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-2 block">
              Horas Cátedra
              {selectedHours.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] text-[9px]">
                  {selectedHours.length} seleccionada{selectedHours.length > 1 ? "s" : ""}
                </span>
              )}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIME_SLOTS.map(h => (
                <button key={h} type="button" onClick={() => toggleHour(h)}
                  className={`p-2 rounded-xl text-[10px] font-black border transition-all active:scale-95 ${
                    selectedHours.includes(h)
                      ? "bg-[var(--verde)] text-black border-[var(--verde)] shadow-sm"
                      : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] hover:border-[var(--text3)]"
                  }`}>
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-2 block">Profesor</label>
              <select required className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all"
                value={profId} onChange={(e) => { setProfId(e.target.value); setMateria(""); }}>
                <option value="">Seleccionar Profesor</option>
                {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-2 block">Materia</label>
              <select required className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all"
                value={materia} onChange={(e) => setMateria(e.target.value)}>
                <option value="">Seleccionar Materia</option>
                {selectedProfesor?.materias.map(m => <option key={m} value={m}>{m}</option>)}
                {!profId && <option disabled>Primero elegí un profesor</option>}
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-2 border-t border-[var(--border)]">
            <button type="button" onClick={onClose}
              className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] transition-all active:scale-95">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all">
              {loading ? "Guardando..." : `Guardar ${selectedHours.length > 0 ? selectedHours.length : ""} hora${selectedHours.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
