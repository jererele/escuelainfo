"use client";

import { useState, useEffect, useRef } from "react";
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
  BookOpen,
  UserCheck,
  ClipboardCheck,
  ChevronUp,
  ChevronDown,
  Menu,
  X,
  Pencil,
} from "lucide-react";
import { UserProfile } from "@/lib/dataService";
import EscuelaInfoLogo from "@/components/EscuelaInfoLogo";

interface TopNavSidebarProps {
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

export default function TopNavSidebar({
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
  pendingAlumnosCount = 0,
}: TopNavSidebarProps) {
  const [isOpen, setIsOpen]       = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [theme, setTheme]         = useState<"light" | "dark">("light");
  const navRef = useRef<HTMLDivElement>(null);

  // Restore theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const active = saved ?? (isSystemDark ? "dark" : "light");
    setTheme(active as "light" | "dark");
    document.documentElement.classList.toggle("dark", active === "dark");
    document.documentElement.classList.toggle("light", active === "light");
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        closeSidebar();
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeSidebar();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  const closeSidebar = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsExiting(false);
    }, 320);
  };

  const toggleSidebar = () => {
    if (isOpen) {
      closeSidebar();
    } else {
      setIsOpen(true);
    }
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    document.documentElement.classList.toggle("light", next === "light");
    localStorage.setItem("theme", next);
  };

  const handleTabClick = (tabId: string, isExternal?: boolean, url?: string) => {
    if (isExternal && url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      setActiveTab(tabId);
      onTabChange?.(tabId);
    }
    closeSidebar();
  };

  const tabs = [
    { id: "general",       label: "Inicio",            icon: <LayoutDashboard size={18} />, roles: ["admin", "directivo", "preceptor", "profesor"] },
    { id: "asistencia",    label: "Asistencia",        icon: <UserCheck size={18} />,       roles: ["admin", "directivo", "preceptor", "profesor", "alumno"] },
    { id: "ausencias",     label: "Ausencias",         icon: <ClipboardList size={18} />,   roles: ["admin", "directivo", "preceptor", "profesor"] },
    { id: "mesas-examen",  label: "Mesas de Examen",   icon: <ClipboardCheck size={18} />,  roles: ["admin", "directivo", "preceptor", "profesor", "alumno"] },
    { id: "horarios",      label: "Horarios",          icon: <CalendarDays size={18} />,    roles: ["admin", "directivo", "preceptor", "profesor", "alumno"] },
    { id: "profesores",    label: "Profesores",        icon: <GraduationCap size={18} />,   roles: ["admin", "directivo"] },
    { id: "alumnos",       label: "Alumnos",           icon: <Users size={18} />,           roles: ["admin", "directivo", "preceptor"] },
    { id: "cursos",        label: "Cursos",            icon: <FolderOpen size={18} />,      roles: ["admin", "directivo", "preceptor"] },
    { id: "classroom",     label: "Google Classroom",  icon: <BookOpen size={18} />,        roles: ["admin", "profesor", "alumno"], isExternal: true, url: "https://classroom.google.com" },
    { id: "ciclo-lectivo", label: "Ciclo Lectivo",     icon: <RefreshCw size={18} />,       roles: ["admin", "directivo"] },
    ...((userProfile?.rol === "admin" || userProfile?.rol === "directivo")
      ? [{ id: "configuracion", label: "Accesos", icon: <Settings size={18} />, roles: ["admin", "directivo"] }]
      : []),
    ...(showSecretAdmin
      ? [{ id: "auditoria", label: "Auditoría", icon: <ShieldAlert size={18} />, roles: ["admin", "directivo"] }]
      : []),
  ].filter((tab) => tab.roles.includes(userProfile?.rol ?? "alumno"));

  const userName  = userProfile?.nombre || user?.displayName || "Usuario";
  const userInitial = userName.charAt(0).toUpperCase();
  const rolLabel  = userProfile?.rol === "admin" ? "Administrador"
    : userProfile?.rol === "directivo" ? "Directivo"
    : userProfile?.rol ?? "Invitado";

  return (
    <div ref={navRef} className="relative z-[500]">
      {/* ── BARRA SUPERIOR FIJA ───────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 md:px-6
        bg-[var(--bg)]/95 backdrop-blur-xl border-b border-[var(--border)]
        shadow-[0_2px_20px_-8px_rgba(0,0,0,0.12)] z-[500]">

        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            id="top-sidebar-toggle"
            onClick={toggleSidebar}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            className="w-9 h-9 flex items-center justify-center rounded-xl
              border border-[var(--border)] bg-[var(--bg3)]
              hover:bg-[var(--verde-bg)] hover:border-[var(--verde-border)] hover:text-[var(--verde)]
              text-[var(--text2)] transition-all duration-200 active:scale-90"
          >
            {isOpen && !isExiting ? (
              <ChevronUp size={18} className="transition-transform duration-300" />
            ) : (
              <Menu size={18} className="transition-transform duration-300" />
            )}
          </button>

          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 select-none active:scale-95 transition-transform"
          >
            <EscuelaInfoLogo size={32} />
            <span className="title-font text-xl font-black text-[var(--text)] hidden sm:block">
              Escuela<span className="text-[var(--verde)]">Info</span>
            </span>
          </button>
        </div>

        {/* Center: active tab label */}
        <span className="hidden md:block text-xs font-black uppercase tracking-[0.18em] text-[var(--text3)]">
          {{
            general: "Inicio",
            asistencia: "Asistencia",
            ausencias: "Ausencias",
            "mesas-examen": "Mesas de Examen",
            horarios: "Horarios",
            profesores: "Profesores",
            alumnos: "Alumnos",
            cursos: "Cursos",
            configuracion: "Accesos",
            auditoria: "Auditoría",
            "ciclo-lectivo": "Ciclo Lectivo",
          }[activeTab] ?? "EscuelaInfo"}
        </span>

        {/* Right: theme + avatar */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            className="w-9 h-9 flex items-center justify-center rounded-xl
              border border-[var(--border)] text-[var(--text2)]
              hover:bg-[var(--bg3)] hover:text-[var(--text)] transition-all"
          >
            {theme === "dark"
              ? <Sun size={16} className="text-yellow-400" />
              : <Moon size={16} className="text-indigo-500" />
            }
          </button>

          <button
            onClick={onProfileOpen}
            title="Ver perfil"
            className="flex items-center gap-2 px-2 py-1 rounded-xl
              hover:bg-[var(--bg3)] transition-all active:scale-95"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--verde)] flex items-center justify-center text-black font-black text-sm shadow-sm">
              {userInitial}
            </div>
            <span className="hidden sm:block text-xs font-bold text-[var(--text)] max-w-[100px] truncate">
              {userName.split(" ")[0]}
            </span>
          </button>
        </div>
      </header>

      {/* ── OVERLAY ────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`fixed inset-0 top-14 bg-black/40 backdrop-blur-[2px] z-[490] transition-opacity duration-300 ${isExiting ? "opacity-0" : "opacity-100"}`}
          onClick={closeSidebar}
        />
      )}

      {/* ── PANEL RETRÁCTIL (aparece debajo de la barra, se oculta hacia arriba) */}
      {isOpen && (
        <div
          className={`fixed top-14 left-0 right-0 z-[499] will-change-gpu
            bg-[var(--bg)]/98 backdrop-blur-xl border-b border-[var(--border)]
            shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18)]
            ${isExiting ? "top-nav-exit" : "top-nav-enter"}`}
        >
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-5">

            {/* Grid de tabs */}
            <nav aria-label="Menú principal" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-5">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const hasBadge =
                  (tab.id === "configuracion" && pendingAccessCount > 0) ||
                  (tab.id === "alumnos" && pendingAlumnosCount > 0);
                const badgeCount = tab.id === "configuracion" ? pendingAccessCount : pendingAlumnosCount;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id, tab.isExternal, (tab as any).url)}
                    className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold
                      transition-all duration-200 active:scale-95 text-left
                      ${isActive
                        ? "bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] shadow-sm font-black"
                        : "text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)] border border-transparent"
                      }`}
                  >
                    <span className="shrink-0">{tab.icon}</span>
                    <span className="truncate">{tab.label}</span>
                    {hasBadge && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--rojo)] rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer: perfil + logout */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => { onProfileOpen?.(); closeSidebar(); }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl
                  hover:bg-[var(--verde-bg)] hover:border-[var(--verde-border)] border border-transparent
                  transition-all group"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--verde)] flex items-center justify-center text-black font-black shadow-sm shrink-0">
                  {userInitial}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--verde)] transition-colors truncate max-w-[140px]">
                    {userName}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest font-black text-[var(--text3)]">
                    {rolLabel}
                  </p>
                </div>
                <Pencil size={13} className="text-[var(--text3)] group-hover:text-[var(--verde)] transition-colors ml-1" />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                  text-[var(--rojo)] border border-[var(--rojo-border)] bg-[var(--rojo-bg)]
                  hover:bg-[var(--rojo)] hover:text-white hover:border-[var(--rojo)]
                  font-bold text-sm transition-all active:scale-95"
              >
                <LogOut size={16} />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
