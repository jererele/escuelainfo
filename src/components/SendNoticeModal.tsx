"use client";

import { useState, useEffect } from "react";
import { X, Mail, AlertCircle, Send } from "lucide-react";
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
  showToast
}: Props) {
  const [destino, setDestino] = useState<"todos" | "alumnos" | "profesores" | "curso" | "usuarios">("todos");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("desconocido");

  useEffect(() => {
    if (isOpen) {
      account.get()
        .then(user => setUserEmail(user.email))
        .catch(() => setUserEmail("desconocido"));
    }
  }, [isOpen]);

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
      return alumnos.filter(a => a.curso === selectedCourse && a.email).length;
    }
    return 0;
  };

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

    let emails: string[] = [];
    if (destino === "todos") {
      const all = [
        ...alumnos.map(a => a.email),
        ...profesores.map(p => p.email),
        ...usuarios.map(u => u.email)
      ];
      emails = Array.from(new Set(all.filter(Boolean)));
    } else if (destino === "alumnos") {
      emails = alumnos.map(a => a.email).filter(Boolean);
    } else if (destino === "profesores") {
      emails = profesores.map(p => p.email).filter(Boolean);
    } else if (destino === "usuarios") {
      emails = usuarios.map(u => u.email).filter(Boolean);
    } else if (destino === "curso") {
      if (!selectedCourse) {
        setError("Por favor seleccioná un curso.");
        return;
      }
      emails = alumnos.filter(a => a.curso === selectedCourse).map(a => a.email).filter(Boolean);
    }

    if (emails.length === 0) {
      setError("No hay destinatarios válidos con correo registrado para enviar.");
      return;
    }

    // Construct Gmail Web Compose Link with BCC for security/privacy
    const bccList = emails.join(",");
    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(bccList)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

    // Log the notification dispatch
    logAction(
      userEmail,
      "ENVIAR_AVISO_EMAIL",
      `Destinatarios: ${destino} (${emails.length} emails), Asunto: ${subject}`
    );

    // Copy to clipboard as helper/fallback
    try {
      navigator.clipboard.writeText(bccList);
    } catch (err) {
      // silent
    }

    // Open Gmail Compose directly in a new tab (exactly like Classroom)
    window.open(gmailComposeUrl, "_blank", "noopener,noreferrer");
    showToast(`Redirigiendo a Gmail con ${emails.length} destinatarios en CCO (BCC).`, "success");

    // Clean inputs
    setSubject("");
    setMessage("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--bg)] w-full max-w-2xl rounded-[32px] border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* HEADER */}
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center sticky top-0 bg-[var(--bg)] z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--verde-bg)] text-[var(--verde)] rounded-xl border border-[var(--verde-border)]">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-black title-font text-[var(--text)]">Enviar Aviso por Mail</h2>
              <p className="text-xs text-[var(--text2)]">Envía comunicados a cuentas registradas en EscuelaInfo.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-5 flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                { id: "curso", label: "Por Curso" }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDestino(opt.id as any)}
                  className={`p-3 rounded-xl border font-bold text-xs transition-all active:scale-95 text-center ${
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
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] transition-all"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">Elegí un curso...</option>
                {cursos.map(c => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recipient Counter Preview */}
          <div className="bg-[var(--bg3)]/50 border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between">
            <span className="text-xs text-[var(--text2)] font-bold">Destinatarios detectados con correo:</span>
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
            💡 Para proteger la privacidad de los destinatarios, EscuelaInfo enviará automáticamente todos los correos en **CCO (Copia de Correo Oculta - BCC)**. Nadie podrá ver las direcciones de correo de otros usuarios.
          </div>

          {/* ACTIONS */}
          <div className="flex gap-4 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Send size={16} />
              Enviar Comunicado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
