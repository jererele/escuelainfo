'use client';

import React from 'react';
import Link from 'next/link';
import EscuelaInfoLogo from '@/components/EscuelaInfoLogo';

export default function PrivacidadPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 animate-fade-in">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg3)] border border-[var(--border)] flex items-center justify-center shadow-sm mb-4">
          <EscuelaInfoLogo size={40} />
        </div>
        <h1 className="title-font text-3xl md:text-4xl font-black text-[var(--text)]">Política de Privacidad</h1>
        <p className="text-xs text-[var(--text3)] uppercase tracking-wider font-bold mt-2">
          Vigente: Junio 2026 · SKBCraft © 2024–2026
        </p>
      </div>

      <div className="bg-[var(--bg3)]/50 backdrop-blur-md rounded-[32px] border border-[var(--border)] p-6 md:p-10 space-y-8 text-[var(--text2)] text-sm leading-relaxed shadow-sm">
        <section className="space-y-3">
          <h2 className="text-lg font-black text-[var(--text)] border-b border-[var(--border)] pb-2">
            1. Datos Recopilados
          </h2>
          <p>
            Procesamos información sensible relacionada con la gestión escolar: nombre completo, correo electrónico, rol institucional (Directivo, Preceptor, Profesor, Alumno), asistencia diaria, registros de ausencias, e imágenes/PDFs de justificativos médicos presentados.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[var(--text)] border-b border-[var(--border)] pb-2">
            2. Finalidad del Tratamiento
          </h2>
          <p>
            Los datos son utilizados exclusivamente para la administración interna de la escuela, el control de ausencias de profesores y alumnos, el seguimiento pedagógico y la emisión de reportes institucionales.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[var(--text)] border-b border-[var(--border)] pb-2">
            3. Almacenamiento y Cifrado
          </h2>
          <p>
            La información se almacena en servidores seguros utilizando la infraestructura de <strong>Appwrite</strong>. Los datos están cifrados tanto en tránsito (HTTPS/TLS) como en reposo, garantizando los más altos estándares de seguridad y protección.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[var(--text)] border-b border-[var(--border)] pb-2">
            4. Declaración de No Cesión a Terceros
          </h2>
          <p>
            Los datos personales y académicos de los usuarios <strong>NO</strong> son compartidos, vendidos, transferidos ni cedidos a ninguna empresa, entidad o tercero bajo ningún concepto, salvo requerimiento judicial expreso de autoridad competente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[var(--text)] border-b border-[var(--border)] pb-2">
            5. Derechos de Acceso, Rectificación y Supresión
          </h2>
          <p>
            Los usuarios pueden solicitar el acceso, rectificación o eliminación de sus datos personales comunicándose de forma directa con la administración de la institución escolar o enviando una solicitud formal por correo electrónico a: <strong>skbcraft.info@gmail.com</strong>.
          </p>
        </section>
      </div>

      <div className="text-center mt-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-[var(--verde)] text-black font-black text-xs px-6 py-3 rounded-xl hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
