import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Trash2, Plus, AlertCircle } from "lucide-react";
import { getSuspensiones, saveSuspension, deleteSuspension, SuspensionEdilicia, logAction } from "@/lib/dataService";

interface CalendarioTabProps {
  user: any;
  userProfile: any;
  showToast: (msg: string, type?: "success" | "error") => void;
}

export const CalendarioTab: React.FC<CalendarioTabProps> = ({ user, userProfile, showToast }) => {
  const [suspensiones, setSuspensiones] = useState<SuspensionEdilicia[]>([]);
  const [fecha, setFecha] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const data = await getSuspensiones();
      // Ordenar por fecha descendente
      setSuspensiones(data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !motivo) return;

    setLoading(true);
    try {
      const newSuspension: SuspensionEdilicia = {
        id: Date.now().toString(),
        fecha,
        motivo
      };
      await saveSuspension(newSuspension);
      await logAction(userProfile?.email || "admin", "AGREGAR_SUSPENSION_EDILICIA", `${fecha} - ${motivo}`);
      showToast("Suspensión agregada exitosamente.", "success");
      setFecha("");
      setMotivo("");
      loadData();
    } catch (e) {
      showToast("Error al agregar la suspensión", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que querés eliminar este día no laborable?")) return;
    try {
      await deleteSuspension(id);
      showToast("Suspensión eliminada.", "success");
      loadData();
    } catch (e) {
      showToast("Error al eliminar", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <CalendarIcon size={32} className="text-[var(--verde)]" />
        <div>
          <h2 className="title-font font-black text-2xl">Calendario Institucional</h2>
          <p className="text-[var(--text2)] text-xs font-bold uppercase tracking-wider">Gestión de Suspensiones Edilicias y Días Libres</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <form onSubmit={handleAdd} className="card glass p-6 rounded-[32px] border border-[var(--border)] space-y-4 shadow-sm">
            <h3 className="font-black text-lg text-[var(--text)]">Nueva Suspensión</h3>
            <p className="text-xs text-[var(--text2)]">Este día aparecerá como "Suspensión Institucional" en el sistema y bloqueará la toma de licencias o firmas de asistencia.</p>
            
            <div className="space-y-2">
              <label 
                htmlFor="cal-fecha-suspension"
                className="text-[10px] font-black uppercase text-[var(--text3)] cursor-pointer select-none"
                onClick={() => { try { (document.getElementById("cal-fecha-suspension") as HTMLInputElement)?.showPicker?.(); } catch {} }}
              >
                Fecha
              </label>
              <input 
                id="cal-fecha-suspension"
                type="date" 
                required
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all font-bold cursor-pointer"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                onClick={(e) => { try { e.currentTarget.showPicker?.(); } catch {} }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text3)]">Motivo (Ej: Falta de Agua, Desinfección)</label>
              <input 
                type="text" 
                required
                placeholder="Falta de suministro eléctrico..."
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--verde)] transition-all font-bold"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[var(--verde)] text-black font-black text-sm hover:-translate-y-0.5 active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
              <Plus size={18} className="inline mr-1" />
              Agregar al Calendario
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="card glass p-6 rounded-[32px] border border-[var(--border)] shadow-sm">
            <h3 className="font-black text-lg mb-4 text-[var(--text)]">Días Suspendidos Cargados</h3>
            
            {suspensiones.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-2xl">
                <CalendarIcon size={32} className="mx-auto text-[var(--text3)] mb-2 opacity-50" />
                <p className="text-sm font-bold text-[var(--text2)]">No hay suspensiones registradas actualmente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suspensiones.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-[var(--bg3)] border border-[var(--border)] rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-[var(--amarillo-bg)] text-[var(--amarillo)] p-2 rounded-xl">
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <div className="font-black text-sm text-[var(--text)]">{s.motivo}</div>
                        <div className="text-xs font-bold text-[var(--text2)]">{new Date(s.fecha).toLocaleDateString('es-AR')}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(s.id)}
                      className="p-2 text-[var(--rojo)] hover:bg-[var(--rojo-bg)] rounded-xl transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
