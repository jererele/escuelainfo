"use client";

import { useState } from "react";
import { Mail, Send, AlertCircle, CheckCircle2, Loader2, Inbox } from "lucide-react";
import { logAction } from "@/lib/dataService";

interface Props {
  showToast: (msg: string, type: "success" | "error") => void;
}

const INITIAL_STATE = { nombre: "", email: "", mensaje: "" };

export default function ContactForm({ showToast }: Props) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [sending, setSending] = useState(false);
  const [sentDetails, setSentDetails] = useState<any | null>(null);
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
      // Envío directo in-app a la API sin abrir navegador ni aplicaciones externas
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinatarios: ["skbcraft.info@gmail.com"],
          asunto: `Consulta de ${form.nombre} (${form.email})`,
          mensaje: `De: ${form.nombre} <${form.email}>\n\nMensaje:\n${form.mensaje}`,
          remitente: form.email,
          tipo: "CONSULTA_DIRECTA",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al procesar el correo.");
      }

      // Registrar la consulta en la auditoría del sistema
      await logAction(
        form.email,
        "CONSULTA_CONTACTO",
        `Nombre: ${form.nombre}, Mensaje: ${form.mensaje.slice(0, 80)}...`
      );

      setSentDetails(data.detalles);
      setForm(INITIAL_STATE);
      showToast("¡Consulta enviada con éxito desde el apartado interno!", "success");
    } catch {
      setError("Ocurrió un error al procesar tu consulta. Intentá de nuevo.");
      showToast("Error al enviar la consulta.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[var(--bg3)]/80 backdrop-blur-md p-8 rounded-[32px] border border-[var(--border)] shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="text-[var(--verde)]" size={20} />
        <h2 className="title-font font-black text-xl text-[var(--text)]">
          Apartado de Envío de Consultas Directas
        </h2>
      </div>
      <p className="text-xs font-bold text-[var(--text2)] mb-5">
        Envianos tus sugerencias, reportes o consultas administrativas directamente sin salir de EscuelaInfo.
      </p>

      {/* APARTADO DE MESA DE SALIDA DE CORREO ENVIADO (IN-APP) */}
      {sentDetails ? (
        <div className="bg-[var(--bg2)] border border-[var(--verde-border)] p-6 rounded-2xl space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 text-[var(--verde)]">
            <CheckCircle2 size={24} className="shrink-0" />
            <div>
              <h3 className="font-black text-sm text-[var(--text)]">
                ¡Consulta Entregada con Éxito!
              </h3>
              <p className="text-[11px] text-[var(--text2)] font-semibold">
                Procesada el {sentDetails.fechaEnvio} dentro de la misma página.
              </p>
            </div>
          </div>

          <div className="bg-[var(--bg3)] p-4 rounded-xl border border-[var(--border)] text-xs space-y-2 font-semibold">
            <div className="flex justify-between">
              <span className="text-[var(--text3)] font-bold">De:</span>
              <span className="text-[var(--text)]">{sentDetails.remitente}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text3)] font-bold">Para:</span>
              <span className="text-[var(--verde)]">skbcraft.info@gmail.com</span>
            </div>
            <div className="border-t border-[var(--border)] pt-2 mt-2 text-[var(--text2)]">
              {sentDetails.mensaje}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSentDetails(null)}
            className="w-full bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] font-bold text-xs px-4 py-3 rounded-xl hover:bg-[var(--verde)] hover:text-black transition-all cursor-pointer"
          >
            + Enviar Otra Consulta
          </button>
        </div>
      ) : (
        /* FORMULARIO DE CONSULTA IN-PAGE */
        <>
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
              {sending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Enviando Consulta...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Enviar Consulta Directa</span>
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
