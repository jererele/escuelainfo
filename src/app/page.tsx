"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import EscuelaInfoLogo from "@/components/shared/EscuelaInfoLogo";
import { account, client } from "@/lib/appwrite";
import { ID } from "appwrite";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Sparkles, ArrowLeft, Mail, KeyRound, Info, BookOpen } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  getUserProfile, createUserProfile,
  getUserProfileByEmail, updateUserProfile,
  saveAlumno, checkAlumnoDNI, getProfesores, updateProfesor, getProfesorByEmail
} from "@/lib/dataService";
import PhoneInputWithCountry from "@/components/shared/PhoneInputWithCountry";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [successRole, setSuccessRole] = useState<"alumno" | "profesor">("alumno");
  const [activeMode, setActiveMode] = useState<"login" | "register" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterInfo, setShowRegisterInfo] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Recuperar contraseña con código de verificación
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotToken, setForgotToken] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [forgotTimer, setForgotTimer] = useState(0);
  const [showForgotPass, setShowForgotPass] = useState(false);

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Registro compartido
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dni, setDni] = useState("");

  const resetForgotForm = useCallback(() => {
    setForgotStep(1);
    setForgotEmail("");
    setForgotCode("");
    setForgotToken("");
    setForgotNewPass("");
    setForgotConfirmPass("");
    setForgotTimer(0);
    setShowForgotPass(false);
  }, []);

  const resetRegisterForm = useCallback(() => {
    setNombres(""); setApellidos(""); setTelefono("");
    setDni(""); setPassword("");
    setShowPassword(false); setErrorMsg(""); setSuccessMsg("");
  }, []);

  const switchMode = useCallback((newMode: "login" | "register" | "forgot") => {
    setActiveMode(newMode);
    setErrorMsg("");
    setSuccessMsg("");
    setShowPassword(false);
    if (newMode === "login") {
      resetRegisterForm();
      resetForgotForm();
    } else if (newMode === "register") {
      resetRegisterForm();
    } else if (newMode === "forgot") {
      setForgotEmail(email.trim());
      setForgotStep(1);
    }
    if (typeof window !== "undefined") {
      const url = newMode === "login" ? window.location.pathname : `${window.location.pathname}?mode=${newMode}`;
      window.history.pushState({ mode: newMode }, "", url);
    }
  }, [email, resetForgotForm, resetRegisterForm]);

  useEffect(() => {
    setMounted(true);
    client.ping().catch(() => {});

    // Sincronizar modo inicial con historial del navegador
    if (typeof window !== "undefined") {
      const initialMode = (new URLSearchParams(window.location.search).get("mode") as "login" | "register" | "forgot") || "login";
      if (initialMode !== "login") {
        setActiveMode(initialMode);
      }
      window.history.replaceState({ mode: initialMode }, "", window.location.href);
    }

    // Auto-redirección si la sesión está activa — NUNCA destruir la sesión en segundo plano
    const checkSession = async () => {
      let user;
      try {
        user = await account.get();
      } catch {
        // No active session — normal, stay on login page
        setCheckingSession(false);
        return;
      }

      try {
        const redirectTo = searchParams.get("redirect") || "/dashboard";
        const profilePromise = getUserProfile(user.$id);
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 4000)
        );
        const profile = await Promise.race([profilePromise, timeoutPromise]);

        if (profile) {
          router.replace(redirectTo);
          return;
        }

        // Si no se encontró por uid, intentar resolver por correo
        if (user.email) {
          const pre = await getUserProfileByEmail(user.email);
          if (pre?.id) {
            await updateUserProfile(pre.id, { uid: user.$id, nombre: user.name || "Usuario" }).catch(() => {});
            router.replace(redirectTo);
            return;
          }
        }

        // Usuario autenticado en Appwrite: enviar directamente al dashboard
        router.replace(redirectTo);
      } catch (err) {
        console.warn("[EscuelaInfo] Error en checkSession, preservando sesión y enviando a dashboard:", err);
        router.replace("/dashboard");
      }
    };

    checkSession();
  }, [router, searchParams]);

  // Manejo de retroceso en pestañas de acceso (Login <-> Register <-> Forgot)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const mode = (e.state?.mode as "login" | "register" | "forgot") ||
                   (new URLSearchParams(window.location.search).get("mode") as "login" | "register" | "forgot") ||
                   "login";
      setActiveMode(mode);
      setErrorMsg("");
      setSuccessMsg("");
      if (mode === "login") {
        resetRegisterForm();
        resetForgotForm();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [resetForgotForm, resetRegisterForm]);

  useEffect(() => {
    if (forgotTimer <= 0) return;
    const interval = setInterval(() => {
      setForgotTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [forgotTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setErrorMsg("Completá todos los campos."); return; }
    setLoading(true); setErrorMsg("");
    try {
      const cleanEmail = email.trim().toLowerCase();
      // Eliminar sesión activa previa si existiera para evitar colisión de sesiones
      try { await account.deleteSession("current"); } catch {}

      await account.createEmailPasswordSession(cleanEmail, password);
      const user = await account.get();
      const profile = await getUserProfile(user.$id);
      if (!profile) {
        const pre = await getUserProfileByEmail(cleanEmail);
        if (pre?.id) {
          await updateUserProfile(pre.id, { uid: user.$id, nombre: user.name || "Usuario" });
        } else {
          setErrorMsg("Tu cuenta no tiene perfil asignado. Contactá al administrador.");
          await account.deleteSession("current");
          setLoading(false); return;
        }
      }
      const redirectTo = searchParams.get("redirect");
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        router.replace("/dashboard");
      }
    } catch (err: any) {
      console.error("[EscuelaInfo Login Error]:", err);
      if (err?.code === 401 || err?.status === 401) {
        setErrorMsg("Correo o contraseña incorrectos. Verificá tus datos o mayúsculas.");
      } else {
        setErrorMsg(err?.message || "Error al iniciar sesión. Intentá nuevamente.");
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    switchMode("forgot");
  };

  const handleSendRecoveryCode = async () => {
    const clean = forgotEmail.trim().toLowerCase();
    if (!clean) {
      setErrorMsg("Ingresá tu correo electrónico para enviar el código.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo enviar el código de verificación");
      }
      if (data.token) setForgotToken(data.token);
      setForgotStep(2);
      setForgotTimer(60);
      setSuccessMsg("¡Código de 6 dígitos enviado! Revisá tu bandeja de entrada o spam.");
    } catch (err: any) {
      setErrorMsg(err.message || "Error al enviar el código de verificación.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!forgotCode || forgotCode.trim().length !== 6) {
      setErrorMsg("Ingresá el código numérico de 6 dígitos que te enviamos.");
      return;
    }
    if (forgotNewPass.length < 8) {
      setErrorMsg("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          code: forgotCode.trim(),
          token: forgotToken,
          newPassword: forgotNewPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Código incorrecto o vencido");
      }

      setSuccessMsg("¡Contraseña actualizada con éxito! Ya podés ingresar con tu nueva clave.");
      setEmail(forgotEmail.trim().toLowerCase());
      setPassword("");
      setActiveMode("login");
      resetForgotForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Shared validations
    if (!nombres || !apellidos || !email || !telefono || !dni || !password) {
      setErrorMsg("Completá todos los campos obligatorios."); return;
    }
    if (!/^\d{7,8}$/.test(dni)) {
      setErrorMsg("El DNI debe tener entre 7 y 8 dígitos numéricos."); return;
    }
    if (password.length < 8) {
      setErrorMsg("La contraseña debe tener al menos 8 caracteres."); return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setErrorMsg("El correo electrónico no tiene un formato válido (ej: usuario@dominio.com)."); return;
    }
    const digitsOnly = telefono.replace(/\D/g, "");
    if (!telefono || digitsOnly.length < 8) {
      setErrorMsg("Ingresá un número de teléfono válido (mínimo 8 dígitos)."); return;
    }
    if (!/^\+?[0-9\s\-]{10,18}$/.test(telefono.trim())) {
      setErrorMsg("El teléfono debe tener un formato válido con código de país."); return;
    }

    setLoading(true); setErrorMsg("");
    try {
      const cleanEmail = email.toLowerCase().trim();
      const fullName = `${nombres.trim()} ${apellidos.trim()}`;

      // 🛡️ SECURITY AUDIT REF: Information Leakage Mitigation
      // Eliminada la descarga masiva de la colección 'profesores'. Se consulta un único registro.
      const preRegisteredTeacher = await getProfesorByEmail(cleanEmail);

      const isTeacher = !!preRegisteredTeacher;

      if (!isTeacher) {
        const exists = await checkAlumnoDNI(dni);
        if (exists) {
          setErrorMsg("Ya existe un alumno con ese DNI. Si ya te registraste, iniciá sesión.");
          setLoading(false);
          return;
        }
      }

      const user = await account.create({ userId: ID.unique(), email: cleanEmail, password: password, name: fullName });
      await account.createEmailPasswordSession(cleanEmail, password);

      // Check if there is already a profile in the 'usuarios' collection
      let preProfile = await getUserProfileByEmail(cleanEmail);
      console.debug("[REGISTRO] Email buscado:", cleanEmail);
      console.debug("[REGISTRO] Perfil pre-existente encontrado:", preProfile);

      if (isTeacher) {
        // Teachers go in directly and get the active 'profesor' role
        if (preProfile?.id) {
          await updateUserProfile(preProfile.id, { uid: user.$id, nombre: fullName, rol: "profesor" });
        } else {
          await createUserProfile({ uid: user.$id, email: cleanEmail, nombre: fullName, rol: "profesor" });
        }

        // Auto-update DNI and Name in the profesores collection
        if (preRegisteredTeacher && preRegisteredTeacher.id) {
          await updateProfesor(preRegisteredTeacher.id, { nombre: fullName, dni });
        }

        setSuccessMsg("¡Registro docente exitoso! Ingresando al panel...");
        setTimeout(() => {
          router.replace("/dashboard");
        }, 1500);
        return;
      }

      // Standard workflow for students/pre-authorized users
      if (preProfile?.id) {
        await updateUserProfile(preProfile.id, { uid: user.$id, nombre: fullName });

        if (!preProfile.rol.startsWith("pendiente_")) {
          // Pre-authorized role (admin, directivo, preceptor, etc.) — enter directly
          setSuccessMsg(`¡Registro exitoso! Ingresando al panel como ${preProfile.rol}...`);
          setTimeout(() => {
            router.replace("/dashboard");
          }, 1500);
          return;
        }

        // Pre-existing but still pending — treat as student standby
        await saveAlumno({ nombre: fullName, dni, curso: "pendiente", email: cleanEmail });
        await account.deleteSession("current");
        setSuccessRole("alumno");
        setRequestSuccess(true);
        setTimeout(() => {
          setActiveMode("login");
          setRequestSuccess(false);
          resetRegisterForm();
          setLoading(false);
        }, 3500);
        return;
      }

      // No pre-existing profile — register as pending student
      await createUserProfile({ uid: user.$id, email: cleanEmail, nombre: fullName, rol: "pendiente_alumno" as any });
      await saveAlumno({ nombre: fullName, dni, curso: "pendiente", email: cleanEmail });
      await account.deleteSession("current");

      setSuccessRole("alumno");
      setRequestSuccess(true);
      setTimeout(() => {
        setActiveMode("login");
        setRequestSuccess(false);
        resetRegisterForm();
        setLoading(false);
      }, 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Error durante el registro. Intentá nuevamente.");
      setLoading(false);
    }
  };

  if (!mounted || checkingSession) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-transparent">
        <div className="w-10 h-10 border-4 border-[var(--border)] border-t-[var(--verde)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden px-4 bg-transparent py-10">
      <div className="hidden md:block absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--verde-bg)] rounded-full blur-[120px] animate-pulse" />
      <div className="hidden md:block absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--azul-bg)] rounded-full blur-[120px] animate-pulse" />

      <div className="login-box glass animate-zoom-in will-change-gpu w-full max-w-[480px] p-5 sm:p-8 md:p-12 rounded-[32px] sm:rounded-[40px] relative z-10 border border-white/40 shadow-2xl">
        {requestSuccess ? (
          <div className="text-center py-6 animate-fade-in">
            <div className="w-16 h-16 bg-[var(--verde-bg)] text-[var(--verde)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--verde-border)] shadow-lg animate-bounce">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black mb-2 text-[var(--text)]">¡Solicitud Enviada!</h2>
            <p className="text-[var(--text2)] text-sm font-medium mb-4">
              Tu solicitud como{" "}
              <span className="text-[var(--verde)] font-bold uppercase">
                {successRole === "alumno" ? "Alumno" : "Docente"}
              </span>{" "}
              fue registrada.
            </p>
            <p className="text-[var(--text3)] text-xs">
              {successRole === "alumno"
                ? "Esperá a ser aprobado por la administración para poder ingresar."
                : "La dirección revisará tu solicitud y habilitará tu acceso docente."}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-8 flex flex-col items-center">
              <div className="flex items-center justify-center mb-4 shrink-0">
                <EscuelaInfoLogo size={64} />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-full text-[10px] font-black uppercase tracking-wider mb-4">
                Escuela N° 713 &quot;Juan Abdala Chayep&quot;
              </div>
              <div className="text-[2.8rem] font-black tracking-tighter mb-2 title-font leading-none">
                Escuela<span className="text-[var(--verde)]">Info</span>
              </div>
              <div className="text-[0.85rem] text-[var(--text2)] font-black uppercase tracking-widest">
                Portal de Horarios y Asistencias
              </div>
            </div>

            {/* Tabs */}
            {activeMode === "forgot" ? (
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--text3)] hover:text-[var(--text)] transition-colors"
                >
                  <ArrowLeft size={16} /> Volver al Inicio
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--verde)] bg-[var(--verde-bg)] px-2.5 py-1 rounded-full border border-[var(--verde-border)]">
                  Paso {forgotStep} de 2
                </span>
              </div>
            ) : (
              <div className="bg-[var(--bg3)] p-1 rounded-2xl border border-[var(--border)] flex mb-6">
                {(["login", "register"] as const).map(mode => (
                  <button key={mode} type="button"
                    onClick={() => switchMode(mode)}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                      activeMode === mode ? "bg-white shadow-sm text-black" : "text-[var(--text3)] hover:text-[var(--text2)]"
                    }`}>
                    {mode === "login" ? "Iniciar Sesión" : "Registrarse"}
                  </button>
                ))}
              </div>
            )}

            {successMsg && (
              <div className="bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] p-4 rounded-xl text-xs font-bold text-center mb-5 animate-fade-in">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] p-4 rounded-xl text-xs font-bold text-center mb-5 animate-fade-in">
                {errorMsg}
              </div>
            )}

            {/* FORGOT PASSWORD */}
            {activeMode === "forgot" ? (
              <div className="space-y-4 animate-fade-in">
                {forgotStep === 1 ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSendRecoveryCode(); }} className="space-y-4">
                    <div className="bg-[var(--azul-bg)] border border-[var(--azul-border)] text-[var(--azul)] px-4 py-3 rounded-xl text-xs font-bold space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        <span>Recuperación con Código de Verificación</span>
                      </div>
                      <div className="text-[10px] opacity-90 font-semibold">
                        Ingresá tu correo electrónico institucional. Te enviaremos un código numérico de 6 dígitos para validar tu identidad y crear una nueva contraseña.
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Correo Electrónico</label>
                      <input
                        required
                        type="email"
                        placeholder="correo@ejemplo.com"
                        className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !forgotEmail.trim()}
                      className="w-full bg-[var(--verde)] text-black rounded-2xl p-4 font-bold cursor-pointer transition-all flex items-center justify-center gap-3 hover:-translate-y-1 shadow-md active:scale-95 disabled:opacity-50 mt-4"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          <Mail size={18} />
                          Enviar Código de 6 Dígitos
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyAndResetPassword} className="space-y-4">
                    <div className="bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between">
                      <div className="truncate mr-2">
                        <span className="opacity-75 font-normal block text-[10px]">Código enviado a:</span>
                        <span className="font-mono font-bold text-xs">{forgotEmail}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setForgotStep(1); setErrorMsg(""); }}
                        className="text-[10px] uppercase font-black underline hover:opacity-80 shrink-0"
                      >
                        Cambiar
                      </button>
                    </div>

                    <div className="space-y-1 text-center">
                      <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block">
                        Código de Verificación (6 dígitos)
                      </label>
                      <input
                        required
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="••••••"
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full text-center font-mono text-2xl tracking-[0.4em] font-black bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3 outline-none text-[var(--text)] focus:border-[var(--verde)] transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--text3)] block ml-2">
                        Nueva Contraseña (Mín. 8 caracteres)
                      </label>
                      <div className="relative">
                        <input
                          required
                          type={showForgotPass ? "text" : "password"}
                          placeholder="••••••••"
                          value={forgotNewPass}
                          onChange={(e) => setForgotNewPass(e.target.value)}
                          className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 pr-12 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotPass(p => !p)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors"
                        >
                          {showForgotPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--text3)] block ml-2">
                        Confirmar Nueva Contraseña
                      </label>
                      <input
                        required
                        type={showForgotPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={forgotConfirmPass}
                        onChange={(e) => setForgotConfirmPass(e.target.value)}
                        className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        disabled={loading || forgotTimer > 0}
                        onClick={handleSendRecoveryCode}
                        className="text-[11px] font-bold text-[var(--text3)] hover:text-[var(--verde)] disabled:opacity-50 transition-colors"
                      >
                        {forgotTimer > 0 ? `Reenviar código en ${forgotTimer}s` : "¿No te llegó? Reenviar código"}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || forgotCode.length !== 6 || forgotNewPass.length < 8}
                      className="w-full bg-[var(--verde)] text-black rounded-2xl p-4 font-bold cursor-pointer transition-all flex items-center justify-center gap-3 hover:-translate-y-1 shadow-md active:scale-95 disabled:opacity-50 mt-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          <KeyRound size={18} />
                          Restablecer Contraseña
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : activeMode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Correo Electrónico</label>
                  <input required type="email" placeholder="correo@ejemplo.com"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Contraseña</label>
                  <div className="relative">
                    <input required type={showPassword ? "text" : "password"} placeholder="••••••••"
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 pr-12 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all"
                      value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1">
                    <button type="button" onClick={handleForgotPassword}
                      className="text-[10px] font-black uppercase text-[var(--text3)] hover:text-[var(--verde)] transition-colors">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[var(--verde)] text-black rounded-2xl p-4 font-bold cursor-pointer transition-all flex items-center justify-center gap-3 hover:-translate-y-1 shadow-md active:scale-95 disabled:opacity-50 mt-6">
                  {loading ? <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" /> : "Ingresar al Portal"}
                </button>
                <div className="text-center">
                  <span className="text-[9px] text-[var(--text3)] uppercase font-black tracking-[0.2em]">Acceso institucional y jerárquico</span>
                </div>
              </form>
            ) : (
              /* REGISTRO — Alumno o Profesor */
              <form onSubmit={handleRegister} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar animate-fade-in">

                {/* Nombres y Apellidos con Avatar 100% redondo de costado */}
                <div className="flex items-center gap-3.5 sm:gap-4">
                  {/* Avatar dinámico circular, sin estrellita */}
                  <div className="shrink-0" title="Tu avatar institucional se actualiza en vivo al escribir">
                    <UserAvatar
                      name={`${nombres} ${apellidos}`.trim() || "Nuevo Usuario"}
                      size={64}
                      animate="always"
                      showRing={true}
                      className="shadow-md ring-2 ring-[var(--verde)]/50 transition-all duration-300 rounded-full"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--text3)] block ml-1">Nombres</label>
                      <input required type="text" placeholder="Juan"
                        className="w-full min-w-0 bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3 sm:p-3.5 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] text-sm transition-all"
                        value={nombres} onChange={(e) => setNombres(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-[var(--text3)] block ml-1">Apellidos</label>
                      <input required type="text" placeholder="Pérez"
                        className="w-full min-w-0 bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3 sm:p-3.5 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] text-sm transition-all"
                        value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] block ml-2">Correo Electrónico Institucional</label>
                  <input required type="email" placeholder="ejemplo@gmail.com"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] text-sm transition-all"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[var(--text3)] block ml-2">DNI</label>
                    <input required type="text" inputMode="numeric" maxLength={8} placeholder="12345678"
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] text-sm transition-all"
                      value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[var(--text3)] block ml-2">Teléfono</label>
                    <PhoneInputWithCountry
                      required
                      value={telefono}
                      onChange={setTelefono}
                    />
                  </div>
                </div>

                {/* Course selector removed — students are placed in standby and assigned by preceptor */}

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] block ml-2">Contraseña (Mín. 8 caracteres)</label>
                  <div className="relative">
                    <input required type={showPassword ? "text" : "password"} placeholder="••••••••"
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 pr-12 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] text-sm transition-all"
                      value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-[var(--verde)] text-black rounded-2xl p-4 font-bold cursor-pointer transition-all flex items-center justify-center gap-3 hover:-translate-y-1 shadow-md active:scale-95 disabled:opacity-50 mt-2">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                    : "Crear Cuenta / Registrarse"}
                </button>

                {/* Texto de registro institucional sutil / pop-out en la parte inferior */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowRegisterInfo(p => !p)}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[var(--text3)] hover:text-[var(--text)] transition-colors py-1 px-2.5 rounded-lg hover:bg-white/5"
                  >
                    <Info size={12} className="text-[var(--text3)]" />
                    <span>¿Cómo funciona la aprobación de cuenta?</span>
                  </button>
                  {showRegisterInfo && (
                    <div className="mt-2 text-left bg-[var(--bg3)] border border-[var(--border)] p-3.5 rounded-2xl text-[11px] text-[var(--text3)] leading-relaxed animate-fade-in space-y-1">
                      <div className="font-black text-[var(--text2)] flex items-center gap-1.5 text-xs">
                        <BookOpen size={14} className="text-[var(--azul)] shrink-0" />
                        <span>Registro de la Institución</span>
                      </div>
                      <p className="text-[10px]">
                        Los alumnos quedan en espera de aprobación del preceptor. Si fuiste pre-autorizado por la administración (como administrador, directivo, preceptor o docente), registrate con tu correo y tu rol se activará automáticamente.
                      </p>
                    </div>
                  )}
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
