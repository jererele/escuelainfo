'use client';

import React from 'react';
import Link from 'next/link';
import EscuelaInfoLogo from '@/components/EscuelaInfoLogo';

export default function TerminosPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 animate-fade-in">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg3)] border border-[var(--border)] flex items-center justify-center shadow-sm mb-4">
          <EscuelaInfoLogo size={40} />
        </div>
        <h1 className="title-font text-3xl md:text-4xl font-black text-[var(--text)]">Términos y Condiciones de Uso</h1>
        <p className="text-xs text-[var(--text3)] uppercase tracking-wider font-bold mt-2">
          Vigente: Junio 2026 · SKBCraft © 2024–2026
        </p>
      </div>

      <div className="bg-[var(--bg3)]/50 backdrop-blur-md rounded-[32px] border border-[var(--border)] p-6 md:p-10 space-y-8 text-[var(--text2)] text-sm leading-relaxed shadow-sm">
        <section className="space-y-3">
          <h2 className="text-lg font-black text-[var(--text)] border-b border-[var(--border)] pb-2">
            1. Identificación del Titular
          </h2>
          <p>
            La plataforma de gestión escolar <strong>EscuelaInfo</strong> es un producto de software desarrollado, mantenido y comercializado por <strong>SKBCraft</strong>. SKBCraft actúa exclusivamente como proveedor de la herramienta tecnológica y no forma parte de la relación institucional, pedagógica o administrativa entre las escuelas y sus miembros.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[var(--text)] border-b border-[var(--border)] pb-2">
            2. Roles y Responsabilidades
          </h2>
          <p>
            <strong>Directivos / Administradores:</strong> Son responsables de administrar y supervisar las cuentas, garantizar la veracidad de la información y gestionar altas y bajas de usuarios.
          </p>
          <p>
            <strong>Profesores / Docentes:</strong> Son responsables de la exactitud de los registros de asistencia y ausencias bajo su cargo, así como de la custodia exclusiva de sus credenciales.
          </p>
          <p>
            <strong>Alumnos / Estudiantes:</strong> Deben utilizar la plataforma solo para los fines de consulta previstos y mantener la confidencialidad de sus credenciales.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[var(--text)] border-b border-[var(--border)] pb-2">
            3. Exención de Responsabilidad (AS IS)
          </h2>
          <p>
            La plataforma se provee "tal como está". SKBCraft no asume responsabilidad alguna por pérdida de datos, errores de carga por parte del personal autorizado, programación incorrecta de calendarios, o decisiones institucionales tomadas en base a la información de la plataforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[var(--text)] border-b border-[var(--border)] pb-2">
            4. Logs de Auditoría
          </h2>
          <p>
            Los registros automáticos de auditoría ("Audit Logs") guardados de manera inmutable constituyen prueba plena e inapelable de las acciones de cada usuario. Cada usuario es responsable del uso de sus credenciales de acceso.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[var(--text)] border-b border-[var(--border)] pb-2">
            5. Ley Aplicable y Jurisdicción
          </h2>
          <p>
            Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia será sometida a los tribunales competentes de la jurisdicción correspondiente.
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
