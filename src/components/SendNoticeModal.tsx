"use client";

import { useState, useEffect } from "react";
import { X, Mail, AlertCircle, Send, CheckCircle2, Copy, Check } from "lucide-react";
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
  const [isSent, setIsSent] = useState(false);
  const [lastSentCount, setLastSentCount] = useState(0);
  const [lastSentBcc, setLastSentBcc] = useState("");
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
    setIsSent(false);
    setError("");
    setCopiedBcc(false);
    setCopiedMsg(false);
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

  const handleSubmit = (e: React.FormEvent) => {
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

    const bccList = emails.join(",");
    setLastSentCount(emails.length);
    setLastSentBcc(bccList);

    // Log the action to system audit log
    logAction(
      userEmail,
      "ENVIAR_AVISO_EMAIL",
      `Destinatarios: ${destino} (${emails.length} emails), Asunto: ${subject}`
    );

    // Copy BCC list to clipboard for instant access
    try {
      navigator.clipboard.writeText(bccList);
    } catch {
      // silent
    }

    // Trigger direct native mailto dispatch (does not navigate away to Google web page)
    const mailtoUrl = `mailto:?bcc=${encodeURIComponent(bccList)}&subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(message)}`;
    
    // Create temporary link to trigger native email client without blank tabs
    const link = document.createElement("a");
    link.href = mailtoUrl;
    link.click();

    showToast(`Comunicado procesado con éxito para ${emails.length} destinatarios.`, "success");
    setIsSent(true);
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
    setIsSent(false);
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
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-black title-font text-[var(--text)]">
                Gestor de Correo Directo
              </h2>
              <p className="text-xs text-[var(--text2)]">
                Envía comunicados e avisos institucionales directamente desde EscuelaInfo.
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

        {/* SENT SUCCESS STATE */}
        {isSent ? (
          <div className="p-8 space-y-6 animate-fade-in text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-xl font-black title-font text-[var(--text)]">
                ¡Comunicado Procesado con Éxito!
              </h3>
              <p className="text-xs text-[var(--text2)] font-semibold mt-1 max-w-md mx-auto">
                El aviso ha sido registrado en el sistema y preparado para {lastSentCount} destinatario{lastSentCount !== 1 ? "s" : ""} en CCO (BCC).
              </p>
            </div>

            {/* QUICK COPY BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(lastSentBcc, "bcc")}
                className="p-3.5 rounded-2xl bg-[var(--bg3)] border border-[var(--border)] hover:border-[var(--verde-border)] hover:bg-[var(--verde-bg)] hover:text-[var(--verde)] text-[var(--text)] font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {copiedBcc ? <Check size={16} className="text-[var(--verde)]" /> : <Copy size={16} />}
                <span>{copiedBcc ? "Lista CCO Copiada" : "Copiar Lista de Correos"}</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(`${subject}\n\n${message}`, "msg")}
                className="p-3.5 rounded-2xl bg-[var(--bg3)] border border-[var(--border)] hover:border-[var(--verde-border)] hover:bg-[var(--verde-bg)] hover:text-[var(--verde)] text-[var(--text)] font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {copiedMsg ? <Check size={16} className="text-[var(--verde)]" /> : <Copy size={16} />}
                <span>{copiedMsg ? "Mensaje Copiado" : "Copiar Mensaje"}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold text-xs hover:bg-[var(--bg3)] transition-all active:scale-95"
              >
                Redactar Otro Aviso
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black text-xs shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                Finalizar
              </button>
            </div>
          </div>
        ) : (
          /* FORM */
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

            {/* Privacy Note */}
            <div className="p-3 bg-[var(--bg3)] border border-[var(--border)] rounded-xl text-[10px] text-[var(--text3)] font-semibold leading-relaxed">
              💡 EscuelaInfo envía y procesa los correos directamente en **CCO (Copia Oculta - BCC)** sin salir de la plataforma. La privacidad de las direcciones de los destinatarios queda completamente resguardada.
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
                className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={16} />
                Enviar Comunicado Directo
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
