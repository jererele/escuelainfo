"use client";

import { useState, useEffect } from "react";
import { account } from "@/lib/appwrite";
import { saveAusencia, Ausencia, getProfesores, Profesor, logAction } from "@/lib/dataService";
import { X, AlertCircle } from "lucide-react";

interface NewAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lockedProfesor?: Profesor;
}

export default function NewAbsenceModal({ isOpen, onClose, onSuccess, lockedProfesor }: NewAbsenceModalProps) {
  const [loading, setLoading] = useState(false);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [selectedProfId, setSelectedProfId] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    tipo: "Licencia Médica",
    inicio: "",
    fin: "",
    materias: "",
    motivo: "",
    cert: false
  });

  useEffect(() => {
    if (isOpen) {
      if (lockedProfesor) {
        setSelectedProfId(lockedProfesor.id!);
        setFormData(prev => ({ ...prev, materias: lockedProfesor.materias.join(", ") }));
      } else {
        getProfesores().then(setProfesores);
      }
    }
  }, [isOpen, lockedProfesor]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleProfChange = (id: string) => {
    setSelectedProfId(id);
    const prof = profesores.find(p => p.id === id);
    if (prof) setFormData(prev => ({ ...prev, materias: prof.materias.join(", ") }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedProfId) { setError("Seleccioná un profesor antes de continuar."); return; }

    setLoading(true);
    const prof = lockedProfesor || profesores.find(p => p.id === selectedProfId);
    try {
      const newAusencia: Ausencia = {
        profId: selectedProfId,
        profNombre: prof?.nombre || "Desconocido",
        tipo: formData.tipo,
        inicio: formData.inicio,
        fin: formData.fin,
        materias: formData.materias.split(",").map(m => m.trim()).filter(Boolean),
        motivo: formData.motivo,
        cert: formData.cert,
        estado: "pendiente",
        fechaReg: new Date().toISOString()
      };

      await saveAusencia(newAusencia);

      let userEmail = "desconocido";
      try { const user = await account.get(); userEmail = user.email; } catch { /* silent */ }
      await logAction(
        userEmail, "REGISTRAR_AUSENCIA",
        `Profesor: ${newAusencia.profNombre}, Tipo: ${newAusencia.tipo}, Fechas: ${newAusencia.inicio} a ${newAusencia.fin}`
      );

      onSuccess();
      onClose();
    } catch { setError("Error al guardar la ausencia. Intentá de nuevo."); }
    finally { setLoading(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass w-full max-w-lg rounded-[24px] border border-[var(--border)] overflow-hidden shadow-2xl animate-zoom-in">
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg2)]">
          <h2 className="title-font font-bold text-xl">Registrar Nueva Ausencia</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-5 flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold">
            <AlertCircle size={14} className="shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {!lockedProfesor ? (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Seleccionar Profesor</label>
              <select required
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all font-bold"
                value={selectedProfId} onChange={(e) => handleProfChange(e.target.value)}>
                <option value="">Elegir docente...</option>
                {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Profesor</label>
              <div className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 font-bold text-[var(--text)] cursor-not-allowed opacity-80">
                {lockedProfesor.nombre}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Tipo de Ausencia</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["Licencia Médica", "Artículo", "Capacitación", "Otro"].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo: t })}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all active:scale-95 text-center ${
                      formData.tipo === t
                        ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] shadow-sm font-black scale-[1.02]"
                        : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] hover:border-[var(--text3)]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer select-none py-3 px-4 bg-[var(--bg3)] border border-[var(--border)] rounded-xl w-full">
                <input type="checkbox"
                  className="w-5 h-5 rounded border-[var(--border)] bg-[var(--bg)] checked:bg-[var(--verde)] transition-all cursor-pointer"
                  checked={formData.cert} onChange={(e) => setFormData({ ...formData, cert: e.target.checked })} />
                <span className="text-sm font-medium">¿Certificado presentado?</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Desde</label>
              <input required type="date"
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all"
                value={formData.inicio} onChange={(e) => setFormData({ ...formData, inicio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Hasta</label>
              <input required type="date"
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all"
                value={formData.fin} onChange={(e) => setFormData({ ...formData, fin: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">Materias Afectadas</label>
            <input type="text"
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all"
              placeholder="Se autocompleta según el profesor"
              value={formData.materias} onChange={(e) => setFormData({ ...formData, materias: e.target.value })} />
          </div>

          <div className="pt-2 flex gap-4 border-t border-[var(--border)]">
            <button type="button" onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg3)] transition-all font-bold active:scale-95">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl bg-[var(--verde)] text-black font-bold shadow-[0_4px_15px_-4px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50">
              {loading ? "Guardando..." : "Confirmar Registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
