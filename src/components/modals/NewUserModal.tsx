"use client";

import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { promoteUserToRole, logAction, requestAdminOtpApi } from "@/lib/dataService";
import { UserProfile } from "@/lib/dataService";
import { 
  X, 
  AlertCircle, 
  ShieldAlert, 
  Mail, 
  Send, 
  Loader2, 
  Check, 
  RefreshCw, 
  KeyRound,
  ShieldCheck
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserRole: string;
}

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function NewUserModal({ isOpen, onClose, onSuccess, currentUserRole }: Props) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const isDirectivoOrAdmin = currentUserRole === "admin" || currentUserRole === "directivo";
  const [rol, setRol] = useState<UserProfile["rol"]>(isDirectivoOrAdmin ? "preceptor" : "profesor");
  const [error, setError] = useState("");

  // Estados para validación OTP de Administrador (jeree.castroo10@gmail.com)
  const [adminOtpCode, setAdminOtpCode] = useState("");
  const [adminOtpToken, setAdminOtpToken] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setRol(isDirectivoOrAdmin ? "preceptor" : "profesor");
      setError("");
      setAdminOtpCode("");
      setAdminOtpToken("");
      setIsSendingOtp(false);
      setOtpSent(false);
      setOtpCooldown(0);
      setOtpSuccessMessage("");
      return;
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, isDirectivoOrAdmin]);

  // Temporizador para reenvío de código OTP
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  if (!isOpen) return null;

  const handleSendAdminOtp = async () => {
    setError("");
    setOtpSuccessMessage("");
    if (!email) {
      setError("Por favor primero ingresá el correo del nuevo colaborador.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("El correo del colaborador debe tener un formato válido.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await requestAdminOtpApi(email, "Nuevo Administrador");
      if (res.success) {
        setOtpSent(true);
        if (res.token) setAdminOtpToken(res.token);
        setOtpSuccessMessage(res.message || "Código enviado a jeree.castroo10@gmail.com");
        setOtpCooldown(60);
      } else {
        setError(res.error || "No se pudo enviar el código a jeree.castroo10@gmail.com");
      }
    } catch (err: any) {
      setError(err?.message || "Error al solicitar código de verificación.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) { setError("Por favor ingresá un email."); return; }
    if (!isValidEmail(email)) { setError("El formato del email no es válido."); return; }

    if (!isDirectivoOrAdmin && rol === "preceptor") {
      setError("No tenés permisos para designar usuarios como preceptor.");
      return;
    }

    // Salvaguarda: Exigir código OTP si se agrega un Administrador
    if (rol === "admin") {
      if (!otpSent) {
        setError("Para agregar un Administrador debés solicitar el código de verificación para jeree.castroo10@gmail.com");
        return;
      }
      if (!adminOtpCode || adminOtpCode.trim().length !== 6) {
        setError("Ingresá el código numérico de 6 dígitos enviado a jeree.castroo10@gmail.com");
        return;
      }
    }

    setLoading(true);
    try {
      await promoteUserToRole(
        email, 
        rol, 
        rol === "admin" ? adminOtpCode.trim() : undefined,
        rol === "admin" ? adminOtpToken : undefined
      );

      let userEmail = "desconocido";
      try { const user = await account.get(); userEmail = user.email; } catch { /* silent */ }
      await logAction(
        userEmail, 
        rol === "admin" ? "PROMOTE_ADMIN" : "AUTORIZAR_COLABORADOR", 
        `Email: ${email}, Rol: ${rol}${rol === "admin" ? " [AUTORIZADO CON CÓDIGO OTP jeree.castroo10@gmail.com]" : ""}`
      );

      onSuccess(); 
      onClose();
      setEmail(""); 
      setRol(isDirectivoOrAdmin ? "preceptor" : "profesor");
      setAdminOtpCode("");
      setAdminOtpToken("");
      setOtpSent(false);
    } catch (err: any) { 
      setError(err?.message || "Error al autorizar al colaborador. Verificá los datos e intentá de nuevo."); 
    }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[var(--bg)] w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 border-t sm:border border-[var(--border)] shadow-2xl animate-zoom-in max-h-[90dvh] overflow-y-auto custom-scrollbar mt-auto sm:mt-0">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl font-black title-font text-[var(--text)]">Autorizar Acceso</h2>
            <p className="text-[var(--text2)] text-xs mt-1 font-bold uppercase tracking-wider">Dar rol a un nuevo colaborador</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all cursor-pointer"><X size={18} /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold mt-4">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Correo Gmail del Colaborador</label>
            <input required type="email" placeholder="ejemplo@gmail.com"
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Rol a Asignar</label>
            <select required
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all"
              value={rol} onChange={(e) => {
                const newRol = e.target.value as UserProfile["rol"];
                setRol(newRol);
                setError("");
              }}>
              {currentUserRole === "admin" && (
                <>
                  <option value="admin">Administrador (Acceso Total / Creador)</option>
                  <option value="directivo">Directivo / Director (Gestión Institucional)</option>
                </>
              )}
              {isDirectivoOrAdmin && (
                <option value="preceptor">Preceptor (Control de Asistencia y Cursos)</option>
              )}
              <option value="profesor">Profesor / Docente (Acceso Personal)</option>
            </select>
          </div>

          {/* VERIFICACIÓN OTP REQUERIDA PARA ROL ADMINISTRADOR */}
          {rol === "admin" && (
            <div className="p-4 rounded-2xl bg-[var(--rojo-bg)] border border-[var(--rojo-border)] space-y-3 animate-fade-in ring-1 ring-[var(--rojo)]/30">
              <div className="flex items-center gap-2 text-[var(--rojo)] font-black text-xs uppercase tracking-wider">
                <ShieldAlert size={16} strokeWidth={2.5} />
                <span>Autorización Obligatoria</span>
              </div>
              <p className="text-xs text-[var(--text)] leading-relaxed">
                Para autorizar a un nuevo Administrador, se requiere un código de verificación de 6 dígitos enviado a:
                <br />
                <span className="font-mono text-xs font-bold text-[var(--rojo)] bg-black/40 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 mt-1.5 border border-[var(--rojo-border)]">
                  <Mail size={13} />
                  jeree.castroo10@gmail.com
                </span>
              </p>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendAdminOtp}
                  disabled={isSendingOtp || !email}
                  className="w-full py-2.5 px-4 rounded-xl bg-[var(--rojo)] hover:brightness-110 active:scale-95 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Enviando código...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Enviar Código a jeree.castroo10@gmail.com</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                    <span className="text-[10px] font-black uppercase text-[var(--verde)] flex items-center gap-1">
                      <Check size={12} strokeWidth={3} />
                      Código enviado
                    </span>
                    <button
                      type="button"
                      onClick={handleSendAdminOtp}
                      disabled={isSendingOtp || otpCooldown > 0}
                      className="text-[10px] text-[var(--rojo)] hover:underline font-bold disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw size={11} className={isSendingOtp ? "animate-spin" : ""} />
                      {otpCooldown > 0 ? `Reenviar en ${otpCooldown}s` : "Reenviar código"}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      value={adminOtpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setAdminOtpCode(val);
                        if (error) setError("");
                      }}
                      placeholder="000000"
                      className="w-full bg-[var(--bg)] border-2 border-[var(--rojo-border)] focus:border-[var(--rojo)] text-[var(--rojo)] text-center text-2xl font-black font-mono tracking-[0.3em] rounded-xl py-2 px-3 outline-none transition-all placeholder:text-[var(--text3)]/40 shadow-inner"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)] pointer-events-none">
                      <KeyRound size={16} />
                    </div>
                  </div>
                  <p className="text-[10px] text-[var(--text3)] text-center">
                    Ingresá los 6 dígitos recibidos en jeree.castroo10@gmail.com
                  </p>
                </div>
              )}

              {otpSuccessMessage && !error && (
                <div className="p-2 rounded-xl bg-black/40 border border-[var(--verde-border)] text-[var(--verde)] text-xs font-semibold flex items-center gap-1.5">
                  <Check size={13} className="shrink-0" />
                  <span>{otpSuccessMessage}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] text-[var(--text)] transition-all active:scale-95 cursor-pointer">Cancelar</button>
            <button 
              type="submit" 
              disabled={loading || (rol === "admin" && (!otpSent || adminOtpCode.length !== 6))}
              className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2">
              {loading ? (
                "Autorizando..."
              ) : rol === "admin" ? (
                <>
                  <span>Verificar y Autorizar</span>
                  <ShieldCheck size={16} strokeWidth={2.5} />
                </>
              ) : (
                "Autorizar Acceso"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
