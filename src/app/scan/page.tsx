"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { account } from "@/lib/appwrite";
import { 
  getUserProfile, 
  getAlumnos, 
  getMesasExamen,
  saveMesaExamen,
  MesaExamen,
  saveAsistenciasJornada, 
  saveAsistenciasMateria, 
  logAction 
} from "@/lib/dataService";
import { CheckCircle2, XCircle, Loader2, QrCode, BookOpen, Calendar, Clock, MapPin } from "lucide-react";
import EscuelaInfoLogo from "@/components/shared/EscuelaInfoLogo";

function ScanContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const mesaId = searchParams.get("mesaId");
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [scanType, setScanType] = useState<"asistencia" | "mesa">("asistencia");
  const [mesaDetails, setMesaDetails] = useState<{ materia: string; fecha: string; hora: string; aula: string } | null>(null);

  useEffect(() => {
    const processQR = async () => {
      try {
        // ─── CASO 1: CÓDIGO QR DE MESA DE EXAMEN ───────────────────────────
        if (mesaId) {
          setScanType("mesa");

          // Autenticar sesión del usuario
          let session;
          try {
            session = await account.get();
          } catch {
            router.push("/?redirect=" + encodeURIComponent(`/scan?mesaId=${mesaId}`));
            return;
          }

          const userProfile = await getUserProfile(session.$id);
          if (!userProfile || userProfile.rol !== "alumno") {
            throw new Error("Solo los alumnos pueden inscribirse a mesas de examen mediante código QR.");
          }

          const allAlumnos = await getAlumnos();
          const studentRecord = allAlumnos.find(
            a => (a.email || "").toLowerCase() === (userProfile.email || "").toLowerCase() ||
                 (userProfile.nombre && (a.nombre || "").toLowerCase() === userProfile.nombre.toLowerCase())
          );

          const mesas = await getMesasExamen(true);
          const mesa = mesas.find(m => m.id === mesaId);
          if (!mesa) {
            throw new Error("No se encontró la mesa de examen correspondiente.");
          }

          setMesaDetails({
            materia: mesa.materia,
            fecha: mesa.fecha,
            hora: mesa.hora,
            aula: mesa.aula,
          });

          const studentName = studentRecord?.nombre || userProfile.nombre;
          const studentDni = studentRecord?.dni || "";
          const studentCurso = studentRecord?.curso || "";
          const label = studentDni
            ? `${studentName} (DNI: ${studentDni}${studentCurso ? ` · ${studentCurso}` : ""})`
            : studentName;

          const currentList = mesa.alumnosInscriptos || [];
          const alreadyIn = currentList.some(a => 
            (studentDni && a.includes(studentDni)) || 
            a.toLowerCase().includes(studentName.toLowerCase())
          );

          if (!alreadyIn) {
            const updatedMesa: MesaExamen = {
              ...mesa,
              alumnosInscriptos: [...currentList, label],
            };
            await saveMesaExamen(updatedMesa);
            await logAction(
              userProfile.email, 
              "INSCRIBIR_MESA_EXAMEN", 
              `Mesa: ${mesa.materia} (${mesa.fecha}) - QR Escaneado desde navegador`
            );
          }

          setStatus("success");
          return;
        }

        // ─── CASO 2: CÓDIGO QR DE ASISTENCIA DINÁMICA ─────────────────────────
        if (!token) throw new Error("No se encontró ningún parámetro válido en la URL.");
        setScanType("asistencia");

        // Decode token
        let payload;
        try {
          payload = JSON.parse(atob(token));
        } catch {
          throw new Error("El código QR es inválido o está corrupto.");
        }

        const { t, m, s, p } = payload;
        
        // Verify expiration (25 seconds tolerance to prevent sharing photos of the QR via WhatsApp)
        if (Date.now() - t > 25000) {
          setStatus("expired");
          return;
        }

        // Authenticate user
        let session;
        try {
          session = await account.get();
        } catch {
          router.push("/?redirect=" + encodeURIComponent(`/scan?token=${token}`));
          return;
        }

        const userProfile = await getUserProfile(session.$id);
        if (!userProfile || userProfile.rol !== "alumno") {
          throw new Error("Solo los alumnos pueden registrar asistencia mediante QR.");
        }

        const allAlumnos = await getAlumnos();
        const studentRecord = (allAlumnos || []).find(
          a => (a?.email || "").toLowerCase() === (userProfile.email || "").toLowerCase()
        );

        if (!studentRecord || !studentRecord.id) {
          throw new Error("No se encontró tu legajo de alumno en el sistema.");
        }

        const todayDate = new Date().toISOString().split("T")[0];

        // Guardar asistencia
        if (m === "jornada") {
          await saveAsistenciasJornada([{
            alumnoId: studentRecord.id,
            alumnoNombre: studentRecord.nombre,
            fecha: todayDate,
            estado: "P",
            preceptorId: p || "QR_SISTEMA"
          }]);
          await logAction(userProfile.email, "C_AJ", `Asistencia por QR (Jornada)`);
        } else if (m === "materia") {
          await saveAsistenciasMateria([{
            alumnoId: studentRecord.id,
            alumnoNombre: studentRecord.nombre,
            fecha: todayDate,
            materia: s,
            curso: studentRecord.curso,
            estado: "P",
            profesorId: p || "QR_SISTEMA"
          }]);
          await logAction(userProfile.email, "C_AM", `Asistencia por QR (Materia: ${s})`);
        } else {
          throw new Error("Formato de asistencia desconocido.");
        }

        setStatus("success");
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Ocurrió un error inesperado al procesar el código.");
        setStatus("error");
      }
    };

    processQR();
  }, [token, mesaId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[var(--bg)] text-[var(--text)]">
      <div className="w-full max-w-md p-8 glass rounded-[32px] border border-[var(--border)] shadow-2xl flex flex-col items-center text-center animate-zoom-in">
        <div className="mb-8">
          <EscuelaInfoLogo size={48} />
          <h1 className="text-2xl font-black title-font mt-4">Escuela<span className="text-[var(--verde)]">Info</span></h1>
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 size={48} className="animate-spin text-[var(--verde)]" />
            <p className="font-bold text-[var(--text2)]">
              {scanType === "mesa" ? "Autocompletando planilla de examen..." : "Validando tu asistencia..."}
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center space-y-4 animate-fade-in w-full">
            <div className="w-20 h-20 bg-[var(--verde-bg)] rounded-full flex items-center justify-center border-4 border-[var(--verde-border)] shadow-[0_0_40px_rgba(var(--verde-rgb),0.3)]">
              <CheckCircle2 size={40} className="text-[var(--verde)]" />
            </div>

            {scanType === "mesa" ? (
              <>
                <h2 className="text-2xl font-black text-[var(--text)]">¡Inscripción Confirmada!</h2>
                <p className="text-[var(--text2)] font-medium text-xs px-2">
                  Tus datos personales fueron cargados automáticamente en la planilla oficial de la mesa de examen.
                </p>

                {mesaDetails && (
                  <div className="w-full mt-2 p-4 rounded-2xl bg-[var(--bg3)] border border-[var(--border)] text-left text-xs space-y-2">
                    <p className="font-black text-sm text-[var(--text)]">{mesaDetails.materia}</p>
                    <div className="flex items-center justify-between text-[var(--text2)] font-semibold">
                      <span>Fecha: {mesaDetails.fecha} ({mesaDetails.hora} hs)</span>
                      <span className="text-[var(--verde)] font-bold">{mesaDetails.aula}</span>
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => router.push("/dashboard")}
                  className="mt-6 w-full py-4 rounded-2xl bg-[var(--verde)] text-black font-black text-sm hover:scale-105 transition-transform active:scale-95 cursor-pointer shadow-lg"
                >
                  Ir a mi Panel de Exámenes
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-black text-[var(--text)]">¡Presente!</h2>
                <p className="text-[var(--text2)] font-medium px-4">Tu asistencia ha sido registrada correctamente en el sistema.</p>
                <button 
                  onClick={() => router.push("/dashboard")}
                  className="mt-6 w-full py-4 rounded-2xl bg-[var(--verde)] text-black font-black text-sm hover:scale-105 transition-transform active:scale-95 cursor-pointer shadow-lg"
                >
                  Ir a mi Panel
                </button>
              </>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center space-y-4 animate-fade-in">
            <div className="w-20 h-20 bg-[var(--rojo-bg)] rounded-full flex items-center justify-center border-4 border-[var(--rojo-border)]">
              <XCircle size={40} className="text-[var(--rojo)]" />
            </div>
            <h2 className="text-xl font-black text-[var(--text)]">Error al procesar</h2>
            <p className="text-[var(--text2)] font-medium px-4">{errorMsg}</p>
            <button 
              onClick={() => router.push("/dashboard")}
              className="mt-6 w-full py-4 rounded-2xl bg-[var(--bg3)] text-[var(--text)] border border-[var(--border)] font-black text-sm hover:scale-105 transition-transform active:scale-95 cursor-pointer"
            >
              Volver al inicio
            </button>
          </div>
        )}

        {status === "expired" && (
          <div className="flex flex-col items-center space-y-4 animate-fade-in">
            <div className="w-20 h-20 bg-[var(--amarillo-bg)] rounded-full flex items-center justify-center border-4 border-[var(--amarillo-border)]">
              <QrCode size={40} className="text-[var(--amarillo)]" />
            </div>
            <h2 className="text-xl font-black text-[var(--text)]">Código Expirado</h2>
            <p className="text-[var(--text2)] font-medium px-4">Este código QR ya no es válido por seguridad. Pedíle al docente que genere uno nuevo e intentalo de vuelta.</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-4 rounded-2xl bg-[var(--amarillo)] text-black font-black text-sm hover:scale-105 transition-transform active:scale-95 shadow-lg cursor-pointer"
            >
              Reintentar
            </button>
            <button 
              onClick={() => router.push("/dashboard")}
              className="mt-2 w-full py-4 rounded-2xl bg-[var(--bg3)] text-[var(--text)] border border-[var(--border)] font-black text-sm hover:scale-105 transition-transform active:scale-95 cursor-pointer"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
        <Loader2 size={48} className="animate-spin text-[var(--verde)]" />
      </div>
    }>
      <ScanContent />
    </Suspense>
  );
}
