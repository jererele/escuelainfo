"use client";

import { useEffect } from "react";

/**
 * DatePickerEnhancer
 * Permite que al hacer clic en cualquier parte de un <input type="date">
 * (o su contenedor/icono), el navegador abra automáticamente el calendario emergente nativo
 * en lugar de resaltar el texto "dd/mm/aaaa".
 */
export default function DatePickerEnhancer() {
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Detectar si se hizo clic en un input de tipo date o time
      const pickerInput = (
        target.tagName === "INPUT" &&
        ((target as HTMLInputElement).type === "date" || (target as HTMLInputElement).type === "time")
          ? target
          : target.closest('input[type="date"], input[type="time"]')
      ) as HTMLInputElement | null;

      if (pickerInput && typeof pickerInput.showPicker === "function") {
        try {
          pickerInput.showPicker();
        } catch {
          // Ignorar si el navegador ya lo está mostrando o si el evento ya se consumió
        }
      }
    };

    document.addEventListener("click", handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, []);

  return null;
}
