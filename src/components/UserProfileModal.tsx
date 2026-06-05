"use client";

import { useEffect, useState } from "react";
import { account } from "@/lib/appwrite";
import { updateUserProfile, UserProfile, syncUserEmailChange } from "@/lib/dataService";
import { X, User, Phone, MapPin, Mail, Lock, Eye, EyeOff, Check, AlertCircle, Loader } from "lucide-react";

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

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold mb-4 ${
      type === "success"
        ? "bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)]"
        : "bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)]"
    }`}>
      {type === "success" ? <Check size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
      {msg}
    </div>
  );
}

export default function UserProfileModal({ isOpen, onClose, profile, onProfileUpdated }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Info tab
  const [telefono, setTelefono] = useState(profile.telefono || "");
  const [direccion, setDireccion] = useState(profile.direccion || "");

  // Password tab
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Email tab
  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPass, setEmailCurrentPass] = useState("");
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTelefono(profile.telefono || "");
      setDireccion(profile.direccion || "");
      setToast(null);
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
      setNewEmail(""); setEmailCurrentPass(""); setEmailSent(false);
      setShowEmailPass(false);
      setActiveTab("info");
    }
  }, [isOpen, profile]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    if (type === "success") setTimeout(() => setToast(null), 4000);
  };

  const handleSaveInfo = async () => {
    if (!profile.id) return;
    setLoading(true);
    try {
      await updateUserProfile(profile.id, { telefono, direccion });
      onProfileUpdated({ telefono, direccion });
      showToast("Datos actualizados correctamente.", "success");
    } catch { showToast("Error al guardar los datos.", "error"); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!newPass || !currentPass) { showToast("Completá todos los campos.", "error"); return; }
    if (newPass.length < 8) { showToast("La nueva contraseña debe tener al menos 8 caracteres.", "error"); return; }
    if (newPass !== confirmPass) { showToast("Las contraseñas no coinciden.", "error"); return; }
    setLoading(true);
    try {
      await account.updatePassword(newPass, currentPass);
      showToast("¡Contraseña cambiada exitosamente!", "success");
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
    } catch (err: any) {
      showToast(err.message?.includes("Invalid") ? "La contraseña actual es incorrecta." : "Error al cambiar la contraseña.", "error");
    } finally { setLoading(false); }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      showToast("Ingresá un email válido.", "error"); return;
    }
    if (!emailCurrentPass) {
      showToast("Ingresá tu contraseña actual para confirmar el cambio.", "error"); return;
    }
    setLoading(true);
    try {
      await account.updateEmail(newEmail, emailCurrentPass);
      
      if (profile.id) {
        await updateUserProfile(profile.id, { email: newEmail });
        await syncUserEmailChange(profile.email, newEmail, profile.rol);
        onProfileUpdated({ email: newEmail });
      }

      setEmailSent(true);
      showToast("Email cambiado correctamente y actualizado en la base de datos.", "success");
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("invalid")) {
        showToast("Contraseña actual incorrecta.", "error");
      } else {
        showToast(msg || "Error al cambiar el email.", "error");
      }
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "info", label: "Mi Perfil", icon: <User size={14} /> },
    { id: "password", label: "Contraseña", icon: <Lock size={14} /> },
    { id: "email", label: "Email", icon: <Mail size={14} /> },
  ];

  const rolLabels: Record<string, string> = {
    admin: "Administrador", directivo: "Directivo", preceptor: "Preceptor",
    profesor: "Profesor", alumno: "Alumno"
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[var(--bg)] w-full max-w-md rounded-[32px] border border-[var(--border)] shadow-2xl animate-zoom-in overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] bg-[var(--bg2)] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)]">
              <User size={20} />
            </div>
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
        <div className="flex border-b border-[var(--border)] bg-[var(--bg2)] px-4">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setToast(null); }}
              className={`flex items-center gap-1.5 px-4 py-3 text-[11px] font-black uppercase tracking-wide border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-[var(--verde)] text-[var(--verde)]"
                  : "border-transparent text-[var(--text3)] hover:text-[var(--text2)]"
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {toast && <Toast msg={toast.msg} type={toast.type} />}

          {/* TAB: Info */}
          {activeTab === "info" && (
            <>
              <Field label="Nombre completo" icon={<User size={11} />}>
                <div className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 font-bold text-[var(--text)] opacity-60 text-sm">
                  {profile.nombre}
                </div>
              </Field>
              <Field label="Email" icon={<Mail size={11} />}>
                <div className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 font-bold text-[var(--text)] opacity-60 text-sm">
                  {profile.email}
                </div>
              </Field>
              <Field label="Teléfono" icon={<Phone size={11} />}>
                <input type="tel" placeholder="+54 2945 123456"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                  value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </Field>
              <Field label="Dirección del hogar" icon={<MapPin size={11} />}>
                <input type="text" placeholder="Calle 123, Localidad"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                  value={direccion} onChange={(e) => setDireccion(e.target.value)} />
              </Field>
              <button onClick={handleSaveInfo} disabled={loading}
                className="w-full p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
                {loading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </>
          )}

          {/* TAB: Password */}
          {activeTab === "password" && (
            <>
              <p className="text-xs text-[var(--text2)] font-medium leading-relaxed">
                Para cambiar tu contraseña necesitás ingresar la contraseña actual como verificación de identidad.
              </p>
              <Field label="Contraseña actual" icon={<Lock size={11} />}>
                <div className="relative">
                  <input type={showCurrentPass ? "text" : "password"} placeholder="Tu contraseña actual"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 pr-12 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                    value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} />
                  <button type="button" onClick={() => setShowCurrentPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors">
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <Field label="Nueva contraseña" icon={<Lock size={11} />}>
                <div className="relative">
                  <input type={showNewPass ? "text" : "password"} placeholder="Mínimo 8 caracteres"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 pr-12 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                    value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                  <button type="button" onClick={() => setShowNewPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors">
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <Field label="Repetir nueva contraseña" icon={<Lock size={11} />}>
                <input type="password" placeholder="Repetí la nueva contraseña"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                  value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
              </Field>
              {newPass && (
                <div className={`text-xs font-semibold px-3 py-2 rounded-xl ${
                  newPass.length >= 8 ? "text-[var(--verde)] bg-[var(--verde-bg)]" : "text-[var(--rojo)] bg-[var(--rojo-bg)]"
                }`}>
                  {newPass.length >= 8 ? "✓ Longitud correcta" : `✗ Faltan ${8 - newPass.length} caracteres`}
                  {newPass && confirmPass && newPass !== confirmPass && " · Las contraseñas no coinciden"}
                </div>
              )}
              <button onClick={handleChangePassword} disabled={loading}
                className="w-full p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
                {loading ? "Cambiando..." : "Cambiar Contraseña"}
              </button>
            </>
          )}

          {/* TAB: Email */}
          {activeTab === "email" && (
            <>
              <p className="text-xs text-[var(--text2)] font-medium leading-relaxed">
                Para cambiar tu email necesitás ingresar tu contraseña actual. Appwrite enviará un enlace de verificación al nuevo correo.
              </p>
              <Field label="Email actual" icon={<Mail size={11} />}>
                <div className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 font-bold text-[var(--text)] opacity-60 text-sm">
                  {profile.email}
                </div>
              </Field>
              <Field label="Nuevo email" icon={<Mail size={11} />}>
                <input type="email" placeholder="nuevo@correo.com"
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                  value={newEmail} onChange={(e) => setNewEmail(e.target.value)} disabled={emailSent} />
              </Field>
              <Field label="Contraseña actual (para confirmar)" icon={<Lock size={11} />}>
                <div className="relative">
                  <input type={showEmailPass ? "text" : "password"} placeholder="Tu contraseña actual"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 pr-12 outline-none font-bold text-[var(--text)] focus:border-[var(--verde)] transition-all text-sm"
                    value={emailCurrentPass} onChange={(e) => setEmailCurrentPass(e.target.value)} disabled={emailSent} />
                  <button type="button" onClick={() => setShowEmailPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)] transition-colors">
                    {showEmailPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              {emailSent && (
                <div className="bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] p-4 rounded-xl text-xs font-semibold">
                  ✅ Email cambiado. Revisá tu bandeja de entrada y confirmá el cambio.
                </div>
              )}
              {!emailSent && (
                <button onClick={handleChangeEmail} disabled={loading}
                  className="w-full p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2">
                  {loading ? <Loader size={16} className="animate-spin" /> : <Mail size={16} />}
                  {loading ? "Cambiando..." : "Confirmar Cambio de Email"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
