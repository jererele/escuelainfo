"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { 
  X, 
  QrCode, 
  Printer, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  MapPin, 
  Sparkles,
  ExternalLink 
} from "lucide-react";
import { MesaExamen } from "@/lib/dataService";
import { notify } from "@/lib/notify";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mesa: MesaExamen | null;
}

export default function MesaQRModal({ isOpen, onClose, mesa }: Props) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mesa || !mounted || typeof document === "undefined" || !document.body) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const scanUrl = `${origin}/scan?mesaId=${encodeURIComponent(mesa.id || "")}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(scanUrl);
      setCopied(true);
      notify.success("Enlace de inscripción copiado al portapapeles");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      notify.error("No se pudo copiar el enlace.");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) {
      alert("Por favor habilita las ventanas emergentes para imprimir el cartel del aula.");
      return;
    }

    const inscriptosCount = (mesa.alumnosInscriptos || []).length;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mesa de Examen - ${mesa.materia}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 20mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; color: #111; text-align: center; }
            .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 24px; }
            .title { font-size: 26px; font-weight: 900; margin: 0; text-transform: uppercase; }
            .school { font-size: 14px; font-weight: 700; color: #555; margin-top: 4px; }
            .badge { display: inline-block; background: #eee; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 13px; margin: 12px 0; text-transform: uppercase; }
            .details { margin: 20px auto; max-width: 480px; text-align: left; background: #f9f9f9; padding: 18px 24px; border-radius: 12px; border: 1px solid #ddd; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 15px; }
            .label { font-weight: 800; color: #444; }
            .val { font-weight: 600; }
            .qr-container { margin: 30px auto; padding: 20px; display: inline-block; border: 2px dashed #000; border-radius: 16px; }
            .instructions { font-size: 16px; font-weight: 800; margin-top: 15px; }
            .sub { font-size: 12px; color: #666; max-width: 420px; margin: 8px auto; }
            .footer { margin-top: 40px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">ESCUELA N° 713 "JUAN ABDALA CHAYEP"</h1>
            <div class="school">Tribunal Examinador · Planilla Oficial de Asistencia y Examen</div>
            <div class="badge">Inscripción y Presente por Código QR</div>
          </div>

          <h2 style="font-size: 32px; margin: 10px 0; font-weight: 900;">${mesa.materia}</h2>

          <div class="details">
            <div class="row"><span class="label">Fecha:</span><span class="val">${mesa.fecha}</span></div>
            <div class="row"><span class="label">Horario:</span><span class="val">${mesa.hora} hs</span></div>
            <div class="row"><span class="label">Aula:</span><span class="val">${mesa.aula}</span></div>
            <div class="row"><span class="label">Presidente de Mesa:</span><span class="val">${mesa.presidenteNombre}</span></div>
            ${mesa.vocal1Nombre ? `<div class="row"><span class="label">Vocal 1:</span><span class="val">${mesa.vocal1Nombre}</span></div>` : ""}
            ${mesa.vocal2Nombre ? `<div class="row"><span class="label">Vocal 2:</span><span class="val">${mesa.vocal2Nombre}</span></div>` : ""}
            <div class="row" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #ccc;"><span class="label">Inscriptos actuales:</span><span class="val">${inscriptosCount} alumno(s)</span></div>
          </div>

          <div class="qr-container">
            <div id="print-qr"></div>
          </div>

          <div class="instructions">Escaneá con tu celular para completar tu inscripción automáticamente</div>
          <div class="sub">Si ya iniciaste sesión en EscuelaInfo, tus datos (Nombre, DNI y Curso) se cargarán al instante sin que tengas que reescribirlos.</div>

          <div class="footer">
            Sistema Oficial EscuelaInfo · Generado el ${new Date().toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR")}
          </div>

          <script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
          <script>
            QRCode.toCanvas("${scanUrl}", { width: 280, margin: 1 }, function (err, canvas) {
              if (!err) {
                document.getElementById('print-qr').appendChild(canvas);
                setTimeout(function() { window.print(); }, 400);
              }
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-[var(--bg)] border border-[var(--border)] rounded-[32px] shadow-2xl overflow-hidden animate-zoom-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg2)]/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] shrink-0 shadow-sm">
              <QrCode size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black title-font text-[var(--text)]">
                QR de Mesa de Examen
              </h2>
              <p className="text-xs font-bold text-[var(--text3)] uppercase tracking-wider">
                Proyección y autocompletado de planilla
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] hover:text-[var(--text)] transition-colors active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido Central */}
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--verde)] bg-[var(--verde-bg)] border border-[var(--verde-border)] px-3 py-1 rounded-full inline-block">
              {mesa.aula} · {mesa.fecha} ({mesa.hora} hs)
            </span>
            <h3 className="text-2xl font-black text-[var(--text)] mt-1">{mesa.materia}</h3>
            <p className="text-xs font-semibold text-[var(--text2)]">
              Presidente: <span className="font-bold text-[var(--text)]">{mesa.presidenteNombre}</span>
            </p>
          </div>

          {/* Cuadro del Código QR */}
          <div className="p-5 bg-white rounded-3xl border-4 border-[var(--verde-border)] shadow-xl flex flex-col items-center justify-center">
            <QRCodeSVG
              value={scanUrl}
              size={220}
              level="H"
              includeMargin={false}
            />
            <div className="mt-3 flex items-center gap-1.5 text-slate-800 text-[11px] font-black tracking-wide uppercase">
              <Sparkles size={13} className="text-emerald-600" />
              <span>EscuelaInfo · Mesa Oficial</span>
            </div>
          </div>

          {/* Contador en vivo de inscriptos */}
          <div className="w-full flex items-center justify-between p-3.5 bg-[var(--bg3)] border border-[var(--border)] rounded-2xl text-xs">
            <div className="flex items-center gap-2 text-[var(--text)] font-bold">
              <Users size={16} className="text-[var(--verde)]" />
              <span>Inscriptos en Planilla:</span>
            </div>
            <span className="font-black px-2.5 py-0.5 rounded-lg bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] text-sm">
              {(mesa.alumnosInscriptos || []).length} alumno(s)
            </span>
          </div>

          <p className="text-xs text-[var(--text2)] font-semibold max-w-sm">
            Proyectá este código en pantalla o mostralo a los alumnos. Al escanearlo con la app o su cámara, sus datos se completan automáticamente en la planilla sin reescribir nada.
          </p>
        </div>

        {/* Footer con Botones de Acción */}
        <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--bg2)]/60 flex flex-col sm:flex-row items-center gap-2.5 justify-between">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg3)] hover:bg-[var(--bg4)] font-bold text-xs text-[var(--text)] transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            {copied ? <Check size={16} className="text-[var(--verde)]" /> : <Copy size={16} />}
            <span>{copied ? "¡Enlace Copiado!" : "Copiar Enlace de Inscripción"}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-[var(--verde)] text-black font-black text-xs hover:brightness-110 shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Printer size={16} />
              <span>Imprimir Cartel</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--bg3)] hover:bg-[var(--bg4)] font-bold text-xs text-[var(--text)] transition-all active:scale-95"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
