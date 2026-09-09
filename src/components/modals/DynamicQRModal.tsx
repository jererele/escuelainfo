"use client";

import { useEffect, useState, useMemo } from "react";
import { X, QrCode, Clock, CheckCircle2, Search, ListTodo, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { 
  UserProfile, 
  Profesor, 
  getProfesores, 
  getAlumnos, 
  Alumno, 
  saveAsistenciasJornada, 
  saveAsistenciasMateria 
} from "@/lib/dataService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
}

export default function DynamicQRModal({ isOpen, onClose, userProfile }: Props) {
  const [token, setToken] = useState("");
  const [timeLeft, setTimeLeft] = useState(15);
  const [mode, setMode] = useState<"jornada" | "materia">("jornada");
  const [selectedMateria, setSelectedMateria] = useState("");
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  
  // Asistencia Manual states
  const [tab, setTab] = useState<"qr" | "manual">("qr");
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [markedPresent, setMarkedPresent] = useState<Set<string>>(new Set());
  const [loadingManual, setLoadingManual] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getProfesores().then(setProfesores);
      getAlumnos().then(setAlumnos);
      setTab("qr");
      setMarkedPresent(new Set());
    }
  }, [isOpen]);

  const currentProfesor = useMemo(() => {
    if (!userProfile) return null;
    return profesores.find(p => p.email.toLowerCase() === userProfile.email.toLowerCase()) || null;
  }, [userProfile, profesores]);

  useEffect(() => {
    if (userProfile?.rol === "profesor") {
      setMode("materia");
      if (currentProfesor?.materias.length && !selectedMateria) {
        setSelectedMateria(currentProfesor.materias[0]);
      }
    }
  }, [userProfile, currentProfesor, selectedMateria]);

  // Generate new token every 15 seconds
  useEffect(() => {
    if (!isOpen || tab !== "qr") return;

    const generateToken = () => {
      const payload = {
        t: Date.now(),
        m: mode,
        s: mode === "materia" ? selectedMateria : "jornada",
        p: userProfile?.id || "admin" // issuer
      };
      const encoded = btoa(JSON.stringify(payload));
      setToken(encoded);
      setTimeLeft(15);
    };

    generateToken();
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateToken();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, mode, selectedMateria, userProfile, tab]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleMarkPresent = async (alumno: Alumno) => {
    if (!alumno.id || markedPresent.has(alumno.id) || loadingManual) return;
    setLoadingManual(true);
    
    try {
      const todayDate = new Date().toISOString().split("T")[0];
      const pId = userProfile?.id || "admin";

      if (mode === "jornada") {
        await saveAsistenciasJornada([{
          alumnoId: alumno.id,
          alumnoNombre: alumno.nombre,
          fecha: todayDate,
          estado: "P",
          preceptorId: pId
        }]);
      } else {
        await saveAsistenciasMateria([{
          alumnoId: alumno.id,
          alumnoNombre: alumno.nombre,
          fecha: todayDate,
          materia: selectedMateria,
          curso: alumno.curso,
          estado: "P",
          profesorId: pId
        }]);
      }
      
      setMarkedPresent(prev => {
        const next = new Set(prev);
        if (alumno.id) next.add(alumno.id);
        return next;
      });
    } catch (err) {
      console.error("Error al marcar asistencia manual:", err);
      alert("Hubo un error al guardar la asistencia.");
    } finally {
      setLoadingManual(false);
    }
  };

  const filteredAlumnos = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return alumnos
      .filter(a => a.nombre.toLowerCase().includes(query) || a.dni.includes(query))
      .slice(0, 10); // Limit to 10 results for performance
  }, [searchQuery, alumnos]);

  if (!isOpen) return null;

  const qrUrl = typeof window !== "undefined" 
    ? window.location.href.split('?')[0].replace(/\/dashboard\/?$/, "/scan/") + `?token=${token}` 
    : "";
  const canSelectJornada = userProfile?.rol === "admin" || userProfile?.rol === "directivo" || userProfile?.rol === "preceptor";

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[var(--bg)] w-full max-w-sm rounded-[32px] border border-[var(--border)] shadow-2xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] bg-[var(--bg2)] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)]">
              {tab === "qr" ? <QrCode size={20} /> : <ListTodo size={20} />}
            </div>
            <div>
              <h3 className="font-black text-[var(--text)] text-lg leading-tight">Asistencia</h3>
              <p className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider mt-0.5">Control de Presentes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg3)] text-[var(--text2)] transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 shrink-0">
          <div className="bg-[var(--bg3)] p-1 rounded-2xl border border-[var(--border)] flex">
            <button 
              onClick={() => setTab("qr")}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${tab === "qr" ? "bg-white shadow-sm text-black" : "text-[var(--text3)] hover:text-[var(--text2)]"}`}>
              Escanear QR
            </button>
            <button 
              onClick={() => setTab("manual")}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${tab === "manual" ? "bg-white shadow-sm text-black" : "text-[var(--text3)] hover:text-[var(--text2)]"}`}>
              Modo Manual
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col items-center space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* General Config (Type of Attendance) */}
          <div className="w-full space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text3)] ml-1">Tipo de Asistencia</label>
              <select
                className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3 outline-none font-bold text-[var(--text)] text-sm focus:border-[var(--verde)] transition-colors appearance-none"
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                disabled={!canSelectJornada && userProfile?.rol === "profesor"}
              >
                {canSelectJornada && <option value="jornada">Jornada General</option>}
                {(userProfile?.rol === "profesor" || canSelectJornada) && <option value="materia">Por Materia</option>}
              </select>
            </div>

            {mode === "materia" && currentProfesor && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text3)] ml-1">Seleccionar Materia</label>
                <select
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3 outline-none font-bold text-[var(--text)] text-sm focus:border-[var(--verde)] transition-colors appearance-none"
                  value={selectedMateria}
                  onChange={(e) => setSelectedMateria(e.target.value)}
                >
                  {currentProfesor.materias.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  {currentProfesor.materias.length === 0 && <option value="">Sin materias asignadas</option>}
                </select>
              </div>
            )}
          </div>

          {tab === "qr" ? (
            // QR VIEW
            <div className="flex flex-col items-center space-y-6 animate-fade-in w-full">
              <div className="bg-white p-4 rounded-[28px] shadow-sm border-[4px] border-[var(--verde-bg)]">
                <QRCodeSVG value={qrUrl} size={200} level="H" includeMargin={false} />
              </div>
              
              <div className="flex items-center gap-2 bg-[var(--bg3)] px-4 py-2 rounded-xl border border-[var(--border)]">
                <Clock size={14} className="text-[var(--text2)]" />
                <span className="text-xs font-bold font-mono text-[var(--text)]">Expira en: <span className={timeLeft <= 5 ? "text-[var(--rojo)]" : "text-[var(--verde)]"}>00:{timeLeft.toString().padStart(2, '0')}</span></span>
              </div>

              <p className="text-xs text-[var(--text2)] font-semibold text-center leading-relaxed max-w-[250px]">
                Los alumnos deben escanear este código con su celular para registrar su <span className="text-[var(--verde)] font-bold">presente</span> automáticamente.
              </p>
            </div>
          ) : (
            // MANUAL VIEW
            <div className="flex flex-col items-center space-y-4 animate-fade-in w-full">
              <div className="w-full space-y-2">
                <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text3)] ml-1">Buscar Alumno</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Nombre o DNI..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-2xl p-3 pl-10 outline-none font-bold text-[var(--text)] text-sm focus:border-[var(--verde)] transition-colors"
                  />
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
                </div>
              </div>

              <div className="w-full space-y-2 mt-2">
                {searchQuery.trim().length > 0 ? (
                  filteredAlumnos.length > 0 ? (
                    filteredAlumnos.map(alumno => {
                      const isMarked = alumno.id && markedPresent.has(alumno.id);
                      return (
                        <div key={alumno.id} className="flex items-center justify-between p-3 bg-[var(--bg3)] rounded-2xl border border-[var(--border)]">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[var(--text)]">{alumno.nombre}</span>
                            <span className="text-[10px] font-black uppercase text-[var(--text3)]">
                              DNI: {alumno.dni} • Curso: {alumno.curso}
                            </span>
                          </div>
                          <button
                            onClick={() => handleMarkPresent(alumno)}
                            disabled={isMarked || loadingManual}
                            className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                              isMarked 
                                ? "bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] opacity-100" 
                                : "bg-white text-black hover:bg-[var(--verde)] hover:text-white"
                            }`}
                          >
                            {isMarked ? <Check size={16} /> : <CheckCircle2 size={16} />}
                          </button>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center p-4 text-[var(--text3)] text-xs font-bold">
                      No se encontraron alumnos con esa búsqueda.
                    </div>
                  )
                ) : (
                  <div className="text-center p-4 text-[var(--text3)] text-xs font-bold flex flex-col items-center gap-2">
                    <ListTodo size={24} className="opacity-50" />
                    <span>Buscá por nombre para anotar presentes de forma manual.</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
