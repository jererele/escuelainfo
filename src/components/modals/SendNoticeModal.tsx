"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Mail, AlertCircle, Send, Loader2, Lightbulb, ShieldCheck, UserCheck } from "lucide-react";
import { Alumno, Profesor, UserProfile, Curso, logAction } from "@/lib/dataService";
import { account } from "@/lib/appwrite";
import { notify } from "@/lib/notify";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  alumnos: Alumno[];
  profesores: Profesor[];
  usuarios: UserProfile[];
  cursos: Curso[];
  userProfile?: UserProfile | null;
}

export default function SendNoticeModal({
  isOpen,
  onClose,
  alumnos,
  profesores,
  usuarios,
  cursos,
  userProfile,
}: Props) {
  const isSuperAdmin = userProfile?.rol === "admin";
  const isDirectivo = userProfile?.rol === "directivo";
  const isPreceptor = userProfile?.rol === "preceptor";
  const canSendGeneralNotices = isSuperAdmin || isDirectivo;

  // Cursos asignados al preceptor
  const preceptorCourses = useMemo(() => {
    if (isPreceptor && userProfile?.cursos && Array.isArray(userProfile.cursos)) {
      return userProfile.cursos;
    }
    return [];
  }, [isPreceptor, userProfile]);

  // Cursos seleccionables en el menú desplegable
  const availableCourses = useMemo(() => {
    if (isPreceptor) {
      return cursos.filter(c => preceptorCourses.includes(c.nombre));
    }
    return cursos;
  }, [cursos, isPreceptor, preceptorCourses]);

  const [destino, setDestino] = useState<"todos" | "alumnos" | "profesores" | "curso" | "usuarios" | "mis_cursos">("todos");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [userEmail, setUserEmail] = useState("desconocido");

  useEffect(() => {
    if (isOpen) {
      account.get()
        .then(user => setUserEmail(user.email))
        .catch(() => setUserEmail("desconocido"));

      // Configurar destino inicial según rol
      if (isPreceptor) {
        setDestino("curso");
        if (preceptorCourses.length > 0) {
          setSelectedCourse(preceptorCourses[0]);
        } else {
          setSelectedCourse("");
        }
      } else {
        setDestino("todos");
        setSelectedCourse("");
      }
    }
  }, [isOpen, isPreceptor, preceptorCourses]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate recipients preview count
  const getRecipientsCount = () => {
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, " ").trim();

    if (destino === "todos") {
      const all = [
        ...alumnos.map(a => a.email),
        ...profesores.map(p => p.email),
        ...usuarios.map(u => u.email)
      ];
      return new Set(all.filter(Boolean)).size;
    }
    if (destino === "alumnos") {
      return alumnos.filter(a => a.email).length;
    }
    if (destino === "profesores") {
      return profesores.filter(p => p.email).length;
    }
    if (destino === "usuarios") {
      return usuarios.filter(u => u.email).length;
    }
    if (destino === "curso") {
      if (!selectedCourse) return 0;
      const targetCourse = normalize(selectedCourse);
      return alumnos.filter(a => normalize(a.curso || "") === targetCourse && a.email).length;
    }
    if (destino === "mis_cursos") {
      const cleanCourses = preceptorCourses.map(c => normalize(c));
      return alumnos.filter(a => cleanCourses.includes(normalize(a.curso || "")) && a.email).length;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!subject.trim()) {
      setError("Por favor ingresá un asunto.");
      return;
    }
    if (!message.trim()) {
      setError("Por favor ingresá el mensaje del aviso.");
      return;
    }

    // Regla de gobernanza: solo directivos y administradores pueden enviar avisos generales
    if (!canSendGeneralNotices && (destino === "todos" || destino === "alumnos" || destino === "profesores" || destino === "usuarios")) {
      setError("Solo el equipo directivo y administradores tienen permisos para emitir avisos generales a toda la comunidad escolar.");
      return;
    }

    // Validación de cursos para preceptores
    if (isPreceptor) {
      if (preceptorCourses.length === 0) {
        setError("Tu cuenta de preceptor no tiene cursos asignados a tu cargo para emitir comunicados.");
        return;
      }
      if (destino === "curso") {
        if (!selectedCourse || !preceptorCourses.includes(selectedCourse)) {
          setError("Solo podés enviar avisos e información a los cursos escolares asignados a tu cargo.");
          return;
        }
      }
    }

    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, " ").trim();
    let emails: string[] = [];

    if (destino === "todos") {
      const all = [
        ...alumnos.map(a => a.email?.trim().toLowerCase()),
        ...profesores.map(p => p.email?.trim().toLowerCase()),
        ...usuarios.map(u => u.email?.trim().toLowerCase())
      ];
      emails = Array.from(new Set(all.filter(Boolean) as string[]));
    } else if (destino === "alumnos") {
      emails = Array.from(new Set(alumnos.map(a => a.email?.trim().toLowerCase()).filter(Boolean) as string[]));
    } else if (destino === "profesores") {
      emails = Array.from(new Set(profesores.map(p => p.email?.trim().toLowerCase()).filter(Boolean) as string[]));
    } else if (destino === "usuarios") {
      emails = Array.from(new Set(usuarios.map(u => u.email?.trim().toLowerCase()).filter(Boolean) as string[]));
    } else if (destino === "curso") {
      if (!selectedCourse) {
        setError("Por favor seleccioná un curso.");
        return;
      }
      const targetCourse = normalize(selectedCourse);
      emails = Array.from(
        new Set(
          alumnos
            .filter(a => normalize(a.curso || "") === targetCourse)
            .map(a => a.email?.trim().toLowerCase())
            .filter(Boolean) as string[]
        )
      );
    } else if (destino === "mis_cursos") {
      const cleanCourses = preceptorCourses.map(c => normalize(c));
      emails = Array.from(
        new Set(
          alumnos
            .filter(a => cleanCourses.includes(normalize(a.curso || "")))
            .map(a => a.email?.trim().toLowerCase())
            .filter(Boolean) as string[]
        )
      );
    }

    if (emails.length === 0) {
      setError("No hay destinatarios válidos con correo registrado para enviar en la selección actual.");
      return;
    }

    const sendNoticeAction = async () => {
      // Registrar auditoría de envío
      const auditRole = isPreceptor ? " [Preceptoría]" : (isDirectivo ? " [Equipo Directivo]" : "");
      await logAction(
        userEmail,
        "ENVIAR_AVISO_EMAIL",
        `Destinatarios: ${destino === "mis_cursos" ? `Todos mis cursos (${preceptorCourses.join(", ")})` : (destino === "curso" ? selectedCourse : destino)} (${emails.length} emails), Asunto: ${subject}${auditRole}`
      );

      // Despacho de correo en segundo plano por el endpoint interno
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emails.length === 1 ? emails[0] : undefined,
          bcc: emails.length > 1 ? emails : undefined,
          subject: subject,
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #111827;">
              <div style="margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #10b981;">
                <h2 style="color: #065f46; margin: 0; font-size: 20px;">${subject}</h2>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280; font-weight: bold; text-transform: uppercase;">
                  ${isPreceptor ? "Aviso de Preceptoría" : "Aviso Institucional"} - EscuelaInfo
                </p>
              </div>
              <div style="white-space: pre-line; line-height: 1.6; font-size: 15px; color: #374151;">
                ${message}
              </div>
              <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; text-align: center;">
                <p style="margin: 0;">Este mensaje fue enviado a través de la plataforma escolar EscuelaInfo.</p>
                <p style="margin: 4px 0 0 0;">Por favor, no responder a esta dirección automática.</p>
              </div>
            </div>
          `
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo enviar el correo");
      }
      return data;
    };

    setIsSending(true);
    try {
      await notify.promise(sendNoticeAction(), {
        loading: `Enviando comunicado a ${emails.length} destinatario(s)...`,
        success: (data: any) => data?.simulated
          ? `Aviso procesado (${emails.length} destinatarios - modo simulación)`
          : `¡Aviso enviado automáticamente a ${emails.length} destinatario(s)!`,
        error: (err: any) => err?.message || "Ocurrió un problema al enviar el correo automático."
      });

      setSubject("");
      setMessage("");
      onClose();
    } catch (err: any) {
      console.error("Error al enviar aviso:", err);
      setError(err?.message || "Ocurrió un problema al enviar el correo automático.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--bg)] w-full max-w-2xl rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[90dvh] overflow-y-auto custom-scrollbar mt-auto sm:mt-0">
        {/* HEADER */}
        <div className="p-4 sm:p-6 border-b border-[var(--border)] flex justify-between items-center sticky top-0 bg-[var(--bg)] z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-[var(--verde-bg)] text-[var(--verde)] rounded-xl border border-[var(--verde-border)]">
              <Mail size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black title-font text-[var(--text)]">
                {isPreceptor ? "Enviar Aviso a Cursos Asignados" : "Enviar Notificación / Aviso"}
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--text2)]">
                {isPreceptor 
                  ? "Despacho de comunicados a las divisiones a tu cargo." 
                  : "Envía comunicados oficiales a cuentas registradas en EscuelaInfo."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ALERTA DE ROL Y GOBERNANZA */}
        {isPreceptor && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] text-xs font-semibold text-[var(--verde)] flex items-start gap-2.5">
            <Lightbulb size={16} className="shrink-0 mt-0.5" />
            <span>
              <strong>Modo Preceptoría:</strong> Solo podés enviar avisos e información a tus cursos asignados. Los avisos generales a toda la comunidad escolar están reservados exclusivamente para el equipo directivo.
            </span>
          </div>
        )}

        {isPreceptor && preceptorCourses.length === 0 && (
          <div className="mx-4 sm:mx-6 mt-3 p-3.5 rounded-2xl bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] text-xs font-semibold text-[var(--amarillo)] flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>
              Tu cuenta de preceptor aún no tiene divisiones escolares asignadas. Solicitá a un directivo o administrador que vincule tus cursos desde la sección <strong>Preceptores</strong> para poder emitir avisos.
            </span>
          </div>
        )}

        {error && (
          <div className="mx-4 sm:mx-6 mt-4 flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Target Group */}
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-2 sm:mb-3 block">
              Grupo de Destinatarios
            </label>

            {/* Directivos y Admins: Opciones Generales Completas */}
            {canSendGeneralNotices && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {[
                  { id: "todos", label: "Toda la Escuela" },
                  { id: "alumnos", label: "Todos los Alumnos" },
                  { id: "profesores", label: "Todos los Profesores" },
                  { id: "usuarios", label: "Usuarios Registrados" },
                  { id: "curso", label: "Por Curso Específico" }
                ].map((opt, idx) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDestino(opt.id as any)}
                    className={`p-2.5 sm:p-3 rounded-xl border font-bold text-xs transition-all active:scale-95 text-center cursor-pointer ${
                      idx === 4 ? "col-span-2 sm:col-span-1" : ""
                    } ${
                      destino === opt.id
                        ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] shadow-sm font-black"
                        : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] hover:border-[var(--text3)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Preceptores: Opciones Exclusivas para sus Cursos Asignados */}
            {isPreceptor && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDestino("curso")}
                    className={`p-3 rounded-xl border font-bold text-xs transition-all active:scale-95 text-center cursor-pointer ${
                      destino === "curso"
                        ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] shadow-sm font-black"
                        : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] hover:border-[var(--text3)]"
                    }`}
                  >
                    Curso Específico a Cargo
                  </button>
                  {preceptorCourses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDestino("mis_cursos")}
                      className={`p-3 rounded-xl border font-bold text-xs transition-all active:scale-95 text-center cursor-pointer ${
                        destino === "mis_cursos"
                          ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] shadow-sm font-black"
                          : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] hover:border-[var(--text3)]"
                      }`}
                    >
                      Todos mis Cursos ({preceptorCourses.length})
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Conditional Course Dropdown */}
          {destino === "curso" && (
            <div className="animate-fade-in">
              <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-2 block">
                {isPreceptor ? "Seleccionar División a tu Cargo" : "Seleccionar Curso"}
              </label>
              {availableCourses.length === 0 ? (
                <div className="p-3 bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] rounded-2xl text-xs text-[var(--amarillo)] font-semibold">
                  No tenés cursos asignados disponibles para seleccionar.
                </div>
              ) : (
                <select
                  required
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3.5 sm:p-4 outline-none font-bold focus:border-[var(--verde)] transition-all text-base sm:text-sm text-[var(--text)] cursor-pointer"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">Elegí un curso...</option>
                  {availableCourses.map(c => (
                    <option key={c.id || c.nombre} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Destinatarios si eligió 'mis_cursos' */}
          {destino === "mis_cursos" && (
            <div className="p-3 rounded-2xl bg-[var(--bg3)] border border-[var(--border)]">
              <span className="text-[11px] font-bold text-[var(--text2)] block mb-1.5">
                Cursos incluidos en este envío:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {preceptorCourses.map(c => (
                  <span key={c} className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)]">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recipient Counter Preview */}
          <div className="bg-[var(--bg3)]/50 border border-[var(--border)] rounded-2xl p-3.5 sm:p-4 flex items-center justify-between">
            <span className="text-xs text-[var(--text2)] font-bold">Destinatarios detectados con correo:</span>
            <span className="px-2.5 sm:px-3 py-1 bg-[var(--bg4)] border border-[var(--border)] rounded-lg text-xs font-black text-[var(--verde)]">
              {getRecipientsCount()} usuarios
            </span>
          </div>

          {/* Subject */}
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-2 block">
              Asunto del Correo
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Suspensión de clases / Comunicado del curso"
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3.5 sm:p-4 outline-none font-bold focus:border-[var(--verde)] transition-all text-base sm:text-sm text-[var(--text)]"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message Body */}
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-2 block">
              Mensaje / Comunicado
            </label>
            <textarea
              required
              rows={5}
              placeholder="Escribí aquí el comunicado oficial..."
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3.5 sm:p-4 outline-none font-bold focus:border-[var(--verde)] transition-all text-base sm:text-sm text-[var(--text)] resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Privacy Note */}
          <div className="p-3 bg-[var(--bg3)] border border-[var(--border)] rounded-xl text-[10px] text-[var(--text3)] font-semibold leading-relaxed flex items-start gap-2">
            <Lightbulb size={14} className="shrink-0 text-amber-400 mt-0.5" />
            <span>
              Para proteger la privacidad de los destinatarios, EscuelaInfo enviará automáticamente todos los correos en <strong>CCO (Copia de Correo Oculta - BCC)</strong>. Nadie podrá ver las direcciones de correo de otros usuarios.
            </span>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-4 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="w-full sm:flex-1 p-3.5 sm:p-4 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSending || (isPreceptor && preceptorCourses.length === 0)}
              className="w-full sm:flex-1 p-3.5 sm:p-4 rounded-2xl bg-[var(--verde)] text-black font-black shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none cursor-pointer text-sm"
            >
              {isSending ? (
                <>
                  <Loader2 className="animate-spin shrink-0" size={16} />
                  <span>Enviando aviso...</span>
                </>
              ) : (
                <>
                  <Send size={16} className="shrink-0" />
                  <span>Enviar Notificación</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
