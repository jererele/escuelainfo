"use client";

import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { saveProfesor, updateProfesor, checkProfesorDNI, logAction, Profesor } from "@/lib/dataService";
import { X, AlertCircle, Sparkles } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";

interface Props { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void; 
  editingProfesor?: Profesor | null; 
  userRole?: string;
}

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function NewTeacherModal({ isOpen, onClose, onSuccess, editingProfesor, userRole }: Props) {
  const isPreceptor = userRole === "preceptor";
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

    // Si es preceptor, únicamente se actualizan las materias del docente
    if (isPreceptor) {
      if (editingProfesor && editingProfesor.id) {
        setLoading(true);
        try {
          const materiasArray = materias.split(",").map(m => m.trim()).filter(Boolean);
          await updateProfesor(editingProfesor.id, {
            materias: materiasArray
          });
          let userEmail = "desconocido";
          try { const user = await account.get(); userEmail = user.email; } catch { /* silent */ }
          await logAction(userEmail, "EDITAR_DOCENTE", `Materias de ${editingProfesor.nombre} actualizadas por preceptor: ${materias}`);
          onSuccess(); onClose();
          setNombre(""); setDni(""); setMaterias(""); setEmail("");
        } catch {
          setError("Error al guardar las materias del docente.");
        } finally {
          setLoading(false);
        }
        return;
      } else {
        setError("Los preceptores no tienen permisos para crear nuevos docentes.");
        return;
      }
    }

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
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[var(--bg)] w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[90dvh] overflow-y-auto custom-scrollbar mt-auto sm:mt-0">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-black title-font">
            {editingProfesor ? (isPreceptor ? "Modificar Materias del Docente" : "Editar Docente") : "Agregar Nuevo Docente"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all cursor-pointer"><X size={18} /></button>
        </div>

        {isPreceptor && (
          <div className="flex items-center gap-2 bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-[var(--amarillo)] px-4 py-3 rounded-2xl text-xs font-semibold mt-3">
            <AlertCircle size={15} className="shrink-0" />
            <span>Rol Preceptor: La información personal del docente está protegida. Solo podés modificar las materias que dicta.</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold mt-4">
            <AlertCircle size={14} className="shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div className="flex items-end gap-3">
            <div className="shrink-0 mb-1" title="Avatar dinámico del docente">
              <UserAvatar
                name={nombre.trim() || "Nuevo Docente"}
                size={54}
                animate="always"
                showRing={true}
                className="shadow-md ring-2 ring-[var(--verde)]/50"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">
                Nombre Completo {isPreceptor && "(Solo lectura)"}
              </label>
              <input 
                required 
                type="text" 
                placeholder="Ej: María González"
                disabled={loading || isPreceptor}
                className={`w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all ${
                  isPreceptor ? "opacity-60 cursor-not-allowed bg-[var(--bg2)]" : ""
                }`}
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">
              DNI (Solo números) {isPreceptor && "(Solo lectura)"}
            </label>
            <input 
              required 
              type="text" 
              inputMode="numeric" 
              maxLength={8} 
              placeholder="12345678"
              disabled={loading || isPreceptor}
              className={`w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all ${
                isPreceptor ? "opacity-60 cursor-not-allowed bg-[var(--bg2)]" : ""
              }`}
              value={dni} 
              onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))} 
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">
              Materias que dicta (separadas por coma)
            </label>
            <input 
              type="text" 
              placeholder="Ej: Lengua, Historia, Geografía"
              autoFocus={isPreceptor}
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all"
              value={materias} 
              onChange={(e) => setMaterias(e.target.value)} 
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">
              Email Institucional {isPreceptor && "(Solo lectura)"}
            </label>
            <input 
              required 
              type="email" 
              placeholder="docente@escuela.edu.ar"
              disabled={loading || isPreceptor}
              className={`w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all ${
                isPreceptor ? "opacity-60 cursor-not-allowed bg-[var(--bg2)]" : ""
              }`}
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] transition-all active:scale-95 cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer">
              {loading ? "Guardando..." : (isPreceptor ? "Guardar Materias" : (editingProfesor ? "Guardar Cambios" : "Guardar Docente"))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
