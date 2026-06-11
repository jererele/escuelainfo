"use client";

import { useState, useEffect } from "react";
import { account, client } from "@/lib/appwrite";
import { ID } from "appwrite";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import {
  getUserProfile, createUserProfile,
  getUserProfileByEmail, updateUserProfile,
  saveAlumno, checkAlumnoDNI, getProfesores, updateProfesor
} from "@/lib/dataService";

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [successRole, setSuccessRole] = useState<"alumno" | "profesor">("alumno");
  const [activeMode, setActiveMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Registro compartido
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dni, setDni] = useState("");

  useEffect(() => {
    setMounted(true);
    client.ping().catch(() => {});

    // Auto-redirect only if session AND database profile are both valid
    const checkSession = async () => {
      let user;
      try {
        user = await account.get();
      } catch {
        // No active session — normal, stay on login page
        return;
      }

      try {
        // Add timeout so a slow/down Appwrite doesn't block the page forever
        const profilePromise = getUserProfile(user.$id);
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 5000)
        );
        const profile = await Promise.race([profilePromise, timeoutPromise]);

        if (profile) {
          router.push("/dashboard");
        } else {
          // Profile truly doesn't exist — clean up orphaned session
          await account.deleteSession("current").catch(() => {});
        }
      } catch (err: any) {
        if (err?.message === "timeout" || err?.code === 500) {
          // Transient server error or slow response — DO NOT delete session
          // Just stay on login page so user can try manually
          console.warn("[EscuelaInfo] Profile check failed temporarily, keeping session.");
        } else {
          // Other error (401, network) — session is invalid, clean up
          await account.deleteSession("current").catch(() => {});
        }
      }
    };

    checkSession();
  }, [router]);

  const resetRegisterForm = () => {
    setNombres(""); setApellidos(""); setTelefono("");
    setDni(""); setPassword("");
    setShowPassword(false); setErrorMsg(""); setSuccessMsg("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setErrorMsg("Completá todos los campos."); return; }
    setLoading(true); setErrorMsg("");
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      const profile = await getUserProfile(user.$id);
      if (!profile) {
        const pre = await getUserProfileByEmail(email);
        if (pre?.id) {
          await updateUserProfile(pre.id, { uid: user.$id, nombre: user.name || "Usuario" });
        } else {
          setErrorMsg("Tu cuenta no tiene perfil. Contactá al administrador.");
          await account.deleteSession("current");
          setLoading(false); return;
        }
      }
      router.push("/dashboard");
    } catch { setErrorMsg("Correo o contraseña incorrectos."); setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg("Ingresá tu correo electrónico en el campo superior para recuperar tu contraseña.");
      setSuccessMsg(""); return;
    }
    setLoading(true); setErrorMsg(""); setSuccessMsg("");
    try {
      const basePath = process.env.NODE_ENV === 'production' ? '/escuelainfo' : '';
      await account.createRecovery(email, `${window.location.origin}${basePath}/reset-password`);
      setSuccessMsg("Se ha enviado un enlace para restablecer tu contraseña. Revisá tu casilla de correo.");
    } catch (err: any) {
      setErrorMsg(err.message || "Error al enviar el correo de recuperación. Verificá la dirección.");
    } finally { setLoading(false); }
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("El correo electrónico no tiene un formato válido."); return;
    }

    setLoading(true); setErrorMsg("");
    try {
      const cleanEmail = email.toLowerCase().trim();
      const fullName = `${nombres.trim()} ${apellidos.trim()}`;

      // Check if this email is a pre-registered teacher in the 'profesores' list
      const teachersList = await getProfesores();
      const preRegisteredTeacher = teachersList.find(
        t => t.email.toLowerCase() === cleanEmail
      );

      const isTeacher = !!preRegisteredTeacher;

      if (!isTeacher) {
        const exists = await checkAlumnoDNI(dni);
        if (exists) {
          setErrorMsg("Ya existe un alumno con ese DNI. Si ya te registraste, iniciá sesión.");
          setLoading(false);
          return;
        }
      }

      const user = await account.create(ID.unique(), cleanEmail, password, fullName);
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
          router.push("/dashboard");
        }, 2000);
        return;
      }

      // Standard workflow for students/pre-authorized users
      if (preProfile?.id) {
        await updateUserProfile(preProfile.id, { uid: user.$id, nombre: fullName });

        if (!preProfile.rol.startsWith("pendiente_")) {
          // Pre-authorized role (admin, directivo, preceptor, etc.) — enter directly
          setSuccessMsg(`¡Registro exitoso! Ingresando al panel como ${preProfile.rol}...`);
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
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

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 bg-transparent py-10">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--verde-bg)] rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--azul-bg)] rounded-full blur-[120px] animate-pulse" />

      <div className="login-box glass animate-zoom-in w-full max-w-[480px] p-8 md:p-12 rounded-[40px] relative z-10 border border-white/40 shadow-2xl">
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
              <div className="w-16 h-16 flex items-center justify-center mb-4 shrink-0">
                <img src="/logo.png" alt="EscuelaInfo Logo" className="w-full h-full object-contain rounded-xl" />
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
            <div className="bg-[var(--bg3)] p-1 rounded-2xl border border-[var(--border)] flex mb-6">
              {(["login", "register"] as const).map(mode => (
                <button key={mode} type="button"
                  onClick={() => { setActiveMode(mode); setErrorMsg(""); setSuccessMsg(""); setShowPassword(false); resetRegisterForm(); }}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                    activeMode === mode ? "bg-white shadow-sm text-black" : "text-[var(--text3)] hover:text-[var(--text2)]"
                  }`}>
                  {mode === "login" ? "Iniciar Sesión" : "Registrarse"}
                </button>
              ))}
            </div>

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

            {/* LOGIN */}
            {activeMode === "login" ? (
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

                {/* Info banner */}
                <div className="bg-[var(--azul-bg)] border border-[var(--azul-border)] text-[var(--azul)] px-4 py-3 rounded-xl text-xs font-bold space-y-1">
                  <div>📚 Registro General de la Institución</div>
                  <div className="text-[10px] opacity-90 font-semibold">
                    Los alumnos quedan en espera de aprobación del preceptor. 
                    Si fuiste pre-autorizado por la administración (como administrador, directivo, preceptor o docente), regístrate con tu correo y tu rol se activará automáticamente.
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[var(--text3)] block ml-2">Nombres</label>
                    <input required type="text" placeholder="Juan"
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] text-sm transition-all"
                      value={nombres} onChange={(e) => setNombres(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[var(--text3)] block ml-2">Apellidos</label>
                    <input required type="text" placeholder="Pérez"
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] text-sm transition-all"
                      value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] block ml-2">Correo Electrónico Institucional</label>
                  <input required type="email" placeholder="ejemplo@gmail.com"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] text-sm transition-all"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[var(--text3)] block ml-2">DNI</label>
                    <input required type="text" inputMode="numeric" maxLength={8} placeholder="12345678"
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] text-sm transition-all"
                      value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, ""))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[var(--text3)] block ml-2">Teléfono</label>
                    <input required type="tel" placeholder="+54 2945..."
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] text-sm transition-all"
                      value={telefono} onChange={(e) => setTelefono(e.target.value)} />
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
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
