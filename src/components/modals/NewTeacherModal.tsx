"use client";

import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { saveProfesor, updateProfesor, checkProfesorDNI, logAction, Profesor } from "@/lib/dataService";
import { X, AlertCircle, Sparkles, BookOpen } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import { PLAN_DE_ESTUDIOS } from "@/lib/curriculum";

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
  const [materiasList, setMateriasList] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setNombre(""); setDni(""); setMateriasList([]); setEmail("");
      return;
    }
    if (editingProfesor) {
      setNombre(editingProfesor.nombre);
      setDni(editingProfesor.dni);
      setMateriasList(editingProfesor.materias ? [...editingProfesor.materias] : []);
      setEmail(editingProfesor.email || "");
    } else {
      setNombre(""); setDni(""); setMateriasList([]); setEmail("");
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, editingProfesor]);

  const handleAddSubject = (subject: string) => {
    const trimmed = (subject || "").trim();
    if (!trimmed) return;
    if (!materiasList.includes(trimmed)) {
      setMateriasList(prev => [...prev, trimmed]);
      setError("");
    }
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    setMateriasList(prev => prev.filter(m => m !== subjectToRemove));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Si es preceptor, únicamente se actualizan las materias del docente
    if (isPreceptor) {
      if (editingProfesor && editingProfesor.id) {
        setLoading(true);
        try {
          await updateProfesor(editingProfesor.id, {
            materias: materiasList
          });
          let userEmail = "desconocido";
          try { const user = await account.get(); userEmail = user.email; } catch { /* silent */ }
          await logAction(userEmail, "EDITAR_DOCENTE", `Materias de ${editingProfesor.nombre} actualizadas por preceptor: ${materiasList.join(", ")}`);
          onSuccess(); onClose();
          setNombre(""); setDni(""); setMateriasList([]); setEmail("");
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

      if (editingProfesor && editingProfesor.id) {
        await updateProfesor(editingProfesor.id, {
          nombre, dni, materias: materiasList, email: email.toLowerCase().trim()
        });
      } else {
        await saveProfesor({
          nombre, dni, materias: materiasList, email: email.toLowerCase().trim()
        });
      }

      let userEmail = "desconocido";
      try { const user = await account.get(); userEmail = user.email; } catch { /* silent */ }
      await logAction(userEmail, editingProfesor ? "EDITAR_DOCENTE" : "REGISTRAR_DOCENTE", `Nombre: ${nombre}, DNI: ${dni}, Materias: ${materiasList.join(", ")}`);

      onSuccess(); onClose();
      setNombre(""); setDni(""); setMateriasList([]); setEmail("");
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
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-2">
              <label className="text-[10px] font-black uppercase text-[var(--text3)] flex items-center gap-1.5">
                <BookOpen size={12} className="text-[var(--verde)]" />
                <span>Materias que dicta (Plan de Estudios Oficial)</span>
              </label>
              <span className="text-[10px] text-[var(--verde)] font-bold">
                {materiasList.length} seleccionada{materiasList.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Menú Desplegable con Plan de Estudios Oficial */}
            <select
              value=""
              onChange={(e) => {
                handleAddSubject(e.target.value);
                e.target.value = "";
              }}
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-sm text-[var(--text)] focus:border-[var(--verde)] transition-all cursor-pointer"
            >
              <option value="">— + Seleccionar Materia del Plan de Estudios —</option>
              {PLAN_DE_ESTUDIOS.map((cat) => (
                <optgroup key={cat.id} label={`${cat.name} (${cat.materias.length})`}>
                  {cat.materias.map((m) => (
                    <option key={m} value={m} disabled={materiasList.includes(m)}>
                      {m} {materiasList.includes(m) ? "✓ (Ya agregada)" : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {/* Chips interactivos de materias seleccionadas */}
            {materiasList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-1 max-h-32 overflow-y-auto custom-scrollbar">
                {materiasList.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg3)] border border-[var(--border)] text-xs font-bold text-[var(--text)] group hover:border-[var(--rojo)] transition-all shadow-xs"
                  >
                    <span>{m}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(m)}
                      className="text-[var(--text3)] hover:text-[var(--rojo)] transition-colors cursor-pointer p-0.5"
                      title={`Quitar ${m}`}
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[var(--text3)] italic ml-2">
                Seleccioná una o más materias del menú desplegable superior sin errores de tipeo.
              </p>
            )}
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
