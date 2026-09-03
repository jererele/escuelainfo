"use client";

import { useState, useEffect } from "react";
import { X, Mail, AlertCircle, Send, CheckCircle2, Copy, Check, Loader2, ShieldCheck, Inbox } from "lucide-react";
import { Alumno, Profesor, UserProfile, Curso, logAction } from "@/lib/dataService";
import { account } from "@/lib/appwrite";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  alumnos: Alumno[];
  profesores: Profesor[];
  usuarios: UserProfile[];
  cursos: Curso[];
  showToast: (msg: string, type: "success" | "error") => void;
}

export default function SendNoticeModal({
  isOpen,
  onClose,
  alumnos,
  profesores,
  usuarios,
  cursos,
  showToast,
}: Props) {
  const [destino, setDestino] = useState<"todos" | "alumnos" | "profesores" | "curso" | "usuarios">("todos");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("desconocido");
  const [loading, setLoading] = useState(false);
  const [sentDetails, setSentDetails] = useState<any | null>(null);
  const [copiedBcc, setCopiedBcc] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      account
        .get()
        .then((user) => setUserEmail(user.email))
        .catch(() => setUserEmail("desconocido"));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const handleClose = () => {
    setSentDetails(null);
    setError("");
    setCopiedBcc(false);
    setCopiedMsg(false);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  // Get recipient email array
  const getRecipientEmails = (): string[] => {
    if (destino === "todos") {
      const all = [
        ...alumnos.map((a) => a.email),
        ...profesores.map((p) => p.email),
        ...usuarios.map((u) => u.email),
      ];
      return Array.from(new Set(all.filter(Boolean)));
    }
    if (destino === "alumnos") {
      return alumnos.map((a) => a.email).filter(Boolean);
    }
    if (destino === "profesores") {
      return profesores.map((p) => p.email).filter(Boolean);
    }
    if (destino === "usuarios") {
      return usuarios.map((u) => u.email).filter(Boolean);
    }
    if (destino === "curso") {
      return alumnos
        .filter((a) => a.curso === selectedCourse)
        .map((a) => a.email)
        .filter(Boolean);
    }
    return [];
  };

  const getRecipientsCount = () => getRecipientEmails().length;

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
    if (destino === "curso" && !selectedCourse) {
      setError("Por favor seleccioná un curso.");
      return;
    }

    const emails = getRecipientEmails();
    if (emails.length === 0) {
      setError("No hay destinatarios válidos con correo registrado para enviar.");
      return;
    }

    setLoading(true);

    try {
      // Direct in-app API request (no external apps, no popups, no mailto)
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinatarios: emails,
          asunto: subject,
          mensaje: message,
          remitente: userEmail !== "desconocido" ? userEmail : "escuela@escuelainfo.edu.ar",
          tipo: "COMUNICADO_INSTITUCIONAL",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo procesar el envío.");
      }

      // Log in Appwrite action log
      await logAction(
        userEmail,
        "ENVIAR_AVISO_EMAIL",
        `Destinatarios: ${destino} (${emails.length} emails), Asunto: ${subject}`
      );

      setSentDetails(data.detalles);
      showToast(`¡Correo enviado con éxito a ${emails.length} destinatarios!`, "success");
    } catch (err: any) {
      setError(err.message || "Error al enviar el correo.");
      showToast("No se pudo enviar el correo.", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "bcc" | "msg") => {
    try {
      navigator.clipboard.writeText(text);
      if (type === "bcc") {
        setCopiedBcc(true);
        setTimeout(() => setCopiedBcc(false), 3000);
      } else {
        setCopiedMsg(true);
        setTimeout(() => setCopiedMsg(false), 3000);
      }
    } catch {
      showToast("No se pudo copiar al portapapeles", "error");
    }
  };

  const resetForm = () => {
    setSentDetails(null);
    setSubject("");
    setMessage("");
    setError("");
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-[var(--bg)] w-full max-w-2xl rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[90dvh] overflow-y-auto custom-scrollbar mt-auto sm:mt-0">
        {/* HEADER */}
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center sticky top-0 bg-[var(--bg)] z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--verde-bg)] text-[var(--verde)] rounded-xl border border-[var(--verde-border)] shadow-sm">
              <Inbox size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-black title-font text-[var(--text)]">
                Cliente de Correo EscuelaInfo
              </h2>
              <p className="text-xs text-[var(--text2)]">
                Envía comunicados e avisos directamente dentro de la misma página sin salir del sitio.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* SENT SUCCESS VIEW (APARTADO DE CORREO ENVIADO DENTRO DE LA PÁGINA) */}
        {sentDetails ? (
          <div className="p-6 space-y-6 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="shrink-0" />
                <div>
                  <h3 className="font-black text-sm text-[var(--text)]">
                    ¡Correo Enviado y Entregado desde la Plataforma!
                  </h3>
                  <p className="text-[11px] font-semibold opacity-90">
                    Procesado el {sentDetails.fechaEnvio} sin abrir aplicaciones externas.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-[var(--verde)] text-black font-black text-[10px] uppercase rounded-full tracking-wider shrink-0">
                ✓ Enviado
              </span>
            </div>

            {/* EMBEDDED MAIL RECEIPT ENVELOPE */}
            <div className="bg-[var(--bg3)] rounded-2xl border border-[var(--border)] p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-[10px] font-black uppercase text-[var(--text3)]">Remitente</span>
                <span className="text-xs font-bold text-[var(--verde)]">{sentDetails.remitente}</span>
              </div>

              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-[10px] font-black uppercase text-[var(--text3)]">Destinatarios (CCO)</span>
                <span className="text-xs font-bold text-[var(--text)]">
                  {sentDetails.destinatariosCount} cuentas notificadas
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-[10px] font-black uppercase text-[var(--text3)]">Asunto</span>
                <span className="text-xs font-black text-[var(--text)]">{sentDetails.asunto}</span>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-[var(--text3)] block mb-2">Mensaje Transmitido</span>
                <div className="p-4 rounded-xl bg-[var(--bg2)] border border-[var(--border)] text-xs text-[var(--text)] font-semibold whitespace-pre-wrap leading-relaxed">
                  {sentDetails.mensaje}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => copyToClipboard(sentDetails.destinatarios.join(", "), "bcc")}
                className="p-3.5 rounded-2xl bg-[var(--bg3)] border border-[var(--border)] hover:border-[var(--verde-border)] hover:bg-[var(--verde-bg)] hover:text-[var(--verde)] text-[var(--text)] font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedBcc ? <Check size={16} className="text-[var(--verde)]" /> : <Copy size={16} />}
                <span>{copiedBcc ? "Correos Copiados" : "Copiar Correos Destino"}</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(`${sentDetails.asunto}\n\n${sentDetails.mensaje}`, "msg")}
                className="p-3.5 rounded-2xl bg-[var(--bg3)] border border-[var(--border)] hover:border-[var(--verde-border)] hover:bg-[var(--verde-bg)] hover:text-[var(--verde)] text-[var(--text)] font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedMsg ? <Check size={16} className="text-[var(--verde)]" /> : <Copy size={16} />}
                <span>{copiedMsg ? "Mensaje Copiado" : "Copiar Texto de Comunicado"}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold text-xs hover:bg-[var(--bg3)] transition-all active:scale-95 cursor-pointer"
              >
                + Enviar Otro Comunicado
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black text-xs shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        ) : (
          /* FORM COMPOSER IN-APP */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Target Group */}
            <div>
              <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-3 block">
                Grupo de Destinatarios
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: "todos", label: "Todos" },
                  { id: "alumnos", label: "Alumnos" },
                  { id: "profesores", label: "Profesores" },
                  { id: "usuarios", label: "Usuarios Reg." },
                  { id: "curso", label: "Por Curso" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDestino(opt.id as any)}
                    className={`p-3 rounded-xl border font-bold text-xs transition-all active:scale-95 text-center cursor-pointer ${
                      destino === opt.id
                        ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] shadow-sm"
                        : "bg-[var(--bg3)] text-[var(--text2)] border-[var(--border)] hover:border-[var(--text3)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Course Dropdown */}
            {destino === "curso" && (
              <div className="animate-fade-in">
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-2 block">
                  Seleccionar Curso
                </label>
                <select
                  required
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-xs text-[var(--text)] focus:border-[var(--verde)] transition-all"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">Elegí un curso...</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Recipient Counter Preview */}
            <div className="bg-[var(--bg3)]/50 border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between">
              <span className="text-xs text-[var(--text2)] font-bold">
                Destinatarios detectados con correo:
              </span>
              <span className="px-3 py-1 bg-[var(--bg4)] border border-[var(--border)] rounded-lg text-xs font-black text-[var(--verde)]">
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
                placeholder="Ej: Suspensión de clases / Reunión de padres"
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all text-sm text-[var(--text)]"
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
                rows={6}
                placeholder="Escribí aquí el aviso institucional..."
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all text-sm text-[var(--text)] resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* Privacy & Security Note */}
            <div className="p-3 bg-[var(--bg3)] border border-[var(--border)] rounded-xl text-[10px] text-[var(--text3)] font-semibold leading-relaxed flex items-center gap-2">
              <ShieldCheck size={16} className="text-[var(--verde)] shrink-0" />
              <span>
                El correo se enviará **100% dentro de EscuelaInfo** a través de nuestro servidor API sin abrir aplicaciones o pestañas externas de Gmail.
              </span>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-4 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] transition-all active:scale-95 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Enviando Correo In-App...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Enviar Correo Directo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
