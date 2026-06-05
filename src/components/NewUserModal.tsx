"use client";

import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { createUserProfile, logAction } from "@/lib/dataService";
import { UserProfile } from "@/lib/dataService";
import { X, AlertCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole: string;
}

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function NewUserModal({ isOpen, onClose, onSuccess, currentUserRole }: Props) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<UserProfile["rol"]>("preceptor");
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
    if (!email) { setError("Por favor ingresá un email."); return; }
    if (!isValidEmail(email)) { setError("El formato del email no es válido."); return; }

    setLoading(true);
    try {
      await createUserProfile({
        uid: "PENDING_" + crypto.randomUUID(),
        email: email.toLowerCase().trim(),
        nombre: "Pendiente",
        rol
      });

      let userEmail = "desconocido";
      try { const user = await account.get(); userEmail = user.email; } catch { /* silent */ }
      await logAction(userEmail, "AUTORIZAR_COLABORADOR", `Email: ${email}, Rol: ${rol}`);

      onSuccess(); onClose();
      setEmail(""); setRol("preceptor");
    } catch { setError("Error al autorizar al colaborador. Intentá de nuevo."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[var(--bg)] w-full max-w-md rounded-[32px] p-8 border border-[var(--border)] shadow-2xl animate-zoom-in">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl font-black title-font text-[var(--text)]">Autorizar Acceso</h2>
            <p className="text-[var(--text2)] text-xs mt-1 font-bold uppercase tracking-wider">Dar rol a un nuevo colaborador</p>
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
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Correo Gmail del Colaborador</label>
            <input required type="email" placeholder="ejemplo@gmail.com"
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Rol a Asignar</label>
            <select required
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all"
              value={rol} onChange={(e) => setRol(e.target.value as UserProfile["rol"])}>
              {currentUserRole === "admin" && (
                <>
                  <option value="admin">Administrador (Acceso Total / Creador)</option>
                  <option value="directivo">Directivo / Director (Gestión Institucional)</option>
                </>
              )}
              <option value="preceptor">Preceptor (Control de Asistencia y Cursos)</option>
              <option value="profesor">Profesor / Docente (Acceso Personal)</option>
            </select>
          </div>
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] text-[var(--text)] transition-all active:scale-95">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all">
              {loading ? "Autorizando..." : "Autorizar Acceso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
