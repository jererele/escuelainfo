"use client";

import { useState } from "react";
import { Mail, Send, Check, AlertCircle } from "lucide-react";

interface Props {
  showToast: (msg: string, type: "success" | "error") => void;
}

const INITIAL_STATE = { nombre: "", email: "", mensaje: "" };

export default function ContactForm({ showToast }: Props) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!form.nombre.trim()) {
      setError("Por favor ingresá tu nombre.");
      return;
    }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      setError("Ingresá un correo electrónico válido.");
      return;
    }
    if (!form.mensaje.trim() || form.mensaje.trim().length < 10) {
      setError("El mensaje debe tener al menos 10 caracteres.");
      return;
    }

    setSending(true);
    try {
      // Abre Gmail Compose con los datos pre-completados
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=skbcraft.info@gmail.com&su=${encodeURIComponent(
        `Consulta de ${form.nombre} (${form.email})`
      )}&body=${encodeURIComponent(
        `De: ${form.nombre} <${form.email}>\n\n${form.mensaje}`
      )}`;
      window.open(gmailUrl, "_blank", "noopener,noreferrer");

      // ✅ RESET INMEDIATO DE TODOS LOS CAMPOS
      setForm(INITIAL_STATE);
      setSent(true);
      showToast("¡Consulta enviada! Redirigiendo a Gmail.", "success");

      // Ocultar mensaje de éxito después de 4s
      setTimeout(() => setSent(false), 4000);
    } catch {
      setError("Ocurrió un error al procesar tu consulta. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card glass p-8 rounded-[32px] border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="text-[var(--verde)]" size={20} />
        <h2 className="title-font font-black text-xl">Email de Consultas</h2>
      </div>
      <p className="text-xs font-bold text-[var(--text2)] mb-5">
        Envianos tus sugerencias, reportes o consultas administrativas.
      </p>

      {/* Feedback de éxito */}
      {sent && (
        <div className="flex items-center gap-2 bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] px-4 py-3 rounded-xl text-xs font-semibold mb-4 animate-fade-in">
          <Check size={14} className="shrink-0" />
          ¡Mensaje enviado! Los campos fueron limpiados automáticamente.
        </div>
      )}

      {/* Feedback de error */}
      {error && (
        <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold mb-4 animate-fade-in">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="cf-nombre" className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block">
              Tu Nombre *
            </label>
            <input
              id="cf-nombre"
              name="nombre"
              type="text"
              required
              placeholder="Juan Pérez"
              value={form.nombre}
              onChange={handleChange}
              className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-[var(--verde)] outline-none transition-colors w-full text-[var(--text)]"
            />
          </div>
          <div>
            <label htmlFor="cf-email" className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block">
              Tu Correo *
            </label>
            <input
              id="cf-email"
              name="email"
              type="email"
              required
              placeholder="juan@gmail.com"
              value={form.email}
              onChange={handleChange}
              className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs font-semibold focus:border-[var(--verde)] outline-none transition-colors w-full text-[var(--text)]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="cf-mensaje" className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block">
            Mensaje *
          </label>
          <textarea
            id="cf-mensaje"
            name="mensaje"
            required
            rows={4}
            placeholder="¿En qué te podemos ayudar?"
            value={form.mensaje}
            onChange={handleChange}
            className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs font-semibold focus:border-[var(--verde)] outline-none transition-colors w-full resize-none text-[var(--text)]"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full bg-[var(--verde)] text-black font-black text-xs px-4 py-3 rounded-xl hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send size={14} />
          {sending ? "Enviando..." : "Enviar Consulta"}
        </button>
      </form>
    </div>
  );
}
