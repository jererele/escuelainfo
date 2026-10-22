'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { logAction } from '@/lib/dataService';
import EscuelaInfoLogo from '@/components/shared/EscuelaInfoLogo';
import { Check, X, BookOpen, FileText } from 'lucide-react';

export interface TermsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onAccept?: () => void;
}

export function openTermsModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('escuelainfo:open-terms'));
  }
}

// ─── Constantes de versión del acuerdo ───────────────────────────────────────
// IMPORTANTE: Incrementar AGREEMENT_VERSION cada vez que se modifiquen los TyC.
// Esto invalida automáticamente aceptaciones previas de versiones anteriores.
const AGREEMENT_VERSION = 'v2.0-2026-06';
const STORAGE_KEY = `skbcraft_terms_accepted_${AGREEMENT_VERSION}`;

// ─── Texto legal blindado — Versión 2.0 ──────────────────────────────────────
const TERMS_CONTENT = `════════════════════════════════════════════════════════════
TÉRMINOS Y CONDICIONES DE USO — EscuelaInfo
VERSIÓN 2.0 | SKBCraft © 2024–2026 | Vigente: Junio 2026
════════════════════════════════════════════════════════════

AVISO LEGAL OBLIGATORIO

El acceso, registro o uso continuado de la Plataforma EscuelaInfo
implica la aceptación plena, expresa, consciente e irrevocable de
la totalidad de los presentes Términos. Este documento constituye
un CONTRATO LEGALMENTE EXIGIBLE. Si usted no acepta la totalidad
de estas condiciones, debe cesar el uso de la Plataforma de forma
inmediata.

────────────────────────────────────────────────────────────
ARTÍCULO 1 — IDENTIFICACIÓN DEL TITULAR
────────────────────────────────────────────────────────────

La plataforma de gestión escolar EscuelaInfo es un producto de
software desarrollado, mantenido y comercializado por SKBCraft,
empresa de desarrollo tecnológico fundada en el año 2024. SKBCraft
actúa exclusivamente como proveedor de la herramienta tecnológica
("infrastructure provider") y NO es parte de la relación institu-
cional, pedagógica o administrativa entre las escuelas y sus
miembros, personal docente o alumnado.

────────────────────────────────────────────────────────────
ARTÍCULO 2 — ROLES Y RESPONSABILIDADES
────────────────────────────────────────────────────────────

2.1 DIRECTIVOS / ADMINISTRADORES INSTITUCIONALES
Los representantes autorizados de cada institución educativa son
responsables de: (a) administrar y supervisar las cuentas bajo su
ámbito, (b) garantizar la veracidad de la información cargada,
(c) gestionar altas y bajas de usuarios, (d) actuar como punto
de contacto primario con SKBCraft.

2.2 PROFESORES / DOCENTES
Usuarios habilitados para registrar información pedagógica y
administrativa. Son responsables de: (a) la exactitud de los
registros de asistencia y ausencias bajo su cargo, (b) la
custodia exclusiva de sus credenciales de acceso, (c) reportar
anomalías de forma inmediata a los Directivos.

2.3 ALUMNOS / ESTUDIANTES
Usuarios con acceso de consulta a su información personal
académica. Deben: (a) utilizar la Plataforma solo para fines
previstos, (b) no intentar acceder a información ajena,
(c) mantener la confidencialidad de sus credenciales.

────────────────────────────────────────────────────────────
ARTÍCULO 3 — EXENCIÓN TOTAL POR ERROR HUMANO (AS IS)
────────────────────────────────────────────────────────────

3.1 LA PLATAFORMA SE PROVEE "TAL COMO ESTÁ" ("AS IS" / "AS
AVAILABLE"). SKBCRAFT NO OTORGA GARANTÍAS DE NINGÚN TIPO,
EXPRESAS NI IMPLÍCITAS, INCLUYENDO, SIN LIMITACIÓN, GARANTÍAS
DE COMERCIABILIDAD, ADECUACIÓN A UN FIN PARTICULAR O AUSENCIA
DE ERRORES.

3.2 SKBCraft provee únicamente la infraestructura técnica de
gestión. En consecuencia, SKBCraft NO asume responsabilidad
alguna, directa ni indirecta, bajo ninguna circunstancia, por:

  (a) PÉRDIDA DE DATOS: Toda pérdida, corrupción, omisión o
  alteración de datos causada por acción u omisión del usuario.

  (b) ERRORES DE CARGA: Ausencias registradas de forma inco-
  rrecta, duplicada, omitida o fraudulenta por parte del perso-
  nal autorizado (Directivos, Docentes o cualquier usuario habi-
  litado). La veracidad, exactitud e integridad de los datos
  ingresados es responsabilidad exclusiva e indelegable de quien
  los carga en la Plataforma.

  (c) FECHAS ERRÓNEAS: La programación incorrecta de mesas de
  examen, evaluaciones, períodos académicos u otros eventos
  calendarizados es responsabilidad exclusiva del personal insti-
  tucional. SKBCraft no valida ni certifica la exactitud temporal
  de ningún dato ingresado por los usuarios.

  (d) DECISIONES INSTITUCIONALES: Cualquier decisión pedagó-
  gica, administrativa, disciplinaria o legal tomada por autori-
  dades escolares basándose en información gestionada a través de
  la Plataforma.

  (e) DOCUMENTOS FALSOS: Consecuencias derivadas de la carga de
  certificados médicos, constancias o documentación falsa, altera-
  da o fraudulenta. La autenticidad de los documentos subidos es
  responsabilidad exclusiva de quien los carga.

  (f) FUERZA MAYOR: Interrupciones del servicio por causas
  ajenas al control de SKBCraft (fallos de red, cortes eléctri-
  cos, desastres naturales, ataques de terceros, etc.).

3.3 EN NINGÚN CASO LA RESPONSABILIDAD TOTAL DE SKBCRAFT
SUPERARÁ EL IMPORTE EFECTIVAMENTE ABONADO POR EL SERVICIO EN
EL PERÍODO FACTURADO INMEDIATAMENTE ANTERIOR AL HECHO
GENERADOR DEL DAÑO RECLAMADO.

────────────────────────────────────────────────────────────
ARTÍCULO 4 — LOGS DE AUDITORÍA COMO PRUEBA LEGAL IRREFUTABLE
────────────────────────────────────────────────────────────

4.1 La Plataforma genera y conserva de forma automática e inmu-
table registros de auditoría internos ("Audit Logs") en la
infraestructura de Appwrite, vinculados al ID único de cada
sesión y cuenta de usuario.

4.2 EL USUARIO ACEPTA EXPRESA E IRREVOCABLEMENTE QUE:

  (a) Los registros de auditoría generados por la Plataforma
  constituyen PRUEBA PLENA, DEFINITIVA E INAPELABLE de las
  acciones realizadas en el sistema.

  (b) Ante cualquier discrepancia, reclamo o litigio, los Audit
  Logs tendrán valor probatorio superior a cualquier declaración
  verbal o escrita del usuario.

  (c) Si el sistema registra que un usuario realizó una acción
  bajo sus credenciales (inicio de sesión, carga de ausencia,
  subida de documento, modificación de datos, etc.), el USUARIO
  ACEPTA SIN RESERVAS que dicha acción fue realizada por él o
  bajo su responsabilidad directa, liberando a SKBCraft de toda
  responsabilidad por el contenido de dicha acción.

  (d) El usuario es el único responsable de la custodia de sus
  credenciales de acceso. El uso no autorizado de credenciales
  por parte de terceros no exime al titular de la cuenta de las
  responsabilidades derivadas de las acciones realizadas.

4.3 Los registros de auditoría incluyen, sin limitación:
timestamp exacto (UTC), ID de usuario, dirección IP registrada
por Appwrite, tipo de acción realizada y datos modificados.

────────────────────────────────────────────────────────────
ARTÍCULO 5 — CLÁUSULA DE INDEMNIDAD
────────────────────────────────────────────────────────────

5.1 El usuario y/o la institución educativa (en adelante, "el
Indemnizante") se obligan a mantener indemne, defender y exo-
nerar a SKBCraft, sus fundadores, empleados, colaboradores,
proveedores y cesionarios de y contra:

  (a) Toda demanda, acción judicial, arbitral o administrativa
  iniciada por terceros como consecuencia del uso incorrecto,
  negligente o fraudulento de la Plataforma.

  (b) Todo costo, honorario profesional (incluyendo honorarios
  de abogados), multa, sanción civil o administrativa derivada
  del incumplimiento de los presentes Términos.

  (c) Cualquier perjuicio económico o reputacional causado por
  la carga de datos falsos, incluyendo la falsificación o adulte-
  ración de certificados médicos, justificativos de ausencia u
  otros documentos probatorios.

  (d) Reclamaciones de terceros relacionadas con violaciones a
  la privacidad causadas por divulgación indebida de credenciales
  o accesos compartidos por parte del usuario.

5.2 Esta obligación de indemnidad subsiste aún después de la
terminación o rescisión del contrato de uso de la Plataforma.

────────────────────────────────────────────────────────────
ARTÍCULO 6 — MODIFICACIONES UNILATERALES Y ACEPTACIÓN TÁCITA
────────────────────────────────────────────────────────────

6.1 SKBCraft se reserva el derecho soberano e irrestricto de
modificar, ampliar, reducir o reemplazar la totalidad o parte
de los presentes Términos en cualquier momento, a su exclusivo
criterio y sin necesidad de causa o justificación previa.

6.2 Los cambios serán notificados mediante: (a) la publicación
de la nueva versión en la Plataforma con una nueva marca de
versión, y/o (b) notificación por correo electrónico al email
de contacto registrado.

6.3 LA CONTINUIDAD EN EL USO DE LA PLATAFORMA TRAS LA PUBLICA-
CIÓN O NOTIFICACIÓN DE CAMBIOS CONSTITUIRÁ ACEPTACIÓN AUTO-
MÁTICA, PLENA Y VINCULANTE DE LOS NUEVOS TÉRMINOS, CON IGUAL
FUERZA LEGAL QUE UNA FIRMA MANUSCRITA.

6.4 Si el usuario no acepta los cambios, su único recurso es
cesar el uso de la Plataforma y solicitar la eliminación de su
cuenta mediante comunicación a: skbcraft.info@gmail.com

────────────────────────────────────────────────────────────
ARTÍCULO 7 — USO CORRECTO Y CONDUCTAS PROHIBIDAS
────────────────────────────────────────────────────────────

Queda expresamente PROHIBIDO, bajo pena de suspensión inmediata
y acciones legales civiles y penales:

  (a) Descompilar, desensamblar, realizar ingeniería inversa o
  copiar el código fuente, algoritmos o lógica de negocio.

  (b) Intentar acceder a áreas restringidas mediante hacking,
  fuerza bruta, inyección de código (SQL, XSS, CSRF) u otros
  métodos técnicos o sociales.

  (c) Cargar archivos maliciosos (virus, malware, ransomware)
  especialmente en la funcionalidad de certificados médicos/PDFs.

  (d) Suplantar la identidad de otros usuarios o personal
  institucional.

  (e) Utilizar la Plataforma con fines comerciales no autoriza-
  dos o compartir el acceso con terceros no registrados.

────────────────────────────────────────────────────────────
ARTÍCULO 8 — POLÍTICA DE PRIVACIDAD (RESUMEN VINCULANTE)
────────────────────────────────────────────────────────────

8.1 DATOS TRATADOS: nombre completo, correo electrónico, rol
institucional, registros de asistencia/ausencias, y documentos
sensibles (certificados médicos en PDF/imagen).

8.2 ALMACENAMIENTO: Infraestructura Appwrite con cifrado en
tránsito (HTTPS/TLS) y en reposo. Acceso segmentado por institu-
ción mediante control de roles estricto.

8.3 DECLARACIÓN IRREVOCABLE DE NO CESIÓN: Los datos personales
y académicos NO son compartidos, cedidos, vendidos ni transferi-
dos a terceros bajo ningún concepto, salvo requerimiento legal
expreso de autoridad competente.

8.4 DERECHOS DEL USUARIO: Acceso, rectificación, supresión,
oposición y portabilidad. Solicitudes a: skbcraft.info@gmail.com
Plazo de respuesta: 30 días hábiles.

────────────────────────────────────────────────────────────
ARTÍCULO 9 — PROPIEDAD INTELECTUAL
────────────────────────────────────────────────────────────

© 2024 – 2026 SKBCraft. Todos los derechos reservados.

El diseño gráfico, código fuente (Next.js), arquitectura del
sistema, lógica de negocio (selector de escuelas, optimización
de base de datos), marcas comerciales y logotipos son propiedad
exclusiva e intransferible de SKBCraft. Su reproducción, copia
o distribución sin autorización previa y por escrito constituye
una infracción perseguible judicialmente.

────────────────────────────────────────────────────────────
ARTÍCULO 10 — DISPOSICIONES FINALES
────────────────────────────────────────────────────────────

10.1 SEPARABILIDAD: Si alguna cláusula de los presentes Términos
fuera declarada nula o inaplicable, las cláusulas restantes
conservarán plena vigencia y eficacia.

10.2 RENUNCIA: La omisión de SKBCraft en exigir el cumplimiento
de cualquier cláusula no constituirá renuncia a ejercer ese
derecho en el futuro.

10.3 LEY APLICABLE: Los presentes Términos se rigen por las
leyes de la República Argentina. Toda controversia será sometida
a los tribunales competentes de la jurisdicción correspondiente,
con renuncia expresa a cualquier otro fuero.

10.4 CONTACTO LEGAL: skbcraft.info@gmail.com
Respuesta en un plazo máximo de 5 días hábiles.

════════════════════════════════════════════════════════════
SKBCraft — Tecnología con propósito educativo.
Al hacer clic en "Aceptar y Continuar", usted declara haber
leído, comprendido y aceptado la totalidad de estos Términos.
════════════════════════════════════════════════════════════`;

