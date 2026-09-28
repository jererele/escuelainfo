"use client";

import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { 
  X, 
  QrCode, 
  GraduationCap, 
  CheckCircle2, 
  Sparkles, 
  Download, 
  IdCard, 
  Mail, 
  ShieldCheck 
} from "lucide-react";
import { Alumno, UserProfile } from "@/lib/dataService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  alumno: Alumno | null;
}

export default function StudentExamQRModal({ isOpen, onClose, userProfile, alumno }: Props) {
  if (!isOpen) return null;

  const nombre = alumno?.nombre || userProfile?.nombre || "Estudiante";
  const dni = alumno?.dni || "—";
  const curso = alumno?.curso || "Sin curso asignado";
  const email = alumno?.email || userProfile?.email || "—";

  const qrPayload = JSON.stringify({
    type: "alumno_credencial",
    dni,
    nombre,
    curso,
    email,
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md bg-[var(--bg)] border border-[var(--border)] rounded-[32px] shadow-2xl overflow-hidden animate-zoom-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg2)]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] shrink-0 shadow-sm">
              <IdCard size={20} />
            </div>
            <div>
              <h2 className="text-base font-black title-font text-[var(--text)]">
                Credencial Digital de Examen
              </h2>
              <p className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider">
                Presentación y código de alumno
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] hover:text-[var(--text)] transition-colors active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Ficha de Credencial */}
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          {/* Tarjeta de Identificación */}
          <div className="w-full bg-gradient-to-br from-emerald-500/10 via-[var(--bg3)] to-emerald-500/5 border border-emerald-500/20 rounded-3xl p-5 shadow-inner space-y-4">
            <div className="flex items-center justify-between text-left">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-[var(--verde)] flex items-center gap-1">
                  <ShieldCheck size={12} />
                  <span>Escuela N° 713 · Chubut</span>
                </span>
                <h3 className="text-lg font-black text-[var(--text)] mt-0.5">{nombre}</h3>
                <p className="text-xs font-semibold text-[var(--text2)]">Curso: <span className="font-bold text-[var(--text)]">{curso}</span></p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] font-black text-lg shadow-sm">
                {nombre.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
              <div className="text-left">
                <span className="text-[9px] uppercase font-black text-[var(--text3)] block">DNI Oficial</span>
                <span className="font-black text-[var(--text)] tracking-wider">{dni}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-black text-[var(--text3)] block">Estado</span>
                <span className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-1 justify-end">
                  <CheckCircle2 size={11} /> Regular
                </span>
              </div>
            </div>
          </div>

          {/* QR de Credencial */}
          <div className="p-4 bg-white rounded-3xl border-4 border-[var(--verde-border)] shadow-xl flex flex-col items-center justify-center">
            <QRCodeSVG
              value={qrPayload}
              size={190}
              level="H"
              includeMargin={false}
            />
            <div className="mt-2.5 flex items-center gap-1.5 text-slate-800 text-[10px] font-black tracking-wide uppercase">
              <Sparkles size={12} className="text-emerald-600" />
              <span>Código Verificado · Exámenes</span>
            </div>
          </div>

          <p className="text-xs text-[var(--text2)] font-semibold max-w-xs">
            Mostrá este código al tribunal examinador o preceptor para que lo escanee y arme la planilla al instante.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg2)]/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[var(--verde)] text-black font-black text-xs hover:brightness-110 shadow-sm transition-all active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
