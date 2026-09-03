"use client";

import { useEffect, useState, useMemo } from "react";
import { X, QrCode, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { UserProfile, Profesor, getProfesores } from "@/lib/dataService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
}

export default function DynamicQRModal({ isOpen, onClose, userProfile }: Props) {
  const [token, setToken] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);
  const [mode, setMode] = useState<"jornada" | "materia">("jornada");
  const [selectedMateria, setSelectedMateria] = useState("");
  const [profesores, setProfesores] = useState<Profesor[]>([]);

  useEffect(() => {
    if (isOpen) {
      getProfesores().then(setProfesores);
    }
  }, [isOpen]);

  const currentProfesor = useMemo(() => {
    if (!userProfile) return null;
    return profesores.find(p => p.email.toLowerCase() === userProfile.email.toLowerCase()) || null;
  }, [userProfile, profesores]);

  useEffect(() => {
    if (userProfile?.rol === "profesor") {
      setMode("materia");
      if (currentProfesor?.materias.length && !selectedMateria) {
        setSelectedMateria(currentProfesor.materias[0]);
      }
    }
  }, [userProfile, currentProfesor, selectedMateria]);

  // Generate new token every 15 seconds
  useEffect(() => {
    if (!isOpen) return;

    const generateToken = () => {
      const payload = {
        t: Date.now(),
        m: mode,
        s: mode === "materia" ? selectedMateria : "jornada",
        p: userProfile?.id || "admin" // issuer
      };
      // Base64 encode the payload. In production, this should be a signed JWT.
      const encoded = btoa(JSON.stringify(payload));
      setToken(encoded);
      setTimeLeft(15);
    };

    generateToken();
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateToken();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, mode, selectedMateria, userProfile]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const qrUrl = typeof window !== "undefined" 
    ? window.location.href.split('?')[0].replace(/\/dashboard\/?$/, "/scan") + `?token=${token}` 
    : "";
  const canSelectJornada = userProfile?.rol === "admin" || userProfile?.rol === "directivo" || userProfile?.rol === "preceptor";

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[var(--bg)] w-full max-w-sm rounded-[32px] border border-[var(--border)] shadow-2xl overflow-hidden animate-zoom-in">
        <div className="p-6 border-b border-[var(--border)] bg-[var(--bg2)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)]">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="font-black text-[var(--text)] text-lg leading-tight">Asistencia QR</h3>
              <p className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider mt-0.5">Dinámico & Seguro</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center space-y-6">
          <div className="w-full space-y-2">
            <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text3)] ml-1">Tipo de Asistencia</label>
            <select
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3 outline-none font-bold text-[var(--text)] text-sm focus:border-[var(--verde)] transition-colors appearance-none"
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              disabled={!canSelectJornada && userProfile?.rol === "profesor"}
            >
              {canSelectJornada && <option value="jornada">Jornada General</option>}
              {(userProfile?.rol === "profesor" || canSelectJornada) && <option value="materia">Por Materia</option>}
            </select>
          </div>

          {mode === "materia" && currentProfesor && (
            <div className="w-full space-y-2">
              <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text3)] ml-1">Seleccionar Materia</label>
              <select
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3 outline-none font-bold text-[var(--text)] text-sm focus:border-[var(--verde)] transition-colors appearance-none"
                value={selectedMateria}
                onChange={(e) => setSelectedMateria(e.target.value)}
              >
                {currentProfesor.materias.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
                {currentProfesor.materias.length === 0 && <option value="">Sin materias asignadas</option>}
              </select>
            </div>
          )}

          <div className="bg-white p-4 rounded-[28px] shadow-sm border-[4px] border-[var(--verde-bg)]">
            <QRCodeSVG value={qrUrl} size={200} level="H" includeMargin={false} />
          </div>
          
          <div className="flex items-center gap-2 bg-[var(--bg3)] px-4 py-2 rounded-xl border border-[var(--border)]">
            <Clock size={14} className="text-[var(--text2)]" />
            <span className="text-xs font-bold font-mono text-[var(--text)]">Expira en: <span className={timeLeft <= 5 ? "text-[var(--rojo)]" : "text-[var(--verde)]"}>00:{timeLeft.toString().padStart(2, '0')}</span></span>
          </div>

          <p className="text-xs text-[var(--text2)] font-semibold text-center leading-relaxed max-w-[250px]">
            Los alumnos deben escanear este código con su celular para registrar su <span className="text-[var(--verde)] font-bold">presente</span> automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
