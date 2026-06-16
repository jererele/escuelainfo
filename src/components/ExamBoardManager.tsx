"use client";

import { useEffect, useState } from "react";
import { AppwriteException } from "appwrite";
import { UserProfile, Profesor, Alumno, MesaExamen, getProfesores, getAlumnos, getMesasExamen, saveMesaExamen, deleteMesaExamen, logAction, subscribeToMesasExamen } from "@/lib/dataService";
import { ClipboardCheck, Calendar, Clock, BookOpen, AlertCircle, Plus, X, Search, Check, Trash2, Edit } from "lucide-react";

interface Props {
  user: any;
  userProfile: UserProfile | null;
}

export default function ExamBoardManager({ user, userProfile }: Props) {
  const [role, setRole] = useState<string>("alumno");
  const [mesas, setMesas] = useState<MesaExamen[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para búsqueda y filtrado
  const [searchQuery, setSearchQuery] = useState("");

  // Control del formulario/modal de creación y edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMesa, setEditingMesa] = useState<MesaExamen | null>(null);

  // Campos del formulario
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [materia, setMateria] = useState("");
  const [aula, setAula] = useState("");
  const [presidenteId, setPresidenteId] = useState("");
  const [vocal1Id, setVocal1Id] = useState("");
  const [vocal2Id, setVocal2Id] = useState("");
  const [alumnosInput, setAlumnosInput] = useState(""); // Comma separated DNI or names
  const [estado, setEstado] = useState<"borrador" | "confirmada" | "evaluada">("borrador");

  // Estados de feedback SEPARADOS: panel exterior vs. modal interior
  const [panelError, setPanelError] = useState("");
  const [panelSuccess, setPanelSuccess] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setRole(userProfile.rol);
    }
  }, [userProfile]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const profs = await getProfesores();
      setProfesores(profs);
      const als = await getAlumnos();
      setAlumnos(als);
    } catch {
      setPanelError("Error cargando profesores/alumnos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();

    const unsubscribe = subscribeToMesasExamen((data) => {
      setMesas(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const openCreateModal = () => {
    setEditingMesa(null);
    setFecha(new Date().toISOString().split("T")[0]);
    setHora("08:00");
    setHoraFin("10:00");
    setMateria("");
    setAula("");
    setPresidenteId("");
    setVocal1Id("");
    setVocal2Id("");
    setAlumnosInput("");
    setEstado("borrador");
    // ✅ Limpieza explícita del estado interno del modal
    setModalError("");
    setModalLoading(false);
    setIsModalOpen(true);
  };

  const openEditModal = (m: MesaExamen) => {
    setEditingMesa(m);
    setFecha(m.fecha);
    setHora(m.hora);
    setHoraFin("10:00");
    setMateria(m.materia);
    setAula(m.aula);
    setPresidenteId(m.presidenteId);
    setVocal1Id(m.vocal1Id || "");
    setVocal2Id(m.vocal2Id || "");
    setAlumnosInput(m.alumnosInscriptos.join(", "));
    setEstado(m.estado);
    // ✅ Limpieza explícita del estado interno del modal
    setModalError("");
    setModalLoading(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta mesa de examen?")) return;
    setLoading(true);
    setPanelError("");
    setPanelSuccess("");
    try {
      await deleteMesaExamen(id);
      setPanelSuccess("Mesa de examen eliminada con éxito.");
      await logAction(userProfile?.email || "admin", "ELIMINAR_MESA_EXAMEN", `ID: ${id}`);
      refreshData();
    } catch (err) {
      if (err instanceof AppwriteException) {
        setPanelError(`Error Appwrite (${err.code}): ${err.message}`);
      } else {
        setPanelError("Error al eliminar la mesa de examen.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!fecha || !hora || !materia || !aula || !presidenteId) {
      setModalError("Completá todos los campos obligatorios (Fecha, Hora, Materia, Aula, Presidente).");
      return;
    }

    if ((estado === "confirmada" || estado === "evaluada") && !vocal1Id) {
      setModalError("Una mesa confirmada o evaluada debe tener asignado al menos al Vocal 1 (Mínimo 2 profesores).");
      return;
    }

    if (presidenteId === vocal1Id || presidenteId === vocal2Id || (vocal1Id && vocal1Id === vocal2Id)) {
      setModalError("Un profesor no puede cumplir más de un rol en la misma mesa de examen.");
      return;
    }

    const collisionPresidente = mesas.find(m =>
      m.id !== editingMesa?.id &&
      m.fecha === fecha &&
      m.hora === hora &&
      (m.presidenteId === presidenteId || m.vocal1Id === presidenteId || m.vocal2Id === presidenteId)
    );
    if (collisionPresidente) {
      const profName = profesores.find(p => p.id === presidenteId || p.dni === presidenteId)?.nombre || "Presidente";
      setModalError(`Conflicto de horario: El Prof. ${profName} ya está asignado a otra mesa el día ${fecha} a las ${hora}.`);
      return;
    }

    if (vocal1Id) {
      const collisionVocal1 = mesas.find(m =>
        m.id !== editingMesa?.id &&
        m.fecha === fecha &&
        m.hora === hora &&
        (m.presidenteId === vocal1Id || m.vocal1Id === vocal1Id || m.vocal2Id === vocal1Id)
      );
      if (collisionVocal1) {
        const profName = profesores.find(p => p.id === vocal1Id || p.dni === vocal1Id)?.nombre || "Vocal 1";
        setModalError(`Conflicto de horario: El Prof. ${profName} ya está asignado a otra mesa el día ${fecha} a las ${hora}.`);
        return;
      }
    }

    const pres = profesores.find(p => p.id === presidenteId || p.dni === presidenteId);
    const v1 = profesores.find(p => p.id === vocal1Id || p.dni === vocal1Id);
    const v2 = profesores.find(p => p.id === vocal2Id || p.dni === vocal2Id);

    const alInsc = alumnosInput.split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload: MesaExamen = {
      id: editingMesa?.id || undefined,
      fecha,
      hora,
      materia,
      aula,
      presidenteId,
      presidenteNombre: pres ? pres.nombre : "Presidente",
      vocal1Id: vocal1Id || undefined,
      vocal1Nombre: v1 ? v1.nombre : undefined,
      vocal2Id: vocal2Id || undefined,
      vocal2Nombre: v2 ? v2.nombre : undefined,
      alumnosInscriptos: alInsc,
      estado
    };

    // ✅ Usar estado de loading PROPIO del modal, no el global
    setModalLoading(true);
    try {
      await saveMesaExamen(payload);
      await logAction(
        userProfile?.email || "admin",
        editingMesa ? "EDITAR_MESA_EXAMEN" : "CREAR_MESA_EXAMEN",
        `Materia: ${materia}, Aula: ${aula}, Fecha: ${fecha}`
      );
      // ✅ Cerramos el modal ANTES de refrescar para evitar estado visual congelado
      setIsModalOpen(false);
      setPanelSuccess(editingMesa ? "Mesa de examen actualizada." : "Mesa de examen creada con éxito.");
      refreshData();
    } catch (err: unknown) {
      // ✅ Captura específica de AppwriteException sin congelar la UI
      if (err instanceof AppwriteException) {
        setModalError(
          err.code === 401
            ? "Sin permisos para realizar esta acción. Verificá tu sesión."
            : err.code === 409
            ? "Conflicto en la base de datos. Ya existe un registro con esos datos."
            : `Error de Appwrite (${err.code}): ${err.message}`
        );
      } else {
        setModalError("Ocurrió un error inesperado al guardar. Intentá de nuevo.");
      }
    } finally {
      // ✅ Siempre liberamos el estado de loading del modal
      setModalLoading(false);
    }
  };

  // Filtrado de mesas por búsqueda
  const filteredMesas = mesas.filter(m => {
    const q = searchQuery.toLowerCase();
    return (
      m.materia.toLowerCase().includes(q) ||
      m.aula.toLowerCase().includes(q) ||
      m.presidenteNombre.toLowerCase().includes(q) ||
      (m.vocal1Nombre && m.vocal1Nombre.toLowerCase().includes(q)) ||
      m.alumnosInscriptos.some(a => a.toLowerCase().includes(q))
    );
  });

  const canManage = role === "admin" || role === "directivo" || role === "preceptor";

  return (
    <div className="space-y-6">
      {/* Feedback alerts del PANEL EXTERIOR */}
      {panelSuccess && (
        <div className="flex items-center gap-2 bg-[var(--verde-bg)] border border-[var(--verde-border)] text-[var(--verde)] px-4 py-3 rounded-2xl text-sm font-semibold animate-fade-in">
          <Check size={18} className="shrink-0" />
          <span>{panelSuccess}</span>
        </div>
      )}
      {panelError && (
        <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-2xl text-sm font-semibold animate-fade-in">
          <AlertCircle size={18} className="shrink-0" />
          <span>{panelError}</span>
        </div>
      )}

      {/* Header and filters */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-[var(--border)] rounded-[32px] p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-[var(--text)] flex items-center gap-2">
              <ClipboardCheck className="text-[var(--verde)]" /> Cronograma de Mesas de Examen
            </h3>
            <p className="text-[var(--text2)] text-xs font-bold uppercase tracking-wider mt-1">Gestión y consulta de tribunales examinadores</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
              <input
                type="text"
                placeholder="Buscar por materia, docente o alumno..."
                className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-sm font-semibold outline-none text-[var(--text)] focus:border-[var(--verde)] w-64 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {canManage && (
              <button
                onClick={openCreateModal}
                className="bg-[var(--verde)] text-black font-black text-xs px-4 py-2.5 rounded-xl hover:-translate-y-0.5 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
              >
                <Plus size={16} /> Crear Mesa
              </button>
            )}
          </div>
        </div>

        {/* Mesas list grid */}
        {filteredMesas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMesas.map((m) => (
              <div
                key={m.id}
                className={`bg-white/50 dark:bg-slate-950/20 border rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden ${
                  m.estado === "borrador" ? "border-amber-500/30" : m.estado === "evaluada" ? "border-emerald-500/30" : "border-[var(--border)]"
                }`}
              >
                {/* State Tag badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  {m.estado === "borrador" && (
                    <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 font-black px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider">Borrador</span>
                  )}
                  {m.estado === "confirmada" && (
                    <span className="bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 font-black px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider">Confirmada</span>
                  )}
                  {m.estado === "evaluada" && (
                    <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-black px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider">Evaluada</span>
                  )}
                </div>

                <div className="space-y-1 pr-16">
                  <h4 className="font-black text-base text-[var(--text)] truncate">{m.materia}</h4>
                  <p className="text-xs font-bold text-[var(--verde)]">{m.aula}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-t border-[var(--border)] pt-3">
                  <div className="flex items-center gap-1.5 text-[var(--text2)] font-semibold">
                    <Calendar size={13} className="text-[var(--text3)]" />
                    <span>{m.fecha}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--text2)] font-semibold">
                    <Clock size={13} className="text-[var(--text3)]" />
                    <span>{m.hora} hs</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div>
                    <span className="font-bold text-[var(--text3)] uppercase text-[9px] tracking-wider block">Tribunal</span>
                    <p className="font-bold text-[var(--text)]"><span className="text-[var(--text3)] font-normal">P:</span> {m.presidenteNombre}</p>
                    {m.vocal1Nombre && <p className="font-semibold text-[var(--text2)]"><span className="text-[var(--text3)] font-normal">V1:</span> {m.vocal1Nombre}</p>}
                    {m.vocal2Nombre && <p className="font-semibold text-[var(--text2)]"><span className="text-[var(--text3)] font-normal">V2:</span> {m.vocal2Nombre}</p>}
                    {!m.vocal1Nombre && <p className="text-amber-500/90 font-semibold italic text-[11px]">⚠️ Sin vocales asignados</p>}
                  </div>

                  <div>
                    <span className="font-bold text-[var(--text3)] uppercase text-[9px] tracking-wider block">Alumnos ({m.alumnosInscriptos.length})</span>
                    <p className="text-[var(--text2)] truncate font-medium">
                      {m.alumnosInscriptos.length > 0 ? m.alumnosInscriptos.join(", ") : "Sin inscriptos"}
                    </p>
                  </div>
                </div>

                {canManage && (
                  <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-3">
                    <button
                      onClick={() => openEditModal(m)}
                      className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg3)] text-[var(--text2)] hover:text-[var(--text)] transition-colors active:scale-90"
                      title="Editar Mesa"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id!)}
                      className="p-1.5 rounded-lg border border-[var(--rojo-border)] hover:bg-[var(--rojo-bg)] text-[var(--rojo)] transition-colors active:scale-90"
                      title="Eliminar Mesa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-2xl">
            <ClipboardCheck size={40} className="mx-auto text-[var(--text3)] mb-2 animate-pulse" />
            <p className="text-sm font-bold text-[var(--text2)]">No se encontraron mesas de examen registradas.</p>
          </div>
        )}
      </div>

      {/* Modal para Crear/Editar Mesa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center lg:items-start lg:pt-[10vh] justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="bg-[var(--bg)] w-full max-w-lg rounded-[32px] p-8 border border-[var(--border)] shadow-2xl animate-zoom-in my-auto lg:my-0 lg:mb-[10vh]">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-2xl font-black title-font text-[var(--text)]">{editingMesa ? "Editar Mesa de Examen" : "Crear Mesa de Examen"}</h2>
                <p className="text-[var(--text2)] text-xs mt-1 font-bold uppercase tracking-wider">Tribunal evaluador y planificación</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all"><X size={18} /></button>
            </div>

            {/* Error del MODAL (separado del panel exterior) */}
            {modalError && (
              <div className="flex items-center gap-2 bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--rojo)] px-4 py-3 rounded-xl text-xs font-semibold mt-4">
                <AlertCircle size={14} className="shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Fecha *</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-sm"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Hora Inicio *</label>
                  <input
                    type="time"
                    required
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-sm"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Hora Fin *</label>
                  <input
                    type="time"
                    required
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-sm"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Materia / Asignatura *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Matemática I, Historia..."
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-sm"
                  value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Aula Física *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Aula 3, Biblioteca, Laboratorio..."
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-sm"
                  value={aula}
                  onChange={(e) => setAula(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Presidente de Mesa *</label>
                <select
                  required
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-sm text-[var(--text)]"
                  value={presidenteId}
                  onChange={(e) => setPresidenteId(e.target.value)}
                >
                  <option value="">— Seleccionar Presidente —</option>
                  {profesores.map(p => <option key={p.id || p.dni} value={p.id || p.dni}>{p.nombre} (DNI: {p.dni})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Vocal 1</label>
                  <select
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-xs text-[var(--text)]"
                    value={vocal1Id}
                    onChange={(e) => setVocal1Id(e.target.value)}
                  >
                    <option value="">— Sin Asignar —</option>
                    {profesores.map(p => <option key={p.id || p.dni} value={p.id || p.dni}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Vocal 2</label>
                  <select
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-xs text-[var(--text)]"
                    value={vocal2Id}
                    onChange={(e) => setVocal2Id(e.target.value)}
                  >
                    <option value="">— Sin Asignar —</option>
                    {profesores.map(p => <option key={p.id || p.dni} value={p.id || p.dni}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Alumnos Inscriptos</label>
                <textarea
                  placeholder="Separados por comas: Pérez Juan, Gómez María, 44102931..."
                  rows={2}
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-semibold focus:border-[var(--verde)] text-sm"
                  value={alumnosInput}
                  onChange={(e) => setAlumnosInput(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text3)] mb-1 block ml-2">Estado de la Mesa</label>
                <select
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-4 outline-none font-bold focus:border-[var(--verde)] text-sm text-[var(--text)]"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as any)}
                >
                  <option value="borrador">Borrador (Mesa en planeación)</option>
                  <option value="confirmada">Confirmada (Tribunal completo listo)</option>
                  <option value="evaluada">Evaluada (Exámenes tomados y cerrados)</option>
                </select>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => { setIsModalOpen(false); setModalError(""); }}
                  className="flex-1 p-4 rounded-2xl border border-[var(--border)] font-bold hover:bg-[var(--bg3)] transition-all active:scale-95 text-sm">Cancelar</button>
                <button type="submit" disabled={modalLoading}
                  className="flex-1 p-4 rounded-2xl bg-[var(--verde)] text-black font-black disabled:opacity-50 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all text-sm">
                  {modalLoading ? "Guardando..." : (editingMesa ? "Actualizar Mesa" : "Crear Mesa")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
