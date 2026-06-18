'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import EscuelaInfoLogo from '@/components/EscuelaInfoLogo';
import ContactForm from '@/components/ContactForm';

export default function ContactoPage() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 md:py-20 animate-fade-in relative">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg3)] border border-[var(--border)] flex items-center justify-center shadow-sm mb-4">
          <EscuelaInfoLogo size={40} />
        </div>
        <h1 className="title-font text-3xl md:text-4xl font-black text-[var(--text)]">Contacto y Consultas Legales</h1>
        <p className="text-xs text-[var(--text3)] uppercase tracking-wider font-bold mt-2">
          Canal de Soporte Oficial · SKBCraft
        </p>
      </div>

      <ContactForm showToast={showToast} />

      <div className="text-center mt-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-[var(--verde)] text-black font-black text-xs px-6 py-3 rounded-xl hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          Volver al Inicio
        </Link>
      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-6 py-3.5 rounded-2xl shadow-lg border animate-slide-in text-xs font-bold flex items-center gap-3 ${
          toast.type === "success" 
            ? "bg-[var(--verde-bg)] text-[var(--verde)] border-[var(--verde-border)]" 
            : "bg-[var(--rojo-bg)] text-[var(--rojo)] border-[var(--rojo-border)]"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
