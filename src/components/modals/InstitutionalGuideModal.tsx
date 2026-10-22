"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  ShieldCheck,
  GraduationCap,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  QrCode,
  Mail,
  FileSpreadsheet,
  FileText,
  LifeBuoy,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import EscuelaInfoLogo from "@/components/shared/EscuelaInfoLogo";
import { APP_VERSION } from "@/lib/version";

interface InstitutionalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: "preceptor" | "profesor" | "directivo" | "alumno" | "contingencia";
}

type GuideTab = "preceptor" | "profesor" | "directivo" | "alumno" | "contingencia";

export default function InstitutionalGuideModal({
  isOpen,
  onClose,
  defaultRole = "preceptor",
}: InstitutionalGuideModalProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>(defaultRole);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:static">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[var(--bg2)] text-[var(--text)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden print:max-h-none print:border-none print:shadow-none print:w-full"
        role="dialog"
        aria-modal="true"
        aria-label="Guía Oficial y Procedimientos Institucionales"
      >
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--bg3)]/50 flex items-center justify-between gap-4 shrink-0 print:border-b-2 print:border-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--verde-bg)] border border-[var(--verde-border)] flex items-center justify-center text-[var(--verde)] shrink-0 print:border-black">
              <EscuelaInfoLogo size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black title-font">
                  Guía Oficial de Procedimientos
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] print:border-black">
                  {APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-[var(--text3)] font-medium">
                Escuela N° 713 «Juan Abdala Chayep» · Manual de referencia operativa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--bg3)] hover:bg-[var(--bg)] border border-[var(--border)] text-[var(--text2)] hover:text-[var(--text)] transition-colors cursor-pointer"
              title="Imprimir guía para cartelera"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--bg3)] hover:bg-[var(--rojo-bg)] hover:text-[var(--rojo)] border border-[var(--border)] transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Selector de Pestañas por Rol (Oculto al imprimir) */}
        <div className="px-5 pt-3 pb-2 border-b border-[var(--border)] bg-[var(--bg2)] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 print:hidden">
          <button
            onClick={() => setActiveTab("preceptor")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "preceptor"
                ? "bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] shadow-xs"
                : "text-[var(--text2)] hover:bg-[var(--bg3)] border border-transparent"
            }`}
          >
            <Users size={14} />
            <span>Preceptores (POD/POT)</span>
          </button>
          <button
            onClick={() => setActiveTab("profesor")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "profesor"
                ? "bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] shadow-xs"
                : "text-[var(--text2)] hover:bg-[var(--bg3)] border border-transparent"
            }`}
          >
            <GraduationCap size={14} />
            <span>Personal Docente</span>
          </button>
          <button
            onClick={() => setActiveTab("directivo")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "directivo"
                ? "bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] shadow-xs"
                : "text-[var(--text2)] hover:bg-[var(--bg3)] border border-transparent"
            }`}
          >
            <ShieldCheck size={14} />
            <span>Equipo Directivo</span>
          </button>
          <button
            onClick={() => setActiveTab("alumno")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "alumno"
                ? "bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] shadow-xs"
                : "text-[var(--text2)] hover:bg-[var(--bg3)] border border-transparent"
            }`}
          >
            <QrCode size={14} />
            <span>Alumnos y Familias</span>
          </button>
          <button
            onClick={() => setActiveTab("contingencia")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "contingencia"
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/30 shadow-xs"
                : "text-[var(--text2)] hover:bg-[var(--bg3)] border border-transparent"
            }`}
          >
            <AlertTriangle size={14} />
            <span>Contingencia Operativa</span>
          </button>
        </div>

        {/* Contenido scrolleable de la Guía */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-sm leading-relaxed text-[var(--text2)] print:overflow-visible print:p-0">
          
          {/* GUÍA DE PRECEPTORES */}
          {activeTab === "preceptor" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-xl bg-[var(--bg3)]/60 border border-[var(--border)]">
                <h4 className="font-black text-base text-[var(--text)] flex items-center gap-2">
                  <Users size={18} className="text-[var(--verde)]" />
                  Circuito Diario de Preceptoría (Turno Mañana / Tarde / Vespertino)
                </h4>
                <p className="text-xs text-[var(--text3)] mt-1">
                  Responsabilidad operativa del preceptor a cargo de división.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <span className="w-5 h-5 rounded-full bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] text-xs flex items-center justify-center font-mono">1</span>
                    Parte Diario y Ausencias (07:15 - 07:45 hs)
                  </div>
                  <p className="text-xs">
                    Ingresar a <strong>Licencias</strong> y registrar novedades docentes del día. Si el docente informó inasistencia, cargar la solicitud. El sistema calcula inmediatamente si el curso queda con horas libres o cambio de turno y envía correos a los tutores.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <span className="w-5 h-5 rounded-full bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] text-xs flex items-center justify-center font-mono">2</span>
                    Acreditación con Lector QR (/scan)
                  </div>
                  <p className="text-xs">
                    Abrir el lector QR desde cualquier teléfono celular o tablet en la puerta del aula/establecimiento. Al escanear la credencial del estudiante, la asistencia diaria queda computada en tiempo real.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <span className="w-5 h-5 rounded-full bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] text-xs flex items-center justify-center font-mono">3</span>
                    Gestión de Cursos Asignados
                  </div>
                  <p className="text-xs">
                    El preceptor solo tiene acceso a editar y supervisar los cursos que le fueron asignados por el Equipo Directivo. Los datos personales de docentes (DNI, teléfono) están protegidos y no son editables por el preceptor.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <span className="w-5 h-5 rounded-full bg-[var(--verde-bg)] text-[var(--verde)] border border-[var(--verde-border)] text-xs flex items-center justify-center font-mono">4</span>
                    Emisión de Planillas Oficiales
                  </div>
                  <p className="text-xs">
                    En <strong>Alumnos</strong>, pulsar <em>Exportar Documento Oficial</em> para emitir la Planilla Mensual de Asistencia del curso (con cuadrícula 1 a 31 y casilleros de firma para Secretaría y Dirección).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* GUÍA DE PROFESORES */}
          {activeTab === "profesor" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-xl bg-[var(--bg3)]/60 border border-[var(--border)]">
                <h4 className="font-black text-base text-[var(--text)] flex items-center gap-2">
                  <GraduationCap size={18} className="text-[var(--verde)]" />
                  Portal del Docente · Solicitud de Licencias y Horarios
                </h4>
                <p className="text-xs text-[var(--text3)] mt-1">
                  Guía para registro de novedades y consulta académica.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <Clock size={16} className="text-[var(--verde)]" />
                    Grilla Horaria y Cursos a Cargo
                  </div>
                  <p className="text-xs">
                    Desde la pestaña <strong>Horarios</strong> el profesor consulta en todo momento sus módulos semanales, aulas y cursos a cargo actualizados según el ciclo lectivo vigente.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <FileText size={16} className="text-[var(--verde)]" />
                    Solicitud de Licencias Estatutarias
                  </div>
                  <p className="text-xs">
                    Al solicitar una licencia desde <strong>Licencias</strong>, el sistema cuenta con el nomenclador oficial de 166 artículos del estatuto docente de Chubut (Ley 2838 / Dto. 604), indicando si es con o sin goce de haberes y su plazo máximo reglamentario.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <CheckCircle2 size={16} className="text-[var(--verde)]" />
                    Carga de Asistencias por Materia
                  </div>
                  <p className="text-xs">
                    El docente puede registrar la presencia o ausencia de sus estudiantes por cada módulo de clase en <strong>Asistencia</strong>, manteniendo el historial pedagógico actualizado.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <ShieldCheck size={16} className="text-[var(--verde)]" />
                    Privacidad y Confidencialidad
                  </div>
                  <p className="text-xs">
                    Por normativa de seguridad, los docentes no pueden ver datos personales ni contactos de otros colegas ni de estudiantes de cursos ajenos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* GUÍA DE DIRECTIVOS */}
          {activeTab === "directivo" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-xl bg-[var(--bg3)]/60 border border-[var(--border)]">
                <h4 className="font-black text-base text-[var(--text)] flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[var(--verde)]" />
                  Mando Institucional · Equipo Directivo
                </h4>
                <p className="text-xs text-[var(--text3)] mt-1">
                  Supervisión general, designaciones de cobertura y auditoría.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <Users size={16} className="text-[var(--verde)]" />
                    Asignación de Preceptorías
                  </div>
                  <p className="text-xs">
                    En <strong>Preceptores</strong>, el directivo asigna qué cursos y divisiones corresponden a cada preceptor. Los cambios tienen impacto inmediato en los permisos de la plataforma.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Cobertura de Licencias de Preceptores
                  </div>
                  <p className="text-xs">
                    Al aprobar una licencia de un preceptor, el sistema alerta los cursos que quedaron descubiertos y abre una ventana para designar preceptores de cobertura, enviándoles una notificación instantánea y correo formal.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <Mail size={16} className="text-[var(--verde)]" />
                    Comunicados Institucionales
                  </div>
                  <p className="text-xs">
                    Emisión de avisos masivos filtrados por turno, curso o para toda la institución, con despacho certificado a través de Brevo / SMTP oficial.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <FileSpreadsheet size={16} className="text-[var(--verde)]" />
                    Monitor SATDE (Alerta Temprana)
                  </div>
                  <p className="text-xs">
                    Seguimiento preventivo de inasistencias acumuladas según el régimen de evaluación de Chubut (alerta a 10 faltas, riesgo a 15 y reincorporación a 20) con generación de cédulas de citación en 1 clic.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* GUÍA DE ALUMNOS Y FAMILIAS */}
          {activeTab === "alumno" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-xl bg-[var(--bg3)]/60 border border-[var(--border)]">
                <h4 className="font-black text-base text-[var(--text)] flex items-center gap-2">
                  <QrCode size={18} className="text-[var(--verde)]" />
                  Alumnos y Tutores · Consulta y Credencial
                </h4>
                <p className="text-xs text-[var(--text3)] mt-1">
                  Cómo utilizar la plataforma desde el celular o computadora.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <QrCode size={16} className="text-[var(--verde)]" />
                    Credencial QR Digital
                  </div>
                  <p className="text-xs">
                    Desde el panel o el menú de perfil, el estudiante genera su credencial QR personal. Puede guardarla en favoritos o captura de pantalla para presentar en el ingreso al establecimiento.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <Clock size={16} className="text-[var(--verde)]" />
                    Avisos de Horas Libres
                  </div>
                  <p className="text-xs">
                    Al registrarse la ausencia de un docente, la familia y el alumno reciben un correo informando qué horas quedan libres o si hay cambio en el horario de entrada o salida.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <CheckCircle2 size={16} className="text-[var(--verde)]" />
                    Mesas de Examen
                  </div>
                  <p className="text-xs">
                    Consulta de fechas de mesas previas y regulares, tribunales asignados y confirmación de inscripción individual.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                    <ShieldCheck size={16} className="text-[var(--verde)]" />
                    Protección de Datos Personales
                  </div>
                  <p className="text-xs">
                    La plataforma garantiza la confidencialidad absoluta de los menores. Ningún alumno puede ver nombres, correos ni datos de contacto de otros compañeros de la escuela.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* GUÍA DE CONTINGENCIA */}
          {activeTab === "contingencia" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
                <h4 className="font-black text-base flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Protocolo Oficial ante Caídas de Conectividad o Energía Eléctrica
                </h4>
                <p className="text-xs text-[var(--text2)] mt-1">
                  Acciones estandarizadas para asegurar la continuidad pedagógica e institucional.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="font-bold text-[var(--text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 text-xs flex items-center justify-center font-mono">A</span>
                    Interrupción de Internet en la Escuela
                  </div>
                  <p className="text-xs">
                    1) La plataforma cuenta con almacenamiento local (caché de 5 minutos): los horarios y listas cargadas se pueden seguir consultando en modo lectura.<br />
                    2) Si un preceptor requiere cargar el parte diario de 7:30 AM sin Wi-Fi escolar, puede acceder desde su teléfono móvil utilizando datos móviles personales.<br />
                    3) En caso de corte total de señal, el preceptor registrará las inasistencias en el <em>Cuaderno Testigo de Preceptoría</em> y se sincronizará en la plataforma al normalizarse el servicio.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="font-bold text-[var(--text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 text-xs flex items-center justify-center font-mono">B</span>
                    Corte de Suministro Eléctrico
                  </div>
                  <p className="text-xs">
                    La aplicación está completamente optimizada para móviles (PWA). No depende de servidores locales en la escuela, ya que opera en la nube de alta disponibilidad (Appwrite Cloud / Vercel Edge). Cualquier directivo o preceptor puede supervisar el estado desde su celular.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
                  <div className="font-bold text-[var(--text)] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 text-xs flex items-center justify-center font-mono">C</span>
                    Canal Técnico y Mesa de Ayuda
                  </div>
                  <p className="text-xs">
                    Para reporte de incidentes técnicos o reseteo administrativo de contraseñas:<br />
                    • Correo Oficial de Soporte: <a href="https://mail.google.com/mail/?view=cm&fs=1&to=skbcraft.info@gmail.com" target="_blank" rel="noopener noreferrer" className="text-[var(--verde)] font-bold hover:underline" title="Abrir en Gmail">skbcraft.info@gmail.com</a><br />
                    • Administración de la Escuela N° 713 «Juan Abdala Chayep»
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Pie del Modal */}
        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg3)]/30 flex items-center justify-between text-xs text-[var(--text3)] shrink-0 print:hidden">
          <span>Escuela N° 713 · Esquel, Chubut</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--bg3)] hover:bg-[var(--border)] text-[var(--text)] font-bold transition-colors cursor-pointer text-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
