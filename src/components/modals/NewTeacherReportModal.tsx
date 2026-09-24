"use client";

import { useEffect, useState } from "react";
import { saveAusencia, Ausencia, Profesor, logAction, getAlumnos, getHorarios } from "@/lib/dataService";
import { sendAbsenceNoticeEmail, getAffectedCoursesFromAusencia } from "@/lib/emailService";
import { account } from "@/lib/appwrite";
import { notify } from "@/lib/notify";
import { X, Check, AlertCircle, ShieldAlert, AlertTriangle, FileText } from "lucide-react";

interface NewTeacherReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentProfesor: Profesor;
  initialTipo?: string;
}

export default function NewTeacherReportModal({ isOpen, onClose, onSuccess, currentProfesor, initialTipo = "Paro Docente" }: NewTeacherReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const [formData, setFormData] = useState({
    tipo: "Paro Docente",
    fecha: new Date().toLocaleDateString("en-CA"),
    motivo: "",
    selectedMaterias: [...currentProfesor.materias]
  });

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Reset form data on open
  useEffect(() => {
    if (isOpen) {
      setFormData({
        tipo: initialTipo,
        fecha: new Date().toLocaleDateString("en-CA"),
        motivo: "",
        selectedMaterias: [...currentProfesor.materias]
      });
    }
  }, [isOpen, currentProfesor, initialTipo]);

  if (!isOpen) return null;

  const showToast = (msg: string, type: "error" | "success" = "error") => {
    setToast({ msg, type });
    if (type === "error") {
      notify.error(msg);
    } else {
      notify.success(msg);
    }
    setTimeout(() => setToast(null), 3500);
  };

  const allSelected = formData.selectedMaterias.length === currentProfesor.materias.length;

  const handleToggleAll = () => {
    setFormData(prev => ({
      ...prev,
      selectedMaterias: allSelected ? [] : [...currentProfesor.materias]
    }));
  };

  const handleMateriaToggle = (materia: string) => {
    setFormData(prev => {
      const exists = prev.selectedMaterias.includes(materia);
      return {
        ...prev,
        selectedMaterias: exists
          ? prev.selectedMaterias.filter(m => m !== materia)
          : [...prev.selectedMaterias, materia]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.selectedMaterias.length === 0) {
      showToast("Seleccioná al menos una materia afectada.");
      return;
    }

    setLoading(true);
    try {
      const newAusencia: Ausencia = {
        profId: currentProfesor.id!,
        profNombre: currentProfesor.nombre,
        tipo: formData.tipo,
        inicio: formData.fecha,
        fin: formData.fecha,
        materias: formData.selectedMaterias,
        motivo: formData.tipo === "Paro Docente"
          ? "Medida de fuerza gremial / Adhesión al Paro Docente"
          : formData.motivo || "Sin motivo especificado",
        cert: false,
        estado: formData.tipo === "Ausencia / Licencia" ? "pendiente" : "aprobada",
        fechaReg: new Date().toISOString()
      };

      await saveAusencia(newAusencia);

      let userEmail = "desconocido";
      try { const user = await account.get(); userEmail = user.email; } catch { /* silent */ }

      await logAction(
        userEmail,
        "AUTOGESTION_DOCENTE",
        `Profesor: ${currentProfesor.nombre}, Reporte: ${formData.tipo}, Fecha: ${formData.fecha}`
      );

      // Si el reporte queda aprobado automáticamente (ej: Paro Docente), notificar a los alumnos
      if (newAusencia.estado === "aprobada") {
        try {
          const [allHorarios, allAlumnos] = await Promise.all([getHorarios(), getAlumnos()]);
          const affectedCourses = getAffectedCoursesFromAusencia(newAusencia, allHorarios);
          if (affectedCourses.length > 0) {
            const cleanCourses = affectedCourses.map(c => c.toLowerCase().trim());
            const targetStudents = allAlumnos.filter(a =>
              cleanCourses.includes((a.curso || "").toLowerCase().trim())
            );
            const studentEmails = Array.from(
              new Set(targetStudents.map(s => s.email?.trim().toLowerCase()).filter(Boolean) as string[])
            );

            if (studentEmails.length > 0) {
              sendAbsenceNoticeEmail({
                profesor: newAusencia.profNombre,
                tipo: newAusencia.tipo,
                inicio: newAusencia.inicio,
                fin: newAusencia.fin,
                materias: newAusencia.materias,
                cursos: affectedCourses,
                motivo: newAusencia.motivo,
                studentEmails,
              }).catch(err => console.error("Error al notificar por email a los alumnos:", err));
            }
          }
        } catch (err) {
          console.error("Error al recopilar alumnos para notificación de paro:", err);
        }
      }

      onSuccess();
      onClose();
    } catch {
      showToast("Ocurrió un error al guardar el reporte. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass w-full max-w-lg rounded-[28px] border border-[var(--border)] overflow-hidden shadow-2xl animate-zoom-in will-change-gpu">

        {/* HEADER */}
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg2)]">
          <div>
            <h2 className="title-font font-bold text-xl">Reporte de Inasistencia</h2>
            <p className="text-[10px] uppercase font-black tracking-widest text-[var(--verde)] mt-0.5">
              {currentProfesor.nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">

          {/* TIPO */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-[var(--text2)]">Tipo de Reporte</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "Paro Docente", label: "Adhesión al Paro", desc: "Medida gremial", icon: <ShieldAlert size={16} className="text-[var(--text2)]" /> },
                { id: "Suspensión (Fuerza Mayor)", label: "Suspensión Urgente", desc: "Clima, salud, etc.", icon: <AlertTriangle size={16} className="text-[var(--text2)]" /> },
                { id: "Ausencia / Licencia", label: "Solicitar Ausencia", desc: "Sujeto a aprobación", icon: <FileText size={16} className="text-[var(--text2)]" /> }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: t.id, motivo: t.id === "Paro Docente" ? "" : formData.motivo })}
                  className={`p-3.5 rounded-xl border text-left transition-all active:scale-95 ${
                    formData.tipo === t.id
                      ? "bg-[var(--verde-bg)] border-[var(--verde-border)] text-[var(--verde)] shadow-sm"
                      : "bg-[var(--bg3)] border-[var(--border)] text-[var(--text2)] hover:border-[var(--verde-border)]/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {t.icon}
                    <div className="font-extrabold text-xs">{t.label}</div>
                  </div>
                  <div className="text-[9px] uppercase tracking-wider mt-0.5 opacity-70">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* FECHA */}
          <div className="space-y-2">
            <label 
              htmlFor="teacher-report-fecha"
              className="text-xs font-black uppercase tracking-wider text-[var(--text2)] cursor-pointer select-none"
              onClick={() => { try { (document.getElementById("teacher-report-fecha") as HTMLInputElement)?.showPicker?.(); } catch {} }}
            >
              Fecha del Reporte
            </label>
            <input
              id="teacher-report-fecha"
              required
              type="date"
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all font-bold text-sm text-[var(--text)] cursor-pointer"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch {} }}
            />
          </div>

          {/* MOTIVO — obligatorio si es suspensión o ausencia */}
          {formData.tipo !== "Paro Docente" && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-black uppercase tracking-wider text-[var(--text2)]">Motivo / Causa</label>
              <textarea
                required
                rows={3}
                placeholder="Ej: Calefacción rota, enfermedad, trámites médicos..."
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all text-sm resize-none"
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              />
            </div>
          )}

          {/* MATERIAS AFECTADAS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-[var(--text2)]">
                Materias Afectadas
                <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] text-[9px] font-black">
                  {formData.selectedMaterias.length}/{currentProfesor.materias.length}
                </span>
              </label>
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-[10px] font-black uppercase tracking-wide text-[var(--verde)] hover:underline transition-all"
              >
                {allSelected ? "Ninguna" : "Todas"}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
              {currentProfesor.materias.map(materia => {
                const isChecked = formData.selectedMaterias.includes(materia);
                return (
                  <div
                    key={materia}
                    onClick={() => handleMateriaToggle(materia)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                      isChecked
                        ? "bg-[var(--bg)] border-[var(--verde-border)] shadow-sm text-[var(--text)]"
                        : "bg-[var(--bg3)] border-transparent text-[var(--text3)] opacity-55 hover:opacity-80"
                    }`}
                  >
                    <span className="text-xs font-bold">{materia}</span>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                      isChecked ? "bg-[var(--verde)] border-transparent text-black" : "border-[var(--border)]"
                    }`}>
                      {isChecked && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACCIONES */}
          <div className="pt-4 flex gap-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 rounded-xl border border-[var(--border)] hover:bg-[var(--bg3)] transition-all font-bold text-sm active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3.5 rounded-xl bg-[var(--verde)] text-black font-black shadow-[0_4px_15px_-4px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Registrando...
                </>
              ) : "Enviar Reporte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
