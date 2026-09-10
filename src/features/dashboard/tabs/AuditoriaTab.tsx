import React from "react";

interface LogEntry {
  usuarioEmail: string;
  accion: string;
  detalles: string;
  fecha: string;
}

interface AuditoriaTabProps {
  logs: LogEntry[];
}

export const AuditoriaTab: React.FC<AuditoriaTabProps> = ({ logs }) => {
  return (
    <div className="animate-fade-in">
      <div className="mb-12">
        <h2 className="text-3xl font-black title-font">Logs de Seguridad</h2>
        <p className="text-[var(--text2)]">Historial completo de acciones realizadas en el sistema.</p>
      </div>

      <div className="card glass rounded-[32px] border border-[var(--border)] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black text-white">
            <tr>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest">Usuario</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest">Acción</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest">Detalles</th>
              <th className="p-6 text-[10px] font-black uppercase tracking-widest">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-20 text-center text-[var(--text3)] italic">
                  No hay actividad registrada aún.
                </td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <tr key={i} className="border-b border-[var(--border)] hover:bg-white/5 transition-colors">
                  <td className="p-6 font-bold text-sm">{log.usuarioEmail}</td>
                  <td className="p-6">
                    <span className="px-2 py-1 bg-gray-200 text-black text-[9px] font-black rounded uppercase">
                      {log.accion}
                    </span>
                  </td>
                  <td className="p-6 text-xs text-[var(--text2)]">{log.detalles}</td>
                  <td className="p-6 text-[10px] font-bold">{new Date(log.fecha).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditoriaTab;
