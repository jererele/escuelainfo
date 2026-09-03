"use client";

import { useState } from "react";
import { Mail, Send, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import { logAction } from "@/lib/dataService";

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
      // Registrar la consulta en la auditoría del sistema
      await logAction(
        form.email,
        "CONSULTA_CONTACTO",
        `Nombre: ${form.nombre}, Mensaje: ${form.mensaje.slice(0, 80)}...`
      );

      // Disparo de correo mediante protocolo mailto nativo (sin abrir pestañas web de Gmail)
      const mailtoUrl = `mailto:skbcraft.info@gmail.com?subject=${encodeURIComponent(
        `Consulta de ${form.nombre} (${form.email})`
      )}&body=${encodeURIComponent(
        `De: ${form.nombre} <${form.email}>\n\nMensaje:\n${form.mensaje}`
      )}`;
      
      const link = document.createElement("a");
      link.href = mailtoUrl;
      link.click();

      // Reset de campos y confirmación in-app inmediata
      setForm(INITIAL_STATE);
      setSent(true);
      showToast("¡Consulta procesada correctamente!", "success");

      setTimeout(() => setSent(false), 5000);
    } catch {
      setError("Ocurrió un error al procesar tu consulta. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[var(--bg3)]/80 backdrop-blur-md p-8 rounded-[32px] border border-[var(--border)] shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="text-[var(--verde)]" size={20} />
        <h2 className="title-font font-black text-xl text-[var(--text)]">Envío de Consultas Directas</h2>
      </div>
      <p className="text-xs font-bold text-[var(--text2)] mb-5">
        Envianos tus sugerencias, reportes o consultas administrativas directamente desde aquí.
      </p>

      {/* Feedback de éxito in-app */}
      {sent && (
        <div className="flex items-center gap-3 bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] px-4 py-3.5 rounded-2xl text-xs font-bold mb-4 animate-fade-in shadow-xs">
          <CheckCircle2 size={18} className="shrink-0 text-[var(--verde)]" />
          <span>¡Consulta registrada y enviada con éxito! Los campos se limpiaron automáticamente.</span>
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
          className="w-full bg-[var(--verde)] text-black font-black text-xs px-4 py-3 rounded-xl hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send size={14} />
          {sending ? "Enviando..." : "Enviar Consulta Directa"}
        </button>
      </form>
    </div>
  );
}
