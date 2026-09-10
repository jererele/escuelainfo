import React from "react";
import { Trash2 } from "lucide-react";
import { UserProfile } from "@/lib/dataService";
import { APP_VERSION, APP_BUILD_DATE } from "@/lib/version";

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
    if (!u.rol.startsWith("pendiente_")) return false;
    if ((u.rol as string) === "pendiente_alumno") return false;
    if (userProfile?.rol === 'admin') return true;
    if (userProfile?.rol === 'directivo') {
      return (u.rol as string) === 'pendiente_preceptor' || (u.rol as string) === 'pendiente_profesor';
    }
    return false;
  });

  const activeCollaborators = usuarios.filter(u => {
    if (u.rol.startsWith("pendiente_")) return false;
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
          <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
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
                        <div className="font-bold text-[var(--text)]">{u.nombre}</div>
                        <div className="text-xs text-[var(--text3)]">{u.email}</div>
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-[var(--amarillo-bg)] text-[var(--amarillo)] border border-[var(--amarillo-border)] rounded-lg text-xs font-bold uppercase">
                          {cleanRole}
                        </span>
                      </td>
                      <td className="p-6 text-right space-x-2">
                        <button
                          onClick={() => onApproveRequest(u)}
                          className="px-4 py-2 bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] rounded-xl text-xs font-bold hover:bg-[var(--verde)] hover:text-black transition-all cursor-pointer"
                        >
                          ✓ Aprobar
                        </button>
                        <button
                          onClick={() => onRejectRequest(u)}
                          className="px-4 py-2 bg-[var(--rojo-bg)] text-[var(--rojo)] border border-[var(--rojo-border)] rounded-xl text-xs font-bold hover:bg-[var(--rojo)] hover:text-white transition-all cursor-pointer"
                        >
                          ✕ Rechazar
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
        <div className="card glass rounded-[28px] p-6 border border-[var(--border)] bg-[var(--bg2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] flex items-center justify-center font-mono font-black text-sm shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-base text-[var(--text)]">Versión del Sistema EscuelaInfo</h4>
                <button
                  onClick={onOpenVersionModal}
                  className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] hover:scale-105 transition-all cursor-pointer"
                  title="Ver novedades de la versión"
                >
                  {APP_VERSION}
                </button>
              </div>
              <p className="text-xs text-[var(--text2)] font-semibold mt-0.5">
                Estado: <span className="text-[var(--verde)] font-bold">✓ Sistema Actualizado</span> · Compilación: {APP_BUILD_DATE}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenVersionModal}
            className="text-xs font-black uppercase tracking-wider text-[var(--verde)] bg-[var(--verde-bg)] hover:bg-[var(--verde)] hover:text-black px-4 py-2 rounded-xl border border-[var(--verde-border)] transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Ver Novedades →
          </button>
        </div>
      )}

      <div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-black title-font text-[var(--text)]">Configuración de Accesos</h2>
            <p className="text-[var(--text2)]">Gestión de colaboradores, directivos y preceptores autorizados.</p>
          </div>
          {isAdmin && (
            <button 
              onClick={onOpenUserModal}
              className="bg-black text-white font-bold px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl cursor-pointer"
            >
              + Autorizar Colaborador
            </button>
          )}
        </div>

        <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
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
                      <div className="font-bold">{u.nombre}</div>
                      <div className="text-xs text-[var(--text3)]">{u.email}</div>
                    </td>
                    <td className="p-6">
                      {u.uid.startsWith("PENDING_") ? (
                        <span className="text-[10px] font-black uppercase px-2 py-1 bg-[var(--amarillo-bg)] text-[var(--amarillo)] rounded">
                          Invitación Pendiente
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2 py-1 bg-[var(--verde-bg)] text-[var(--verde)] rounded">
                          Registrado y Activo
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
