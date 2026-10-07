import React from "react";
import { Trash2, Check, X, Zap, ArrowRight } from "lucide-react";
import { UserProfile, isPendingRole } from "@/lib/dataService";
import { APP_VERSION, APP_BUILD_DATE } from "@/lib/version";
import UserAvatar from "@/components/ui/UserAvatar";

interface ConfiguracionTabProps {
  usuarios: UserProfile[];
  userProfile: UserProfile | null;
  isAdmin: boolean;
  onOpenUserModal: () => void;
  onOpenVersionModal: () => void;
  onApproveRequest: (u: UserProfile) => void;
  onRejectRequest: (u: UserProfile) => void;
  onRevokeAccess: (u: UserProfile) => void;
}

export const ConfiguracionTab: React.FC<ConfiguracionTabProps> = ({
  usuarios,
  userProfile,
  isAdmin,
  onOpenUserModal,
  onOpenVersionModal,
  onApproveRequest,
  onRejectRequest,
  onRevokeAccess,
}) => {
  const pendingRequests = usuarios.filter(u => {
    if (!isPendingRole(u.rol)) return false;
    if ((u.rol as string) === "pendiente_alumno" || u.rol === "pendiente") return false;
    if (userProfile?.rol === 'admin') return true;
    if (userProfile?.rol === 'directivo') {
      return (u.rol as string) === 'pendiente_preceptor' || (u.rol as string) === 'pendiente_profesor';
    }
    return false;
  });

  const activeCollaborators = usuarios.filter(u => {
    if (isPendingRole(u.rol)) return false;
    if (u.rol === "alumno") return false;
    if (userProfile?.rol === 'admin') return true;
    if (userProfile?.rol === 'directivo') {
      return u.rol === 'directivo' || u.rol === 'preceptor' || u.rol === 'profesor';
    }
    return false;
  });

  return (
    <div className="animate-fade-in space-y-10">
      {/* SOLICITUDES DE REGISTRO PENDIENTES */}
      {pendingRequests.length > 0 && (
        <div className="animate-fade-in">
          <h3 className="text-xl font-black title-font mb-4 text-[var(--amarillo)] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--amarillo)] animate-pulse inline-block"></span>
            Solicitudes de Acceso Pendientes
          </h3>
          <div className="card glass rounded-2xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg3)]/50">
                <tr>
                  <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Solicitante</th>
                  <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Rol Solicitado</th>
                  <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(u => {
                  const cleanRole = u.rol.replace("pendiente_", "");
                  return (
                    <tr key={u.id} className="hover:bg-[var(--bg3)]/20 transition-colors border-b border-[var(--border)] last:border-none">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={u.nombre} email={u.email} size={36} showRing={false} />
                          <div>
                            <div className="font-bold text-[var(--text)]">{u.nombre}</div>
                            <div className="text-xs text-[var(--text3)]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-[var(--amarillo-bg)] text-[var(--amarillo)] border border-[var(--amarillo-border)] rounded-lg text-xs font-bold uppercase">
                          {cleanRole}
                        </span>
                      </td>
                      <td className="p-6 text-right space-x-2">
                        <button
                          onClick={() => onApproveRequest(u)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-lg text-xs font-bold hover:bg-[var(--verde)] hover:text-black transition-colors cursor-pointer"
                        >
                          <Check size={13} strokeWidth={2.5} />
                          <span>Aprobar</span>
                        </button>
                        <button
                          onClick={() => onRejectRequest(u)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] rounded-lg text-xs font-bold hover:bg-[var(--rojo)] hover:text-white transition-colors cursor-pointer"
                        >
                          <X size={13} strokeWidth={2.5} />
                          <span>Rechazar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FICHA DE VERSIÓN Y ESTADO DEL SISTEMA (Solo Admin) */}
      {userProfile?.rol === 'admin' && (
        <div className="card glass rounded-2xl p-5 sm:p-6 border border-[var(--border)] bg-[var(--bg2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] flex items-center justify-center shrink-0">
              <Zap size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-[var(--text)]">Versión del Sistema EscuelaInfo</h4>
                <button
                  onClick={onOpenVersionModal}
                  className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] hover:bg-[var(--verde-border)]/20 transition-colors cursor-pointer"
                  title="Ver novedades de la versión"
                >
                  {APP_VERSION}
                </button>
              </div>
              <p className="text-xs text-[var(--text2)] font-medium mt-0.5">
                Estado: <span className="inline-flex items-center gap-1 text-[var(--verde)] font-bold"><Check size={12} strokeWidth={2.5} /> Sistema Actualizado</span> · Compilación: {APP_BUILD_DATE}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenVersionModal}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--verde)] bg-[var(--verde-bg)] hover:bg-[var(--verde)] hover:text-black px-3.5 py-2 rounded-lg border border-[var(--verde-border)] transition-colors cursor-pointer shadow-xs"
          >
            <span>Ver Novedades</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-5 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold title-font text-[var(--text)]">Configuración de Accesos</h2>
            <p className="text-[var(--text2)] text-xs sm:text-sm mt-0.5">Gestión de colaboradores, directivos y preceptores autorizados.</p>
          </div>
          {isAdmin && (
            <button 
              onClick={onOpenUserModal}
              className="bg-black text-white font-bold px-5 py-2.5 rounded-xl hover:brightness-110 transition-colors shadow-xs cursor-pointer text-sm"
            >
              + Autorizar Colaborador
            </button>
          )}
        </div>

        <div className="card glass rounded-2xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg3)]/50">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Colaborador</th>
                <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Estado de Ingreso</th>
                <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest">Rol Asignado</th>
                <th className="p-6 text-[10px] font-black uppercase text-[var(--text2)] tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activeCollaborators.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-[var(--text3)] italic">
                    No hay colaboradores registrados.
                  </td>
                </tr>
              ) : (
                activeCollaborators.map(u => (
                  <tr key={u.id} className="hover:bg-[var(--bg3)]/20 transition-colors border-b border-[var(--border)] last:border-none">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={u.nombre} email={u.email} size={36} showRing={false} />
                        <div>
                          <div className="font-bold">{u.nombre}</div>
                          <div className="text-xs text-[var(--text3)]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      {u.uid.startsWith("PENDING_") ? (
                        <span className="inline-flex flex-col items-center justify-center text-center px-3 py-1.5 bg-[var(--amarillo-bg)] text-[var(--amarillo)] border border-[var(--amarillo-border)] rounded-xl text-[10px] font-black uppercase tracking-wider leading-tight">
                          <span>Invitación</span>
                          <span>Pendiente</span>
                        </span>
                      ) : (
                        <span className="inline-flex flex-col items-center justify-center text-center px-3 py-1.5 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-xl text-[10px] font-black uppercase tracking-wider leading-tight">
                          <span>Registrado</span>
                          <span>y Activo</span>
                        </span>
                      )}
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 bg-[var(--bg3)] rounded-lg text-xs font-bold uppercase">
                        {u.rol === 'admin' ? 'Administrador' : (u.rol === 'directivo' ? 'Directivo' : u.rol)}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      {((u.rol !== 'admin' || userProfile?.rol === 'admin') && u.email !== userProfile?.email) ? (
                        <button 
                          onClick={() => onRevokeAccess(u)} 
                          className="text-[var(--rojo)] hover:scale-125 transition-transform cursor-pointer"
                          title="Revocar Acceso"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-[var(--text3)] italic">Protegido</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionTab;
