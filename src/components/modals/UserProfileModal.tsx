"use client";

import { useState, useEffect } from "react";
import { account } from "@/lib/appwrite";
import {
  UserProfile,
  updateUserProfile,
  syncUserEmailChange,
  requestNameChange,
  cancelNameChangeRequest,
} from "@/lib/dataService";
import { notify } from "@/lib/notify";
import {
  X,
  User,
  Lock,
  Mail,
  Check,
  AlertCircle,
  Loader,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  Sparkles,
  Clock,
  KeyRound,
  Send,
} from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onProfileUpdated: (updated: Partial<UserProfile>) => void;
}

type Tab = "info" | "password" | "email";

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[var(--text3)] mb-1.5 ml-1">
        {icon}{label}
      </label>
      {children}
    </div>
  );
}

export default function UserProfileModal({ isOpen, onClose, profile, onProfileUpdated }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [loading, setLoading] = useState(false);

  // Info tab
  const [telefono, setTelefono] = useState(profile.telefono || "");
  const [direccion, setDireccion] = useState(profile.direccion || "");

  // Solicitud de cambio de nombre
  const [isRequestingName, setIsRequestingName] = useState(false);
  const [newName, setNewName] = useState("");

  // Password tab (Código OTP por email)
  const [codeSent, setCodeSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [timer, setTimer] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);

  // Email tab
  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPass, setEmailCurrentPass] = useState("");
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Temporizador para reenvío de código
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTelefono(profile.telefono || "");
      setDireccion(profile.direccion || "");
      setIsRequestingName(false);
      setNewName("");
      setCodeSent(false);
      setOtpCode("");
      setOtpToken("");
      setNewPass("");
      setConfirmPass("");
      setShowNewPass(false);
      setNewEmail("");
      setEmailCurrentPass("");
      setEmailSent(false);
      setShowEmailPass(false);
      setActiveTab("info");
    }
  }, [isOpen, profile]);

  const handleSaveInfo = async () => {
    if (!profile.id) return;
    if (telefono && !/^\+?[0-9\s\-]{10,15}$/.test(telefono.trim())) {
      notify.error("El teléfono debe tener entre 10 y 15 números válidos.");
      return;
    }
    setLoading(true);
    try {
      await updateUserProfile(profile.id, { telefono, direccion });
      onProfileUpdated({ telefono, direccion });
      notify.success("Datos de contacto actualizados correctamente.");
    } catch {
      notify.error("Error al guardar los datos.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendNameChangeRequest = async () => {
    if (!profile.id) return;
    if (!newName.trim() || newName.trim().length < 3) {
      notify.error("Ingresá un nombre y apellido válido (mínimo 3 caracteres).");
      return;
    }
    if (newName.trim() === profile.nombre.trim()) {
      notify.error("El nombre solicitado es igual a tu nombre actual.");
      return;
    }
    setLoading(true);
    try {
      await requestNameChange(profile.id, newName.trim(), profile.email);
      onProfileUpdated({ nombrePendiente: newName.trim() });
      setIsRequestingName(false);
      setNewName("");
      notify.success("Solicitud enviada. Los directivos revisarán tu cambio de nombre.");
    } catch {
      notify.error("No se pudo enviar la solicitud. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNameChangeRequest = async () => {
    if (!profile.id) return;
    setLoading(true);
    try {
      await cancelNameChangeRequest(profile.id, profile.email);
      onProfileUpdated({ nombrePendiente: "" });
      notify.success("Solicitud de cambio de nombre cancelada.");
    } catch {
      notify.error("Error al cancelar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  // Enviar código de verificación por correo para cambio de contraseña
  const handleSendOtpCode = async () => {
    setSendingCode(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar el código.");
      if (data.token) setOtpToken(data.token);
      setCodeSent(true);
      setTimer(60);
      notify.success(`Código de 6 dígitos enviado a ${profile.email}`);
    } catch (err: any) {
      notify.error(err.message || "Error al enviar el código de verificación.");
    } finally {
      setSendingCode(false);
    }
  };

  // Validar código y cambiar contraseña
  const handleVerifyAndChangePassword = async () => {
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      notify.error("Ingresá el código numérico de 6 dígitos recibido en tu correo.");
      return;
    }
    if (!newPass) {
      notify.error("Ingresá la nueva contraseña.");
      return;
    }
    if (newPass.length < 8) {
      notify.error("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPass !== confirmPass) {
      notify.error("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profile.email,
          code: cleanCode,
          token: otpToken,
          newPassword: newPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código inválido o expirado.");

      notify.success("¡Tu contraseña ha sido actualizada con éxito!");
      setCodeSent(false);
      setOtpCode("");
      setOtpToken("");
      setNewPass("");
      setConfirmPass("");
    } catch (err: any) {
      notify.error(err.message || "Error al actualizar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(newEmail)) {
      notify.error("Ingresá un email válido (ej: usuario@dominio.com).");
      return;
    }
    if (!emailCurrentPass) {
      notify.error("Ingresá tu contraseña actual para confirmar el cambio.");
      return;
    }
    setLoading(true);
    try {
      await account.updateEmail({ email: newEmail, password: emailCurrentPass });

      if (profile.id) {
        await updateUserProfile(profile.id, { email: newEmail });
        await syncUserEmailChange(profile.email, newEmail, profile.rol);
        onProfileUpdated({ email: newEmail });
      }

      setEmailSent(true);
      notify.success("Email cambiado correctamente y actualizado en el sistema.");
    } catch (err: any) {
      notify.error(err.message || "Error al cambiar el email.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "info", label: "Mi Perfil", icon: <User size={14} /> },
    { id: "password", label: "Contraseña", icon: <Lock size={14} /> },
    { id: "email", label: "Email", icon: <Mail size={14} /> },
  ];

  const rolLabels: Record<string, string> = {
    admin: "Administrador",
    directivo: "Directivo",
    preceptor: "Preceptor",
    profesor: "Profesor",
    alumno: "Alumno",
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--bg)] w-full max-w-md rounded-[32px] border border-[var(--border)] shadow-2xl animate-zoom-in overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] bg-[var(--bg2)] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <UserAvatar name={profile.nombre} email={profile.email} size={48} showRing={true} animate="hover" />
            <div>
              <div className="font-black text-[var(--text)] text-base leading-tight">{profile.nombre}</div>
              <div className="text-[10px] font-bold uppercase text-[var(--text3)] mt-0.5">
                {rolLabels[profile.rol] || profile.rol}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] bg-[var(--bg2)] shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                activeTab === t.id
                  ? "border-[var(--verde)] text-[var(--verde)] bg-[var(--verde-bg)]/30"
                  : "border-transparent text-[var(--text3)] hover:text-[var(--text)]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* TAB: Info */}
          {activeTab === "info" && (
            <>
              {/* Tarjeta de Identidad con Avatar Bouncing */}
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[var(--bg2)] border border-[var(--border)] mb-1">
                <UserAvatar name={profile.nombre} email={profile.email} size={76} showRing={true} animate="always" />
                <p className="font-black text-base text-[var(--text)] mt-2.5 leading-tight">{profile.nombre}</p>
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--verde)] bg-[var(--verde-bg)] px-2.5 py-0.5 rounded-full border border-[var(--verde-border)] mt-1">
                  {rolLabels[profile.rol] || profile.rol}
                </span>
              </div>

              {/* Nombre Completo & Solicitud de Cambio */}
              <div>
                <label className="flex items-center justify-between text-[10px] font-black uppercase text-[var(--text3)] mb-1.5 ml-1">
                  <span className="flex items-center gap-1.5">
                    <User size={11} /> Nombre Completo
                  </span>
                  {!profile.nombrePendiente && !isRequestingName && (
                    <button
                      type="button"
                      onClick={() => setIsRequestingName(true)}
                      className="text-[10px] font-bold text-[var(--verde)] hover:underline flex items-center gap-1 normal-case tracking-normal"
                    >
                      <Sparkles size={11} /> Solicitar cambio
                    </button>
                  )}
                </label>

                {/* Si hay solicitud pendiente */}
                {profile.nombrePendiente ? (
                  <div className="p-3.5 rounded-2xl bg-[var(--amarillo-bg)] border border-[var(--amarillo-border)] space-y-2.5 animate-fade-in">
                    <div className="flex items-center gap-2 text-[var(--amarillo)] font-black text-xs">
                      <Clock size={13} className="animate-spin" />
                      <span>Cambio de nombre en revisión directiva</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-[var(--bg)] p-3 rounded-xl border border-[var(--border)]">
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-[var(--text3)] font-black uppercase tracking-wider block">
                          Nuevo nombre solicitado:
                        </span>
                        <div className="font-black text-[var(--text)] text-sm truncate">{profile.nombrePendiente}</div>
                      </div>
                      <UserAvatar name={profile.nombrePendiente} size={36} showRing={false} />
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelNameChangeRequest}
                      disabled={loading}
                      className="w-full py-2 text-xs font-bold text-[var(--rojo)] hover:bg-[var(--rojo-bg)] rounded-xl border border-[var(--rojo-border)] transition-all active:scale-95 cursor-pointer"
                    >
                      Cancelar Solicitud
                    </button>
                  </div>
                ) : isRequestingName ? (
                  /* Formulario de nueva solicitud de cambio de nombre */
                  <div className="p-4 rounded-2xl bg-[var(--bg2)] border border-[var(--verde-border)] space-y-3 animate-fade-in">
                    <div className="text-xs font-black text-[var(--verde)] flex items-center gap-1.5">
                      <Sparkles size={13} /> Nueva Solicitud de Nombre
                    </div>
                    <input
                      type="text"
                      placeholder="Ej: Juan Carlos Pérez"
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-3 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] text-sm transition-all"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />

                    {/* Previsualización en vivo del nuevo avatar */}
                    {newName.trim() && (
                      <div className="flex items-center gap-3 p-2.5 bg-[var(--bg3)] rounded-xl border border-[var(--border)] animate-fade-in">
                        <UserAvatar name={newName.trim()} size={36} animate="always" showRing={true} />
                        <div className="text-xs min-w-0 flex-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-[var(--verde)] block">
                            Tu nuevo avatar será:
                          </span>
                          <span className="font-bold text-[var(--text)] truncate block">{newName.trim()}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRequestingName(false);
                          setNewName("");
                        }}
                        className="flex-1 py-2 rounded-xl border border-[var(--border)] text-xs font-bold hover:bg-[var(--bg3)] text-[var(--text)] transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSendNameChangeRequest}
                        disabled={loading || !newName.trim()}
                        className="flex-1 py-2 rounded-xl bg-[var(--verde)] text-black text-xs font-black hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {loading ? "Enviando..." : "Enviar a Directivos"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Campo estático regular */
                  <div className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 font-bold text-[var(--text)] opacity-70 text-sm">
                    {profile.nombre}
                  </div>
                )}
              </div>

              <Field label="Email institucional" icon={<Mail size={11} />}>
                <div className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 font-bold text-[var(--text)] opacity-70 text-sm">
                  {profile.email}
                </div>
              </Field>

              <Field label="Teléfono" icon={<Phone size={11} />}>
                <input
                  type="tel"
                  placeholder="+54 2945 123456"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </Field>

              <Field label="Dirección del hogar" icon={<MapPin size={11} />}>
                <input
                  type="text"
                  placeholder="Calle 123, Localidad"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </Field>

              <button
                type="button"
                onClick={handleSaveInfo}
                disabled={loading}
                className="w-full p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </>
          )}

          {/* TAB: Password (Flujo seguro de 2 pasos con código de verificación por correo) */}
          {activeTab === "password" && (
            <div className="space-y-4">
              {!codeSent ? (
                /* Paso 1: Enviar código al correo */
                <div className="p-6 rounded-2xl bg-[var(--bg2)] border border-[var(--border)] text-center space-y-4 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--verde-bg)] text-[var(--verde)] flex items-center justify-center mx-auto border border-[var(--verde-border)] shadow-sm">
                    <KeyRound size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-[var(--text)]">Verificación de Seguridad</h4>
                    <p className="text-xs text-[var(--text2)] mt-1.5 leading-relaxed">
                      Para cambiar tu contraseña de forma protegida, te enviaremos un código numérico de 6 dígitos a tu
                      correo registrado:
                    </p>
                    <div className="inline-block mt-2 px-3.5 py-1.5 rounded-full bg-[var(--bg3)] border border-[var(--border)] font-bold text-xs text-[var(--verde)]">
                      {profile.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtpCode}
                    disabled={sendingCode}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[var(--verde)] text-black font-black text-sm hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {sendingCode ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                    {sendingCode ? "Enviando Código..." : "Enviar Código de Verificación"}
                  </button>
                </div>
              ) : (
                /* Paso 2: Ingresar código y nueva contraseña */
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3.5 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-between text-xs font-bold text-[var(--verde)]">
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      <span>Código enviado a {profile.email}</span>
                    </div>
                    {timer > 0 ? (
                      <span className="text-[10px] text-[var(--text3)]">Reenviar en {timer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtpCode}
                        disabled={sendingCode}
                        className="text-[10px] underline hover:opacity-80"
                      >
                        Reenviar
                      </button>
                    )}
                  </div>

                  <Field label="Código de 6 dígitos" icon={<KeyRound size={11} />}>
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="123456"
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 text-center tracking-[8px] font-black text-xl text-[var(--verde)] outline-none focus:border-[var(--verde)] transition-all font-mono"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    />
                  </Field>

                  <Field label="Nueva Contraseña" icon={<Lock size={11} />}>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 pr-12 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass((p) => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors"
                      >
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirmar Nueva Contraseña" icon={<Lock size={11} />}>
                    <input
                      type="password"
                      placeholder="Repetí la nueva contraseña"
                      className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                    />
                  </Field>

                  {newPass && (
                    <div
                      className={`text-xs font-semibold px-3 py-2 rounded-xl ${
                        newPass.length >= 8
                          ? "text-[var(--verde)] bg-[var(--verde-bg)]"
                          : "text-[var(--rojo)] bg-[var(--rojo-bg)]"
                      }`}
                    >
                      {newPass.length >= 8 ? "✓ Longitud correcta" : `✗ Faltan ${8 - newPass.length} caracteres`}
                      {newPass && confirmPass && newPass !== confirmPass && " · Las contraseñas no coinciden"}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCodeSent(false)}
                      className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold text-xs hover:bg-[var(--bg3)] text-[var(--text)] transition-all"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyAndChangePassword}
                      disabled={loading || otpCode.length !== 6 || newPass.length < 8}
                      className="flex-[2] p-4 rounded-2xl bg-[var(--verde)] text-black font-black text-sm disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
                      {loading ? "Verificando..." : "Cambiar Contraseña"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Email */}
          {activeTab === "email" && (
            <>
              <p className="text-xs text-[var(--text2)] font-medium leading-relaxed">
                Para cambiar tu email necesitás ingresar tu contraseña actual. El sistema actualizará tu correo en toda
                la base de datos.
              </p>
              <Field label="Email actual" icon={<Mail size={11} />}>
                <div className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 font-bold text-[var(--text)] opacity-70 text-sm">
                  {profile.email}
                </div>
              </Field>
              <Field label="Nuevo email" icon={<Mail size={11} />}>
                <input
                  type="email"
                  placeholder="nuevo@correo.com"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={emailSent}
                />
              </Field>
              <Field label="Contraseña actual (para confirmar)" icon={<Lock size={11} />}>
                <div className="relative">
                  <input
                    type={showEmailPass ? "text" : "password"}
                    placeholder="Tu contraseña actual"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 pr-12 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                    value={emailCurrentPass}
                    onChange={(e) => setEmailCurrentPass(e.target.value)}
                    disabled={emailSent}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPass((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors"
                  >
                    {showEmailPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <button
                type="button"
                onClick={handleChangeEmail}
                disabled={loading || emailSent}
                className="w-full p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
                {loading ? "Actualizando..." : "Cambiar Email"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