// ─── Componente principal ─────────────────────────────────────────────────────
export default function TermsModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onAccept: propOnAccept,
}: TermsModalProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [canAccept, setCanAccept] = useState(true);
  const [saving, setSaving] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isBackdropClickRef = useRef(false);

  const isControlled = propIsOpen !== undefined;
  const showModal = isControlled ? Boolean(propIsOpen) : internalOpen;

  // Escuchar evento para abrir bajo demanda desde cualquier punto de la aplicación
  useEffect(() => {
    const handleOpen = () => {
      setInternalOpen(true);
    };
    window.addEventListener('escuelainfo:open-terms', handleOpen);
    return () => {
      window.removeEventListener('escuelainfo:open-terms', handleOpen);
    };
  }, []);

  // Controlar animación de visibilidad y bloqueo de scroll solo mientras está abierto
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    } else {
      setVisible(false);
      document.body.style.overflow = '';
    }
  }, [showModal]);

  const handleClose = useCallback(() => {
    document.body.style.overflow = '';
    setVisible(false);
    setTimeout(() => {
      if (isControlled) {
        propOnClose?.();
      } else {
        setInternalOpen(false);
      }
    }, 220);
  }, [isControlled, propOnClose]);

  // Cerrar con Escape
  useEffect(() => {
    if (!showModal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showModal, handleClose]);

  // Medir progreso de lectura
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      setReadProgress(100);
      setCanAccept(true);
      return;
    }
    const currentProgress = Math.min(100, Math.round((el.scrollTop / maxScroll) * 100));
    setReadProgress(currentProgress);

    if (!canAccept && (el.scrollTop + el.clientHeight >= el.scrollHeight - 15 || currentProgress >= 95)) {
      setCanAccept(true);
      setReadProgress(100);
    }
  }, [canAccept]);

  // Desplazar al final
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  // Aceptar acuerdos
  const handleAccept = useCallback(async () => {
    if (saving) return;
    setSaving(true);

    const ts = new Date().toISOString();

    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* noop */ }

    try {
      await logAction(
        'anonimo@pre-login',
        'TERMS_ACCEPTED',
        `version=${AGREEMENT_VERSION} | timestamp=${ts} | key=${STORAGE_KEY}`
      );
    } catch {
      // noop
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('escuelainfo:terms-accepted'));
    }

    if (isControlled) {
      propOnAccept?.();
    }

    document.body.style.overflow = '';
    setVisible(false);
    setTimeout(() => {
      if (isControlled) {
        propOnClose?.();
      } else {
        setInternalOpen(false);
      }
      setSaving(false);
    }, 220);
  }, [saving, isControlled, propOnAccept, propOnClose]);

  if (!showModal) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
      onMouseDown={(e) => {
        isBackdropClickRef.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (isBackdropClickRef.current && e.target === e.currentTarget) {
          handleClose();
        }
        isBackdropClickRef.current = false;
      }}
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-6"
      style={{
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 220ms ease-out',
        willChange: 'opacity',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* ── Caja del modal ─────────────────────────────────────────────────── */}
      <div
        className="relative w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxHeight: '92dvh',
          background: '#0a0e1a',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 100px -20px rgba(0,0,0,0.8), 0 0 60px -10px rgba(16,185,129,0.06)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translate3d(0,0,0)' : 'scale(0.97) translate3d(0,0,0)',
          transition: 'opacity 220ms ease-out, transform 220ms cubic-bezier(0.16,1,0.3,1)',
          willChange: 'transform, opacity',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 flex items-center justify-between gap-4 px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#050810' }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Logo vectorial de EscuelaInfo */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0d2a40, #1a4a35)' }}
              aria-hidden="true"
            >
              <EscuelaInfoLogo size={26} />
            </div>

            <div className="min-w-0">
              <h2
                id="terms-modal-title"
                className="text-sm font-semibold leading-tight tracking-tight text-white"
                style={{ fontFamily: 'var(--font-title)' }}
              >
                Acuerdos y Términos de Convivencia
              </h2>
              <p className="text-[11px] mt-0.5 text-slate-400">
                EscuelaInfo · Versión {AGREEMENT_VERSION} · Normas institucionales
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal de acuerdos"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Aviso informativo de acuerdos ─────────────────────────────────── */}
        <div
          className="flex-shrink-0 flex items-start gap-3 mx-4 mt-3 px-3.5 py-2.5 rounded-xl text-xs"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
        >
          <BookOpen className="flex-shrink-0 w-4 h-4 mt-0.5" />
          <span className="text-slate-300">
            <strong className="text-emerald-400 font-semibold">Acuerdos Institucionales:</strong> Podés revisar los términos y condiciones de uso, derechos, deberes y normas de convivencia de la plataforma escolar.
          </span>
        </div>

        {/* ── Área de texto con scroll ────────────────────────────────────── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto mx-4 my-3"
          style={{
            background: '#080c18',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '16px',
            color: '#94a3b8',
            fontSize: '11px',
            lineHeight: '1.75',
            fontFamily: 'var(--mono)',
            whiteSpace: 'pre-wrap',
            scrollbarWidth: 'thin',
            scrollbarColor: '#1e2d3d transparent',
            minHeight: '0',
          }}
          aria-label="Contenido del acuerdo legal"
        >
          {TERMS_CONTENT}
        </div>

        {/* ── Barra de progreso visual ────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 pb-1">
          <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
            <span style={{ color: canAccept ? '#10B981' : '#64748b' }}>
              {canAccept ? "100% Leído" : `Progreso de lectura: ${readProgress}%`}
            </span>
            <button
              type="button"
              onClick={scrollToBottom}
              className="text-[10px] text-[var(--verde)] hover:underline active:scale-95 transition-transform cursor-pointer font-sans"
            >
              Desplazar al final ↓
            </button>
          </div>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            aria-hidden="true"
          >
            <div
              style={{
                height: '100%',
                width: `${canAccept ? 100 : readProgress}%`,
                background: 'linear-gradient(90deg, #10B981, #3B82F6)',
                transition: 'width 200ms ease-out',
                willChange: 'width',
              }}
            />
          </div>
        </div>

        {/* ── Footer del modal ────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 py-3.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: '#050810' }}
        >
          {/* Botón de cerrar secundario */}
          <button
            type="button"
            onClick={handleClose}
            className="order-2 sm:order-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors cursor-pointer"
          >
            Cerrar lectura
          </button>

          {/* Botón de aceptar y guardar */}
          <button
            id="terms-accept-btn"
            onClick={handleAccept}
            disabled={saving}
            className="order-1 sm:order-2 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all active:scale-[0.99]"
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: '#fff',
              boxShadow: '0 4px 15px -3px rgba(16,185,129,0.4)',
            }}
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Registrando…
              </>
            ) : (
              <>
                <Check size={16} strokeWidth={2.5} />
                Aceptar Acuerdos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
