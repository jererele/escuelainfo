"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import EscuelaInfoLogo from "@/components/shared/EscuelaInfoLogo";
import { account, client } from "@/lib/appwrite";
import { ID } from "appwrite";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Sparkles, ArrowLeft, Mail, KeyRound, Info, BookOpen, FileText } from "lucide-react";
import { openTermsModal } from "@/components/modals/TermsModal";
import UserAvatar from "@/components/ui/UserAvatar";
import OtpVerificationInput from "@/components/ui/OtpVerificationInput";
import {
  getUserProfile, createUserProfile,
  getUserProfileByEmail, updateUserProfile,
  saveAlumno, checkAlumnoDNI, getProfesores, updateProfesor, getProfesorByEmail,
  isPendingRole, isAuthorizedRole
} from "@/lib/dataService";
import PhoneInputWithCountry from "@/components/shared/PhoneInputWithCountry";
import ChubutSchoolSelector from "@/components/shared/ChubutSchoolSelector";
import { getSchoolById, getSavedSchoolId, DEFAULT_SCHOOL_ID } from "@/lib/chubutSchools";

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
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(DEFAULT_SCHOOL_ID);
  const sessionCheckedRef = useRef(false);

  useEffect(() => {
    setSelectedSchoolId(getSavedSchoolId());
    const handleSchoolChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ schoolId: string }>;
      if (customEvent.detail?.schoolId) {
        setSelectedSchoolId(customEvent.detail.schoolId);
      }
    };
    window.addEventListener("escuelainfo:school-changed", handleSchoolChange);
    return () => window.removeEventListener("escuelainfo:school-changed", handleSchoolChange);
  }, []);

  // Sincronizar estado de acuerdos aceptados
  useEffect(() => {
    try {
      if (localStorage.getItem("skbcraft_terms_accepted_v2.0-2026-06") === "true") {
        setAcceptAgreements(true);
      }
    } catch {}
    const handleAccepted = () => setAcceptAgreements(true);
    window.addEventListener("escuelainfo:terms-accepted", handleAccepted);
    return () => window.removeEventListener("escuelainfo:terms-accepted", handleAccepted);
  }, []);

  const currentSchool = getSchoolById(selectedSchoolId);

  // Recuperar contraseña con código de verificación
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotToken, setForgotToken] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [forgotTimer, setForgotTimer] = useState(0);
  const [showForgotPass, setShowForgotPass] = useState(false);

  // Registro con verificación previa de código OTP al Gmail
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [registerOtpCode, setRegisterOtpCode] = useState("");
  const [registerOtpToken, setRegisterOtpToken] = useState("");
  const [registerOtpTokens, setRegisterOtpTokens] = useState<string[]>([]);
  const [registerTimer, setRegisterTimer] = useState(0);

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Registro compartido
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dni, setDni] = useState("");
  const [acceptAgreements, setAcceptAgreements] = useState(false);

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
    setRegisterStep(1); setRegisterOtpCode(""); setRegisterOtpToken(""); setRegisterOtpTokens([]); setRegisterTimer(0);
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

  const urlError = searchParams.get("error");
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    setMounted(true);
    client.ping().catch(() => {});

    // Sincronizar modo inicial con historial del navegador
    if (typeof window !== "undefined") {
      const initialMode = (new URLSearchParams(window.location.search).get("mode") as "login" | "register" | "forgot") || "login";
      if (initialMode !== "login") {
        setActiveMode(initialMode);
      }
      if (!window.history.state || window.history.state.mode !== initialMode) {
        window.history.replaceState({ mode: initialMode }, "", window.location.href);
      }
    }

    // Prevenir bucle infinito: chequear sesión solo una vez al montar
    if (sessionCheckedRef.current) return;
    sessionCheckedRef.current = true;

    // Verificar error en URL (por ejemplo si fue redirigido por cuenta no registrada)
    if (urlError) {
      if (urlError === "unregistered") {
        setErrorMsg("Tu cuenta no se encuentra registrada en la institución o fue dada de baja.");
      } else {
        setErrorMsg("Se produjo un error al acceder. Por favor iniciá sesión nuevamente.");
      }
      try { account.deleteSession("current").catch(() => {}); } catch {}
      setCheckingSession(false);
      return;
    }

    // Auto-redirección si la sesión está activa y la cuenta es válida
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
        let profile = await getUserProfile(user.$id);

        if (!profile && user.email) {
          const pre = await getUserProfileByEmail(user.email);
          if (pre?.id) {
            await updateUserProfile(pre.id, { uid: user.$id, nombre: user.name || "Usuario" }).catch(() => {});
            profile = { ...pre, uid: user.$id };
          }
        }

        // Si la cuenta no existe en la base de datos de usuarios (ej: fue rechazada o eliminada)
        if (!profile) {
          try { await account.deleteSession("current"); } catch {}
          setCheckingSession(false);
          setErrorMsg("Tu cuenta no se encuentra registrada en la institución o fue dada de baja.");
          return;
        }

        // Si la cuenta existe pero no cuenta con un rol oficial asignado (pendiente o sin rol)
        if (!isAuthorizedRole(profile.rol)) {
          router.replace("/dashboard");
          return;
        }

        // Usuario con rol oficial activo
        router.replace(redirectTo);
      } catch (err) {
        console.warn("[EscuelaInfo] Error en checkSession:", err);
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [router, urlError, redirectTo]);

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

  const isTimerRunning = forgotTimer > 0 || registerTimer > 0;
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setForgotTimer(prev => (prev > 0 ? prev - 1 : 0));
      setRegisterTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

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
      let profile = await getUserProfile(user.$id);
      if (!profile) {
        const pre = await getUserProfileByEmail(cleanEmail);
        if (pre?.id) {
          await updateUserProfile(pre.id, { uid: user.$id, nombre: user.name || "Usuario" });
          profile = { ...pre, uid: user.$id };
        } else {
          setErrorMsg("Tu cuenta no se encuentra registrada en la institución o fue dada de baja.");
          try { await account.deleteSession("current"); } catch {}
          setLoading(false); return;
        }
      }

      if (!isAuthorizedRole(profile.rol)) {
        // Redirigir a /dashboard donde se renderiza la pantalla de verificación institucional
        router.replace("/dashboard");
        return;
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
      if (data.simulated && data.code) {
        setForgotCode(data.code);
        setSuccessMsg(`Modo prueba (SMTP pendiente en servidor): Tu código es ${data.code}`);
      } else {
        setSuccessMsg("¡Código de 6 dígitos enviado! Si no lo ves en tu bandeja principal, revisá la carpeta de Spam o Correo no deseado.");
      }
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

  const handleSendRegisterCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validaciones de formulario
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
    if (!acceptAgreements) {
      setErrorMsg("Marcá el tilde para aceptar los acuerdos y términos de uso antes de continuar.");
      return;
    }

    setLoading(true); setErrorMsg(""); setSuccessMsg("");
    try {
      const cleanEmail = email.toLowerCase().trim();

      // Verificar si el alumno ya existe por DNI
      const preRegisteredTeacher = await getProfesorByEmail(cleanEmail);
      if (!preRegisteredTeacher) {
        const exists = await checkAlumnoDNI(dni);
        if (exists) {
          setErrorMsg("Ya existe un alumno con ese DNI. Si ya te registraste, iniciá sesión.");
          setLoading(false);
          return;
        }
      }

      // Despachar código OTP al Gmail del alumno/docente
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, type: "register" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo enviar el código de verificación al correo.");
      }

      if (data.token) {
        setRegisterOtpToken(data.token);
        setRegisterOtpTokens(prev => [...prev.filter(t => t !== data.token), data.token]);
      }
      setRegisterStep(2);
      setRegisterTimer(60);
      if (data.simulated && data.code) {
        setRegisterOtpCode(data.code);
        setSuccessMsg(`Modo prueba (SMTP pendiente en servidor): Tu código es ${data.code}`);
      } else {
        setSuccessMsg("¡Código de 6 dígitos enviado! Si no lo ves en tu bandeja principal, revisá la carpeta de Spam o Correo no deseado.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al solicitar el código de verificación.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendRegisterCode = async () => {
    if (registerTimer > 0) return;
    await handleSendRegisterCode();
  };

  const handleVerifyAndCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerOtpCode || registerOtpCode.trim().length !== 6) {
      setErrorMsg("Ingresá el código numérico de 6 dígitos recibido.");
      return;
    }

    setLoading(true); setErrorMsg(""); setSuccessMsg("");
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = registerOtpCode.trim();

    try {
      // 1. Validar código OTP y procesar alta institucional en el servidor de forma atómica y segura
      const allTokens = registerOtpTokens.length > 0
        ? registerOtpTokens
        : (registerOtpToken ? [registerOtpToken] : []);

      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          code: cleanCode,
          tokens: allTokens,
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          dni: dni.trim(),
          telefono: telefono.trim(),
          password,
          escuela: currentSchool.nombreCompleto,
        }),
      });

      const data = await registerRes.json();
      if (!registerRes.ok || !data.success) {
        throw new Error(data.error || "No se pudo completar el registro.");
      }

      // Si es docente pre-registrado, iniciar sesión automáticamente
      if (data.isTeacher) {
        try { await account.deleteSession("current"); } catch {}
        await account.createEmailPasswordSession(cleanEmail, password);
        setSuccessMsg("¡Registro docente exitoso! Ingresando al panel institucional...");
        setTimeout(() => {
          router.replace("/dashboard");
        }, 1500);
        return;
      }

      // Alumnos / Usuarios estándar: Notificación de éxito y redirección a login
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


  return (
    <div className="flex-1 flex items-center justify-center relative px-4 bg-transparent py-10">
      <div className="login-box w-full max-w-[440px] p-6 sm:p-9 rounded-2xl relative z-10 border border-[var(--border)] bg-[var(--bg2)] shadow-xl sm:shadow-2xl overflow-hidden">
        {checkingSession && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--verde)]/20 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="h-full bg-[var(--verde)] w-1/3 animate-pulse" />
          </div>
        )}
        {requestSuccess ? (
          <div className="text-center py-6 animate-fade-in">
            <div className="w-14 h-14 bg-[var(--verde-bg)] text-[var(--verde)] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-[var(--verde-border)] shadow-sm">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-[var(--text)]">¡Solicitud Enviada!</h2>
            <p className="text-[var(--text2)] text-sm font-medium mb-3">
              Tu solicitud fue enviada con éxito.
            </p>
            <p className="text-[var(--text3)] text-xs">
              Esperá a ser aprobado por la administración para poder ingresar a la plataforma.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-7 flex flex-col items-center">
              <div className="flex items-center justify-center mb-3 shrink-0">
                <EscuelaInfoLogo size={56} />
              </div>
              <div className="mb-3">
                <ChubutSchoolSelector
                  selectedSchoolId={selectedSchoolId}
                  onSelect={(school) => setSelectedSchoolId(school.id)}
                  variant="badge"
                />
              </div>
              <div className="text-3xl font-black tracking-tight mb-1 title-font leading-none">
                Escuela<span className="text-[var(--verde)]">Info</span>
              </div>
              <div className="text-xs text-[var(--text2)] font-semibold tracking-wider uppercase">
                Portal de Horarios y Asistencias
              </div>
            </div>

            {/* Tabs */}
            {activeMode === "forgot" ? (
              <div className="flex items-center justify-between mb-5 pb-2 border-b border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="flex items-center gap-2 text-xs font-semibold text-[var(--text3)] hover:text-[var(--text)] transition-colors"
                >
                  <ArrowLeft size={15} /> Volver al Inicio
                </button>
                <span className="text-[11px] font-semibold text-[var(--verde)] bg-[var(--verde-bg)] px-2.5 py-0.5 rounded-md border border-[var(--verde-border)]">
                  Paso {forgotStep} de 2
                </span>
              </div>
            ) : activeMode === "register" && registerStep === 2 ? (
              <div className="flex items-center justify-between mb-5 pb-2 border-b border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setRegisterStep(1)}
                  className="flex items-center gap-2 text-xs font-semibold text-[var(--text3)] hover:text-[var(--text)] transition-colors"
                >
                  <ArrowLeft size={15} /> Modificar Datos
                </button>
                <span className="text-[11px] font-semibold text-[var(--verde)] bg-[var(--verde-bg)] px-2.5 py-0.5 rounded-md border border-[var(--verde-border)]">
                  Paso 2 de 2: Código OTP
                </span>
              </div>
            ) : (
              <div className="bg-[var(--bg3)] p-1 rounded-xl border border-[var(--border)] flex mb-6">
                {(["login", "register"] as const).map(mode => (
                  <button key={mode} type="button"
                    onClick={() => switchMode(mode)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      activeMode === mode ? "bg-[var(--bg)] shadow-sm text-[var(--text)]" : "text-[var(--text3)] hover:text-[var(--text2)]"
                    }`}>
                    {mode === "login" ? "Iniciar Sesión" : "Registrarse"}
                  </button>
                ))}
              </div>
            )}

            {successMsg && (
              <div className="bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] p-3 rounded-xl text-xs font-medium text-center mb-4">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] p-3 rounded-xl text-xs font-medium text-center mb-4">
                {errorMsg}
              </div>
            )}

            {/* FORGOT PASSWORD */}
            {activeMode === "forgot" ? (
              <div className="space-y-4">
                {forgotStep === 1 ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSendRecoveryCode(); }} className="space-y-4">
                    <div className="bg-[var(--azul-bg)] border border-[var(--azul-border)] text-[var(--azul)] px-3.5 py-2.5 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold">
                        <Mail size={14} />
                        <span>Recuperación con Código de Verificación</span>
                      </div>
                      <div className="text-[11px] opacity-90">
                        Ingresá tu correo electrónico institucional. Te enviaremos un código numérico de 6 dígitos para validar tu identidad.
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text3)] mb-1 block">Correo Electrónico</label>
                      <input
                        required
                        type="email"
                        placeholder="correo@ejemplo.com"
                        className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 outline-none font-medium text-sm text-[var(--text)] focus:border-[var(--verde)] transition-colors"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !forgotEmail.trim()}
                      className="w-full bg-[var(--verde)] text-black rounded-xl py-2.5 px-4 font-bold cursor-pointer transition-all flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 mt-2 text-sm"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          <Mail size={16} />
                          Enviar Código de 6 Dígitos
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyAndResetPassword} className="space-y-4">
                    <div className="bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between">
                      <div className="truncate mr-2">
                        <span className="opacity-75 block text-[10px]">Código enviado a:</span>
                        <span className="font-mono font-bold text-xs">{forgotEmail}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setForgotStep(1); setErrorMsg(""); }}
                        className="text-[11px] font-bold underline hover:opacity-80 shrink-0"
                      >
                        Cambiar
                      </button>
                    </div>

                    <div className="space-y-2 py-1">
                      <label className="text-xs font-semibold text-[var(--text3)] mb-1 block text-center">
                        Código de Verificación (6 dígitos)
                      </label>
                      <OtpVerificationInput
                        value={forgotCode}
                        onChange={setForgotCode}
                        autoFocus={true}
                        hasError={!!errorMsg}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text3)] block">
                        Nueva Contraseña (Mín. 8 caracteres)
                      </label>
                      <div className="relative">
                        <input
                          required
                          type={showForgotPass ? "text" : "password"}
                          placeholder="••••••••"
                          value={forgotNewPass}
                          onChange={(e) => setForgotNewPass(e.target.value)}
                          className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 pr-11 outline-none font-medium text-[var(--text)] focus:border-[var(--verde)] transition-colors text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotPass(p => !p)}
                          aria-label={showForgotPass ? "Ocultar contraseña" : "Ver contraseña"}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text3)] hover:text-[var(--text)] transition-colors cursor-pointer"
                        >
                          {showForgotPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text3)] block">
                        Confirmar Nueva Contraseña
                      </label>
                      <input
                        required
                        type={showForgotPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={forgotConfirmPass}
                        onChange={(e) => setForgotConfirmPass(e.target.value)}
                        className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 outline-none font-medium text-[var(--text)] focus:border-[var(--verde)] transition-colors text-sm"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        disabled={loading || forgotTimer > 0}
                        onClick={handleSendRecoveryCode}
                        className="text-xs font-medium text-[var(--text3)] hover:text-[var(--verde)] disabled:opacity-50 transition-colors"
                      >
                        {forgotTimer > 0 ? `Reenviar código en ${forgotTimer}s` : "¿No te llegó? Reenviar código"}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || forgotCode.length !== 6 || forgotNewPass.length < 8}
                      className="w-full bg-[var(--verde)] text-black rounded-xl py-2.5 px-4 font-bold cursor-pointer transition-all flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 mt-2 text-sm"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          <KeyRound size={16} />
                          Restablecer Contraseña
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : activeMode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Indicador y Selector de Institución para Inicio de Sesión */}
                <div className="p-2.5 rounded-xl bg-[var(--bg3)] border border-[var(--border)] flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--verde)] shrink-0 animate-pulse" />
                    <div className="min-w-0 truncate">
                      <span className="text-[10px] text-[var(--text3)] uppercase font-bold block">Institución</span>
                      <span className="font-bold text-[var(--text)] text-xs truncate block">{currentSchool.nombreCompleto}</span>
                    </div>
                  </div>
                  <ChubutSchoolSelector
                    selectedSchoolId={selectedSchoolId}
                    onSelect={(school) => setSelectedSchoolId(school.id)}
                    variant="compact"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text3)] mb-1 block">Correo Electrónico</label>
                  <input required type="email" placeholder="correo@ejemplo.com"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 outline-none font-medium text-sm text-[var(--text)] focus:border-[var(--verde)] transition-colors"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text3)] mb-1 block">Contraseña</label>
                  <div className="relative">
                    <input required type={showPassword ? "text" : "password"} placeholder="••••••••"
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 pr-11 outline-none font-medium text-[var(--text)] focus:border-[var(--verde)] transition-colors text-sm"
                      value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text3)] hover:text-[var(--text)] transition-colors cursor-pointer">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-1">
                    <button type="button" onClick={handleForgotPassword}
                      className="text-xs font-medium text-[var(--text3)] hover:text-[var(--verde)] transition-colors">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[var(--verde)] text-black rounded-xl py-2.5 px-4 font-bold cursor-pointer transition-all flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 mt-4 text-sm">
                  {loading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin" /> : "Ingresar al Portal"}
                </button>
                <div className="text-center pt-2">
                  <span className="text-[10px] text-[var(--text3)] uppercase font-semibold tracking-wider">Acceso institucional y jerárquico</span>
                </div>
              </form>
            ) : registerStep === 1 ? (
              /* REGISTRO — Paso 1: Datos Personales */
              <form onSubmit={handleSendRegisterCode} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">

                {/* Selector Oficial de Escuela Secundaria de Chubut dividida por región */}
                <ChubutSchoolSelector
                  selectedSchoolId={selectedSchoolId}
                  onSelect={(school) => setSelectedSchoolId(school.id)}
                  variant="form-input"
                  label="Escuela Secundaria de Chubut"
                />

                {/* Nombres y Apellidos con Avatar */}
                <div className="flex items-center gap-3">
                  <div className="shrink-0" title="Tu avatar institucional se actualiza en vivo al escribir">
                    <UserAvatar
                      name={`${nombres} ${apellidos}`.trim() || "Nuevo Usuario"}
                      size={54}
                      animate="always"
                      showRing={true}
                      className="ring-1 ring-[var(--verde)]/40 rounded-full"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text3)] block">Nombres</label>
                      <input required type="text" placeholder="Juan"
                        className="w-full min-w-0 bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 outline-none font-medium text-[var(--text)] focus:border-[var(--verde)] text-sm transition-colors"
                        value={nombres} onChange={(e) => setNombres(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text3)] block">Apellidos</label>
                      <input required type="text" placeholder="Pérez"
                        className="w-full min-w-0 bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3 py-2 outline-none font-medium text-[var(--text)] focus:border-[var(--verde)] text-sm transition-colors"
                        value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text3)] block">Correo Institucional</label>
                  <input required type="email" placeholder="ejemplo@gmail.com"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 outline-none font-medium text-[var(--text)] focus:border-[var(--verde)] text-sm transition-colors"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text3)] block">DNI</label>
                    <input required type="text" inputMode="numeric" maxLength={8} placeholder="12345678"
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 outline-none font-medium text-[var(--text)] focus:border-[var(--verde)] text-sm transition-colors"
                      value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text3)] block">Teléfono</label>
                    <PhoneInputWithCountry
                      required
                      value={telefono}
                      onChange={setTelefono}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text3)] block">Contraseña (Mín. 8 caracteres)</label>
                  <div className="relative">
                    <input required type={showPassword ? "text" : "password"} placeholder="••••••••"
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 pr-11 outline-none font-medium text-[var(--text)] focus:border-[var(--verde)] text-sm transition-colors"
                      value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text3)] hover:text-[var(--text)] transition-colors cursor-pointer">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Aceptación ágil de Acuerdos Institucionales */}
                <div className="pt-2 pb-1 space-y-1.5 border-t border-[var(--border)]/60 mt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={acceptAgreements}
                      onChange={(e) => {
                        setAcceptAgreements(e.target.checked);
                        if (e.target.checked) {
                          try {
                            localStorage.setItem("skbcraft_terms_accepted_v2.0-2026-06", "true");
                          } catch {}
                        }
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-[var(--border)] text-[var(--verde)] bg-[var(--bg3)] focus:ring-[var(--verde)]/40 focus:ring-offset-0 cursor-pointer accent-[var(--verde)]"
                    />
                    <span className="text-xs text-[var(--text2)] group-hover:text-[var(--text)] transition-colors leading-snug">
                      Acepto los términos de uso, condiciones y acuerdos de convivencia institucional
                    </span>
                  </label>
                  <div className="pl-6.5">
                    <button
                      type="button"
                      onClick={() => openTermsModal()}
                      className="inline-flex items-center gap-1.5 text-xs text-[var(--verde)] hover:underline font-semibold cursor-pointer transition-colors"
                    >
                      <FileText size={13} className="shrink-0" />
                      <span>Leer los acuerdos</span>
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-[var(--verde)] text-black rounded-xl py-2.5 px-4 font-bold cursor-pointer transition-all flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 mt-2 text-sm">
                  {loading
                    ? <div className="w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
                    : <>
                        <Mail size={16} />
                        Continuar: Verificar Correo
                      </>}
                </button>

                {/* Información institucional */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => setShowRegisterInfo(p => !p)}
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--text3)] hover:text-[var(--text)] transition-colors py-1 px-2 rounded-lg"
                  >
                    <Info size={13} className="text-[var(--text3)]" />
                    <span>¿Cómo funciona la aprobación de cuenta?</span>
                  </button>
                  {showRegisterInfo && (
                    <div className="mt-2 text-left bg-[var(--bg3)] border border-[var(--border)] p-3 rounded-xl text-xs text-[var(--text3)] leading-relaxed space-y-1">
                      <div className="font-semibold text-[var(--text2)] flex items-center gap-1.5 text-xs">
                        <BookOpen size={13} className="text-[var(--azul)] shrink-0" />
                        <span>Registro de la Institución</span>
                      </div>
                      <p className="text-[11px]">
                        Los alumnos quedan en espera de aprobación del preceptor. Si fuiste pre-autorizado por la administración (como administrador, directivo, preceptor o docente), registrate con tu correo y tu rol se activará automáticamente.
                      </p>
                    </div>
                  )}
                </div>
              </form>
            ) : (
              /* REGISTRO — Paso 2: Verificación OTP */
              <form onSubmit={handleVerifyAndCompleteRegister} className="space-y-4">
                <div className="bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between">
                  <div className="truncate mr-2">
                    <span className="opacity-75 block text-[10px]">Código de validación enviado a:</span>
                    <span className="font-mono font-bold text-xs">{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setRegisterStep(1); setErrorMsg(""); }}
                    className="text-[11px] font-bold underline hover:opacity-80 shrink-0"
                  >
                    Modificar
                  </button>
                </div>

                <div className="space-y-2 py-1">
                  <label className="text-xs font-semibold text-[var(--text3)] block text-center">
                    Ingresá el código numérico de 6 dígitos
                  </label>
                  <OtpVerificationInput
                    value={registerOtpCode}
                    onChange={setRegisterOtpCode}
                    autoFocus={true}
                    hasError={!!errorMsg}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    disabled={loading || registerTimer > 0}
                    onClick={handleResendRegisterCode}
                    className="text-xs font-medium text-[var(--text3)] hover:text-[var(--verde)] disabled:opacity-50 transition-colors"
                  >
                    {registerTimer > 0 ? `Reenviar código en ${registerTimer}s` : "¿No te llegó? Reenviar código"}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || registerOtpCode.length !== 6}
                  className="w-full bg-[var(--verde)] text-black rounded-xl py-2.5 px-4 font-bold cursor-pointer transition-all flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 mt-2 text-sm"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Validar y Completar Registro
                    </>
                  )}
                </button>

                <div className="pt-1 text-center space-y-1">
                  <span className="text-[11px] text-[var(--text3)] block">
                    Al confirmar, validaremos tu casilla institucional y crearemos tu usuario de acceso.
                  </span>
                  <span className="text-[11px] text-[var(--verde)] opacity-90 block font-medium">
                    Si el correo llegó a la carpeta Spam, el código de 6 dígitos es 100% válido.
                  </span>
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
