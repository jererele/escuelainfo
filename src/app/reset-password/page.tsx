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
    <div className="min-h-screen flex items-center justify-center relative px-4 bg-transparent py-10">
      <div className="login-box w-full max-w-[440px] p-6 sm:p-9 rounded-2xl relative z-10 border border-[var(--border)] bg-[var(--bg2)] shadow-xl sm:shadow-2xl">
        {success ? (
          <div className="text-center py-6 animate-fade-in">
            <div className="w-14 h-14 bg-[var(--verde-bg)] text-[var(--verde)] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[var(--verde-border)] shadow-sm">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-[var(--text)]">¡Contraseña Cambiada!</h2>
            <p className="text-[var(--text2)] text-sm font-medium mb-3">
              Tu contraseña fue restablecida con éxito.
            </p>
            <p className="text-[var(--text3)] text-xs">Redirigiendo al inicio de sesión...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-7 flex flex-col items-center">
              <div className="w-14 h-14 bg-[var(--verde-bg)] border border-[var(--verde-border)] rounded-xl flex items-center justify-center text-[var(--verde)] mb-3 p-2">
                <svg className="w-full h-full" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 256 80 L 416 160 L 256 240 L 96 160 Z" fill="url(#grad-emerald-reset)" />
                  <path d="M 416 160 C 430 200, 440 240, 440 260" stroke="currentColor" strokeWidth={12} strokeLinecap="round" />
                  <circle cx="440" cy="275" r="20" fill="#F59E0B" />
                  <path d="M 160 220 L 160 360 C 160 400, 220 420, 256 420" stroke="url(#grad-blue-reset)" strokeWidth={32} strokeLinecap="round" />
                  <path d="M 352 220 L 352 360 C 352 400, 292 420, 256 420" stroke="url(#grad-emerald-reset)" strokeWidth={32} strokeLinecap="round" />
                  <line x1="256" y1="200" x2="256" y2="440" stroke="currentColor" strokeWidth={28} strokeLinecap="round" />
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
              <div className="text-3xl font-black tracking-tight mb-1 title-font leading-none">
                Escuela<span className="text-[var(--verde)]">Info</span>
              </div>
              <div className="text-xs text-[var(--text2)] font-semibold tracking-wider uppercase">
                Nueva Contraseña
              </div>
            </div>

            {errorMsg && (
              <div className="bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] p-3 rounded-xl text-xs font-medium text-center mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text3)] mb-1 block">Nueva Contraseña</label>
                <div className="relative">
                  <input required type={showPassword ? "text" : "password"} placeholder="Mínimo 8 caracteres"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 pr-11 outline-none font-medium text-sm text-[var(--text)] focus:border-[var(--verde)] transition-colors"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text3)] mb-1 block">Confirmar Nueva Contraseña</label>
                <input required type="password" placeholder="Repetí tu nueva contraseña"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 outline-none font-medium text-sm text-[var(--text)] focus:border-[var(--verde)] transition-colors"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[var(--verde)] text-black rounded-xl py-2.5 px-4 font-bold cursor-pointer transition-all flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 mt-4 text-sm">
                {loading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin" /> : "Guardar Nueva Contraseña"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
