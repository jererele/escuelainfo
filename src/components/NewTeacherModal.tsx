"use client";

import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { saveProfesor, updateProfesor, checkProfesorDNI, logAction, Profesor } from "@/lib/dataService";
import { X, AlertCircle } from "lucide-react";

interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void; editingProfesor?: Profesor | null; }

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function NewTeacherModal({ isOpen, onClose, onSuccess, editingProfesor }: Props) {
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [materias, setMaterias] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setNombre(""); setDni(""); setMaterias(""); setEmail("");
      return;
    }
    if (editingProfesor) {
      setNombre(editingProfesor.nombre);
      setDni(editingProfesor.dni);
      setMaterias(editingProfesor.materias.join(", "));
      setEmail(editingProfesor.email || "");
    } else {
      setNombre(""); setDni(""); setMaterias(""); setEmail("");
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, editingProfesor]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("El correo electrónico del docente es obligatorio."); return; }
    if (!isValidEmail(email)) { setError("El formato del email no es válido."); return; }

    setLoading(true);
    try {
      if (!editingProfesor || editingProfesor.dni !== dni) {
        const exists = await checkProfesorDNI(dni);
        if (exists) { setError("Ya existe un docente registrado con ese DNI."); setLoading(false); return; }
      }

      const materiasArray = materias.split(",").map(m => m.trim()).filter(Boolean);

      if (editingProfesor && editingProfesor.id) {
        await updateProfesor(editingProfesor.id, {
          nombre, dni, materias: materiasArray, email: email.toLowerCase().trim()
        });
      } else {
        await saveProfesor({
          nombre, dni, materias: materiasArray, email: email.toLowerCase().trim()
        });
      }

      let userEmail = "desconocido";
      try { const user = await account.get(); userEmail = user.email; } catch { /* silent */ }
      await logAction(userEmail, editingProfesor ? "EDITAR_DOCENTE" : "REGISTRAR_DOCENTE", `Nombre: ${nombre}, DNI: ${dni}, Materias: ${materias}`);

      onSuccess(); onClose();
      setNombre(""); setDni(""); setMaterias(""); setEmail("");
    } catch { setError("Error al guardar el docente. Intentá de nuevo."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[var(--bg)] w-full max-w-md rounded-[32px] p-8 border border-[var(--border)] shadow-2xl animate-zoom-in">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-black title-font">{editingProfesor ? "Editar Docente" : "Agregar Nuevo Docente"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all"><X size={18} /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold mt-4">
            <AlertCircle size={14} className="shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Nombre Completo</label>
            <input required type="text" placeholder="Ej: María González"
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all"
              value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">DNI (Solo números)</label>
            <input required type="text" inputMode="numeric" maxLength={8} placeholder="12345678"
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all"
              value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Materias que dicta (separadas por coma)</label>
            <input required type="text" placeholder="Ej: Lengua, Historia, Geografía"
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all"
              value={materias} onChange={(e) => setMaterias(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Email Institucional</label>
            <input required type="email" placeholder="docente@escuela.edu.ar"
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] transition-all active:scale-95">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all">
              {loading ? "Guardando..." : (editingProfesor ? "Guardar Cambios" : "Guardar Docente")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
