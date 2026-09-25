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
  BookOpen,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ClipboardCheck,
  Activity,
  Edit3,
  ShieldCheck
} from "lucide-react";
import { UserProfile } from "@/lib/dataService";
import { gamerEasterEgg } from "@/lib/gamerEasterEgg";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuBadge
} from "@/components/ui/sidebar";
import EscuelaInfoLogo from "@/components/shared/EscuelaInfoLogo";
import { APP_VERSION } from "@/lib/version";
import VersionModal from "@/components/modals/VersionModal";
import UserAvatar from "@/components/ui/UserAvatar";

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
  pendingUsersCount?: number;
  pendingAccessCount?: number;
  pendingAlumnosCount?: number;
  toggleSidebar?: () => void;
}

export default function Sidebar({
  user,
  userProfile,
  activeTab,
  setActiveTab,
  showSecretAdmin,
  handleLogoClick,
  handleLogout,
  onTabChange,
  onProfileOpen,
  pendingUsersCount = 0,
  pendingAccessCount = 0,
  pendingAlumnosCount = 0,
}: SidebarProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const { state, isMobile, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  useEffect(() => {
    const activeTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(activeTheme);
  }, []);

  const toggleTheme = () => {
    gamerEasterEgg.registerThemeToggle();
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

  const tabs = [
    { id: "general", label: "Inicio", icon: <LayoutDashboard size={20} />, roles: ["admin", "directivo", "preceptor", "profesor"] },
    { id: "usuarios", label: "Usuarios", icon: <UserCheck size={20} />, roles: ["admin", "directivo", "preceptor"] },
    { id: "monitor-asistencia", label: "Monitor Asistencia", icon: <Activity size={20} />, roles: ["admin", "directivo", "preceptor"] },
    { id: "asistencia", label: "Asistencia", icon: <UserCheck size={20} />, roles: ["admin", "directivo", "preceptor", "profesor", "alumno"] },
    { id: "ausencias", label: "Ausencias", icon: <ClipboardList size={20} />, roles: ["admin", "directivo", "preceptor", "profesor"] },
    { id: "mesas-examen", label: "Mesas Examen", icon: <ClipboardCheck size={20} />, roles: ["admin", "directivo", "preceptor", "profesor", "alumno"] },
    { id: "horarios", label: "Horarios", icon: <CalendarDays size={20} />, roles: ["admin", "directivo", "preceptor", "profesor", "alumno"] },
    { id: "profesores", label: "Profesores", icon: <GraduationCap size={20} />, roles: ["admin", "directivo", "preceptor", "profesor"] },
    { id: "preceptores", label: "Preceptores", icon: <ShieldCheck size={20} />, roles: ["admin", "directivo"] },
    { id: "alumnos", label: "Alumnos", icon: <Users size={20} />, roles: ["admin", "directivo", "preceptor"] },
    { id: "cursos", label: "Cursos", icon: <FolderOpen size={20} />, roles: ["admin", "directivo", "preceptor"] },
    { id: "calendario", label: "Calendario", icon: <CalendarDays size={20} />, roles: ["admin", "directivo"] },
    { id: "classroom", label: "Google Classroom", icon: <BookOpen size={20} />, roles: ["admin", "profesor", "alumno"], isExternal: true, url: "https://classroom.google.com" },
    { id: "ciclo-lectivo", label: "Ciclo Lectivo", icon: <RefreshCw size={20} />, roles: ["admin", "directivo"] },
    ...((userProfile?.rol === 'admin' || userProfile?.rol === 'directivo') ? [{ id: "configuracion", label: "Accesos", icon: <Settings size={20} />, roles: ["admin", "directivo"] }] : []),
    ...(showSecretAdmin ? [{ id: "auditoria", label: "Auditoría", icon: <ShieldAlert size={20} />, roles: ["admin", "directivo"] }] : [])
  ].filter(tab => tab.roles.includes(userProfile?.rol || "alumno"));

  return (
    <>
    <ShadcnSidebar collapsible="icon" className="border-r border-[var(--border)] bg-transparent">
      <SidebarHeader className="py-4">
        <div 
          onClick={handleLogoClick}
          className={`flex items-center cursor-pointer select-none active:scale-95 transition-all overflow-hidden ${isCollapsed ? 'justify-center p-2' : 'px-2 gap-3'}`}
        >
          <div className="flex items-center justify-center shrink-0">
            <EscuelaInfoLogo size={40} />
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="title-font text-2xl font-black whitespace-nowrap">
                Escuela<span className="text-[var(--verde)]">Info</span>
              </div>
              {userProfile?.rol === 'admin' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVersionModalOpen(true);
                  }}
                  className="px-1.5 py-0.5 text-[9px] font-mono font-black rounded-full bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Ver novedades de la versión (Solo Administrador)"
                >
                  {APP_VERSION}
                </button>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5 px-2">
              {tabs.map((tab) => {
                let showBadge = false;
                let badgeCount = 0;
                
                if (tab.id === 'usuarios' && pendingUsersCount > 0) {
                  showBadge = true;
                  badgeCount = pendingUsersCount;
                }

                return (
                  <SidebarMenuItem key={tab.id}>
                    <SidebarMenuButton
                      tooltip={tab.label}
                      isActive={activeTab === tab.id}
                      onClick={() => { 
                        if (tab.isExternal && tab.url) {
                          window.open(tab.url, "_blank", "noopener,noreferrer");
                          return;
                        }
                        setActiveTab(tab.id); 
                        if (onTabChange) onTabChange(tab.id);
                      }}
                      className={`h-11 rounded-xl transition-all duration-300 font-semibold group ${
                        activeTab === tab.id 
                          ? "bg-[var(--verde-bg)]! text-[var(--verde)]! shadow-[0_4px_12px_rgba(16,185,129,0.15)] scale-[1.03] hover:bg-[var(--verde-bg)]! hover:text-[var(--verde)]!" 
                          : "text-[var(--text2)] hover:bg-[var(--bg3)]! hover:text-[var(--text)] hover:scale-105 hover:translate-x-1"
                      }`}
                    >
                      <span className="shrink-0">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </SidebarMenuButton>

                    {showBadge && (
                      <SidebarMenuBadge>
                        {isCollapsed ? (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--rojo)] rounded-full animate-pulse" />
                        ) : (
                          <span className="bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] text-[9px] font-black w-5 h-5 rounded-lg flex items-center justify-center shrink-0">
                            {badgeCount}
                          </span>
                        )}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 flex flex-col gap-4">
        {/* Theme Toggle Button */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Cambiar Tema"
              onClick={toggleTheme}
              className="h-11 rounded-xl text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)] transition-all font-semibold"
            >
              <span className="shrink-0">
                {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}
              </span>
              <span className="whitespace-nowrap flex-1 flex justify-between items-center text-sm">
                <span>{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {!isCollapsed ? (
          <button
            onClick={onProfileOpen}
            title="Ver mi perfil"
            className="w-full p-3 bg-[var(--bg2)] rounded-2xl flex items-center gap-3 border border-[var(--border)] shadow-sm hover:border-[var(--verde-border)] hover:bg-[var(--verde-bg)] transition-all hover:scale-105 active:scale-98 group text-left">
            <UserAvatar
              name={userProfile?.nombre || user?.displayName || "Usuario"}
              email={userProfile?.email || user?.email}
              size={40}
              showRing={true}
            />
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-bold truncate text-[var(--text)] group-hover:text-[var(--verde)] transition-colors">{user?.displayName || userProfile?.nombre || "Usuario"}</p>
              <p className="text-[10px] text-[var(--text3)] uppercase tracking-widest font-black truncate">
                {userProfile?.rol === 'admin' ? 'Administrador' : (userProfile?.rol === 'directivo' ? 'Directivo' : (userProfile?.rol || "Invitado"))}
              </p>
            </div>
            <Edit3 size={12} className="text-[var(--text3)] group-hover:text-[var(--verde)] transition-colors shrink-0" />
          </button>
        ) : (
          <button onClick={onProfileOpen} title="Ver mi perfil" className="shrink-0 w-10 h-10 flex justify-center items-center mx-auto hover:scale-110 active:scale-95 transition-all">
            <UserAvatar
              name={userProfile?.nombre || user?.displayName || "Usuario"}
              email={userProfile?.email || user?.email}
              size={40}
              showRing={true}
            />
          </button>
        )}
        
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Salir"
              onClick={handleLogout}
              className="h-11 text-[var(--rojo)] hover:bg-[var(--rojo-bg)] rounded-xl transition-all font-bold border border-transparent hover:border-[var(--rojo-border)]"
            >
              <span className="shrink-0"><LogOut size={20} /></span>
              <span>Salir</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </ShadcnSidebar>

    {userProfile?.rol === 'admin' && (
      <VersionModal isOpen={isVersionModalOpen} onClose={() => setIsVersionModalOpen(false)} />
    )}
    </>
  );
}
