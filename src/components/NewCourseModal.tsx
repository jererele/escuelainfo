"use client";

import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { saveCurso, checkCursoExists, logAction } from "@/lib/dataService";
import { X, AlertCircle } from "lucide-react";

interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void; }

export default function NewCourseModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [turno, setTurno] = useState<"Mañana" | "Tarde" | "Doble Turno">("Mañana");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nombre.trim()) { setError("Por favor ingresá el nombre del curso."); return; }

    setLoading(true);
    try {
      const formattedName = `${nombre.trim()} - ${turno}`;
      const exists = await checkCursoExists(formattedName);
      if (exists) { setError("Ya existe un curso con ese nombre y turno."); setLoading(false); return; }

      await saveCurso({ nombre: formattedName });

      let userEmail = "desconocido";
      try { const user = await account.get(); userEmail = user.email; } catch { /* silent */ }
      await logAction(userEmail, "CREAR_CURSO", `Curso: ${formattedName}`);

      onSuccess();
      onClose();
      setNombre(""); setTurno("Mañana");
    } catch { setError("Error al guardar el curso. Intentá de nuevo."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[var(--bg)] w-full max-w-md rounded-[32px] p-6 sm:p-8 border border-[var(--border)] shadow-2xl animate-zoom-in">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl font-black title-font text-[var(--text)]">Agregar Nuevo Curso</h2>
            <p className="text-[var(--text2)] text-xs mt-1 font-bold uppercase tracking-wider">Crear un aula/grupo de alumnos</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all"><X size={18} /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold mt-4">
            <AlertCircle size={14} className="shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Nombre del Curso / División</label>
            <input required type="text" placeholder="Ej: 6to 1ra, 1ro A, etc."
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all"
              value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Turno Horario</label>
            <select required
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all"
              value={turno} onChange={(e) => setTurno(e.target.value as "Mañana" | "Tarde" | "Doble Turno")}>
              <option value="Mañana">Mañana (Turno Mañana)</option>
              <option value="Tarde">Tarde (Turno Tarde)</option>
              <option value="Doble Turno">Doble Turno (Mañana y Tarde)</option>
            </select>
          </div>
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] text-[var(--text)] transition-all active:scale-95">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all">
              {loading ? "Guardando..." : "Crear Curso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
