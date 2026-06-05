"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { account } from "@/lib/appwrite";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setErrorMsg("Completá todos los campos.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    // Obtener los parámetros userId y secret de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("userId");
    const secret = urlParams.get("secret");

    if (!userId || !secret) {
      setErrorMsg("Enlace de recuperación inválido o vencido.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      await account.updateRecovery(userId, secret, password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al actualizar la contraseña. Reintentá.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 bg-transparent py-10">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--verde-bg)] rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--azul-bg)] rounded-full blur-[120px] animate-pulse" />

      <div className="login-box glass animate-zoom-in w-full max-w-[480px] p-8 md:p-12 rounded-[40px] relative z-10 border border-white/40 shadow-2xl">
        {success ? (
          <div className="text-center py-6 animate-fade-in">
            <div className="w-16 h-16 bg-[var(--verde-bg)] text-[var(--verde)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--verde-border)] shadow-lg animate-bounce">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black mb-2 text-[var(--text)]">¡Contraseña Cambiada!</h2>
            <p className="text-[var(--text2)] text-sm font-medium mb-4">
              Tu contraseña fue restablecida con éxito.
            </p>
            <p className="text-[var(--text3)] text-xs">Redirigiendo al login...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8 flex flex-col items-center">
              <div className="w-16 h-16 bg-[var(--verde-bg)] border border-[var(--verde-border)] rounded-2xl flex items-center justify-center text-[var(--verde)] shadow-md mb-4 p-2.5">
                <svg className="w-full h-full" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 256 80 L 416 160 L 256 240 L 96 160 Z" fill="url(#grad-emerald-reset)" />
                  <path d="M 416 160 C 430 200, 440 240, 440 260" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
                  <circle cx="440" cy="275" r="20" fill="#F59E0B" />
                  <path d="M 160 220 L 160 360 C 160 400, 220 420, 256 420" stroke="url(#grad-blue-reset)" strokeWidth="32" strokeLinecap="round" />
                  <path d="M 352 220 L 352 360 C 352 400, 292 420, 256 420" stroke="url(#grad-emerald-reset)" strokeWidth="32" strokeLinecap="round" />
                  <line x1="256" y1="200" x2="256" y2="440" stroke="currentColor" strokeWidth="28" strokeLinecap="round" />
                  <circle cx="256" cy="160" r="28" fill="currentColor" />
                  <circle cx="256" cy="160" r="14" fill="var(--bg)" />
                  <circle cx="160" cy="220" r="22" fill="#3B82F6" />
                  <circle cx="352" cy="220" r="22" fill="#10B981" />
                  <defs>
                    <linearGradient id="grad-emerald-reset" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="grad-blue-reset" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#1D4ED8" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="text-[2.8rem] font-black tracking-tighter mb-2 title-font leading-none">
                Escuela<span className="text-[var(--verde)]">Info</span>
              </div>
              <div className="text-[0.85rem] text-[var(--text2)] font-black uppercase tracking-widest">
                Nueva Contraseña
              </div>
            </div>

            {errorMsg && (
              <div className="bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] p-4 rounded-xl text-xs font-bold text-center mb-5 animate-fade-in">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Nueva Contraseña</label>
                <div className="relative">
                  <input required type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 pr-12 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Confirmar Nueva Contraseña</label>
                <input required type="password" placeholder="Repetí tu nueva contraseña"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[var(--verde)] text-black rounded-2xl p-4 font-bold cursor-pointer transition-all flex items-center justify-center gap-3 hover:-translate-y-1 shadow-md active:scale-95 disabled:opacity-50 mt-6">
                {loading ? <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" /> : "Guardar Nueva Contraseña"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
