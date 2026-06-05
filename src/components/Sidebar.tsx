"use client";

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  ClipboardList, 
  CalendarDays, 
  GraduationCap, 
  Users, 
  ShieldAlert, 
  LogOut, 
  Settings, 
  FolderOpen,
  RefreshCw,
  Sun,
  Moon,
  BookOpen
} from "lucide-react";
import { UserProfile } from "@/lib/dataService";

interface SidebarProps {
  isCollapsed?: boolean;
  user: any;
  userProfile: UserProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showSecretAdmin: boolean;
  handleLogoClick: () => void;
  handleLogout: () => void;
  onTabChange?: (tabId: string) => void;
  onProfileOpen?: () => void;
  pendingAccessCount?: number;
  pendingAlumnosCount?: number;
}

export default function Sidebar({
  isCollapsed = false,
  user,
  userProfile,
  activeTab,
  setActiveTab,
  showSecretAdmin,
  handleLogoClick,
  handleLogout,
  onTabChange,
  onProfileOpen,
  pendingAccessCount = 0,
  pendingAlumnosCount = 0
}: SidebarProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const activeTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(activeTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <>
      <div 
        onClick={handleLogoClick}
        className={`mb-5 flex items-center cursor-pointer select-none active:scale-95 transition-all overflow-hidden ${isCollapsed ? 'justify-center' : 'px-2 gap-3'}`}
      >
        <div className="w-10 h-10 bg-[var(--verde-bg)] border border-[var(--verde-border)] rounded-xl flex items-center justify-center text-[var(--verde)] shadow-sm shrink-0 p-1.5">
          <svg className="w-full h-full" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 256 80 L 416 160 L 256 240 L 96 160 Z" fill="url(#grad-emerald-sidebar)" />
            <path d="M 416 160 C 430 200, 440 240, 440 260" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
            <circle cx="440" cy="275" r="20" fill="#F59E0B" />
            <path d="M 160 220 L 160 360 C 160 400, 220 420, 256 420" stroke="url(#grad-blue-sidebar)" strokeWidth="32" strokeLinecap="round" />
            <path d="M 352 220 L 352 360 C 352 400, 292 420, 256 420" stroke="url(#grad-emerald-sidebar)" strokeWidth="32" strokeLinecap="round" />
            <line x1="256" y1="200" x2="256" y2="440" stroke="currentColor" strokeWidth="28" strokeLinecap="round" />
            <circle cx="256" cy="160" r="28" fill="currentColor" />
            <circle cx="256" cy="160" r="14" fill="var(--bg)" />
            <circle cx="160" cy="220" r="22" fill="#3B82F6" />
            <circle cx="352" cy="220" r="22" fill="#10B981" />
            <defs>
              <linearGradient id="grad-emerald-sidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="grad-blue-sidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        {!isCollapsed && (
          <div className="title-font text-2xl font-black whitespace-nowrap">
            Escuela<span className="text-[var(--verde)]">Info</span>
          </div>
        )}
      </div>
      
      <nav className="flex flex-col gap-1.5 overflow-y-auto flex-1 my-3 pr-1 custom-scrollbar" style={{ minHeight: 0 }}>
        {[
          { id: "general", label: "Inicio", icon: <LayoutDashboard size={20} />, roles: ["admin", "directivo", "preceptor", "profesor"] },
          { id: "ausencias", label: "Ausencias", icon: <ClipboardList size={20} />, roles: ["admin", "directivo", "preceptor", "profesor"] },
          { id: "horarios", label: "Horarios", icon: <CalendarDays size={20} />, roles: ["admin", "directivo", "preceptor", "profesor", "alumno"] },
          { id: "profesores", label: "Profesores", icon: <GraduationCap size={20} />, roles: ["admin", "directivo"] },
          { id: "alumnos", label: "Alumnos", icon: <Users size={20} />, roles: ["admin", "directivo", "preceptor"] },
          { id: "cursos", label: "Cursos", icon: <FolderOpen size={20} />, roles: ["admin", "directivo", "preceptor"] },
          { id: "classroom", label: "Google Classroom", icon: <BookOpen size={20} />, roles: ["admin", "profesor", "alumno"], isExternal: true, url: "https://classroom.google.com" },
          { id: "ciclo-lectivo", label: "Ciclo Lectivo", icon: <RefreshCw size={20} />, roles: ["admin", "directivo"] },
          ...((userProfile?.rol === 'admin' || userProfile?.rol === 'directivo') ? [{ id: "configuracion", label: "Accesos", icon: <Settings size={20} />, roles: ["admin", "directivo"] }] : []),
          ...(showSecretAdmin ? [{ id: "auditoria", label: "Auditoría", icon: <ShieldAlert size={20} />, roles: ["admin", "directivo"] }] : [])
        ].filter(tab => tab.roles.includes(userProfile?.rol || "alumno"))
         .map((tab) => (
          <button 
            key={tab.id}
            onClick={() => { 
              if (tab.isExternal && tab.url) {
                window.open(tab.url, "_blank", "noopener,noreferrer");
                return;
              }
              setActiveTab(tab.id); 
              if (onTabChange) onTabChange(tab.id);
            }}
            title={isCollapsed ? tab.label : ""}
            className={`flex items-center rounded-xl border transition-all duration-300 font-semibold relative ${
              isCollapsed ? 'justify-center p-2.5 aspect-square w-10 h-10 scale-90 hover:scale-110 active:scale-95' : 'py-2 px-3 gap-2.5 text-[13px] hover:scale-105 hover:translate-x-1 active:scale-98'
            } ${
              activeTab === tab.id 
                ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)] shadow-[0_4px_12px_rgba(16,185,129,0.15)] scale-[1.03]" 
                : "text-[var(--text2)] border-transparent hover:bg-[var(--bg3)] hover:text-[var(--text)]"
            }`}
          >
            <span className="shrink-0">{tab.icon}</span>
            {!isCollapsed && <span className="whitespace-nowrap flex-1 text-left">{tab.label}</span>}
            
            {/* Badges for Accesses and Students */}
            {tab.id === 'configuracion' && pendingAccessCount > 0 && (
              isCollapsed ? (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--rojo)] rounded-full animate-pulse" />
              ) : (
                <span className="bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] text-[9px] font-black w-5 h-5 rounded-lg flex items-center justify-center shrink-0">
                  {pendingAccessCount}
                </span>
              )
            )}
            {tab.id === 'alumnos' && pendingAlumnosCount > 0 && (
              isCollapsed ? (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--rojo)] rounded-full animate-pulse" />
              ) : (
                <span className="bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] text-[9px] font-black w-5 h-5 rounded-lg flex items-center justify-center shrink-0">
                  {pendingAlumnosCount}
                </span>
              )
            )}
          </button>
        ))}
      </nav>

      <div className={`mt-auto pt-6 border-t border-[var(--border)] flex flex-col ${isCollapsed ? 'items-center gap-4' : 'gap-4'}`}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title="Cambiar Tema"
          className={`flex items-center rounded-xl border border-transparent hover:bg-[var(--bg3)] hover:text-[var(--text)] transition-all font-semibold ${
            isCollapsed ? 'justify-center p-2.5 aspect-square w-10 h-10 scale-90 hover:scale-110 active:scale-95' : 'py-2 px-3.5 gap-2.5 text-[13px] w-full hover:scale-105 hover:translate-x-1 active:scale-98'
          } text-[var(--text2)]`}
        >
          <span className="shrink-0">
            {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}
          </span>
          {!isCollapsed && (
            <span className="whitespace-nowrap flex-1 flex justify-between items-center text-sm">
              <span>{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
            </span>
          )}
        </button>

        {!isCollapsed ? (
          <button
            onClick={onProfileOpen}
            title="Ver mi perfil"
            className="w-full p-3 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl flex items-center gap-3 border border-[var(--border)] shadow-sm hover:border-[var(--verde-border)] hover:bg-[var(--verde-bg)] transition-all hover:scale-105 active:scale-98 group text-left">
            {user?.photoURL && user.photoURL.startsWith('https://') ? (
              <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--verde)] flex items-center justify-center text-black font-black shadow-sm shrink-0">
                {(userProfile?.nombre || user?.displayName || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold truncate text-[var(--text)] group-hover:text-[var(--verde)] transition-colors">{user?.displayName || userProfile?.nombre || "Usuario"}</p>
              <p className="text-[10px] text-[var(--text3)] uppercase tracking-widest font-black truncate">
                {userProfile?.rol === 'admin' ? 'Administrador' : (userProfile?.rol === 'directivo' ? 'Directivo' : (userProfile?.rol || "Invitado"))}
              </p>
            </div>
            <span className="text-[var(--text3)] group-hover:text-[var(--verde)] transition-colors text-[10px] font-black">✎</span>
          </button>
        ) : (
          <button onClick={onProfileOpen} title="Ver mi perfil" className="shrink-0 w-10 h-10 flex justify-center items-center hover:scale-110 active:scale-95 transition-all">
            {user?.photoURL && user.photoURL.startsWith('https://') ? (
              <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-[var(--border)] shadow-sm shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[var(--verde)] flex items-center justify-center text-black font-black shadow-sm shrink-0">
                {(userProfile?.nombre || user?.displayName || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </button>
        )}
        <button 
          onClick={handleLogout} 
          title={isCollapsed ? "Salir" : ""}
          className={`text-[var(--rojo)] hover:bg-[var(--rojo-bg)] rounded-xl transition-all flex items-center font-bold border border-transparent hover:border-[var(--rojo-border)] ${
            isCollapsed ? 'justify-center p-2.5 aspect-square w-10 h-10 scale-90 hover:scale-110 active:scale-95' : 'text-left py-2 px-3.5 gap-2.5 text-[13px] w-full hover:scale-105 hover:translate-x-1 active:scale-98'
          }`}
        >
          <span className="shrink-0"><LogOut size={20} /></span>
          {!isCollapsed && <span className="whitespace-nowrap">Salir</span>}
        </button>
      </div>
    </>
  );
}
