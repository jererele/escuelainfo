"use client";

import { useEffect } from "react";

/**
 * ModalScrollEnhancer
 * Previene que el scroll de la rueda del ratón (mouse wheel) o gestos táctiles
 * fuera de un modal abierto (en el backdrop u overlay oscuro) deslicen la página
 * de fondo. Además contiene el scroll dentro de la ventana activa para evitar
 * scroll-chaining hacia el dashboard o el layout raíz.
 */
export default function ModalScrollEnhancer() {
  useEffect(() => {
    let isUpdating = false;

    // 1. Detección en tiempo real de modales visibles en el DOM
    const checkModals = () => {
      if (isUpdating) return;

      const overlays = document.querySelectorAll<HTMLElement>(
        ".fixed.inset-0:not(.pointer-events-none)"
      );

      let hasOpenModal = false;
      for (const el of overlays) {
        // Ignorar overlays de fondo con z-index negativo
        const zIndex = window.getComputedStyle(el).zIndex;
        if (zIndex && parseInt(zIndex, 10) < 0) continue;

        if (
          el.offsetWidth > 0 ||
          el.offsetHeight > 0 ||
          el.getClientRects().length > 0
        ) {
          const style = window.getComputedStyle(el);
          if (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity !== "0"
          ) {
            hasOpenModal = true;
            break;
          }
        }
      }

      isUpdating = true;
      try {
        if (hasOpenModal) {
          if (!document.body.classList.contains("modal-open")) {
            document.body.classList.add("modal-open");
            document.documentElement.classList.add("modal-open");
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
          }
        } else {
          if (document.body.classList.contains("modal-open")) {
            document.body.classList.remove("modal-open");
            document.documentElement.classList.remove("modal-open");
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
          }
        }
      } finally {
        isUpdating = false;
      }
    };

    // 2. Intercepción quirúrgica del scroll con la rueda del ratón
    const handleWheel = (e: WheelEvent) => {
      if (!document.body.classList.contains("modal-open")) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Buscar si el evento ocurrió sobre el backdrop de un modal
      const modalOverlay = target.closest<HTMLElement>(
        ".fixed.inset-0:not(.pointer-events-none)"
      );

      if (!modalOverlay) {
        // Si hay modal abierto y el evento ocurrió fuera de él, bloquear scroll de fondo
        e.preventDefault();
        return;
      }

      // Si el cursor está en el backdrop o en una zona del modal, verificar si puede scrollear
      let current: HTMLElement | null = target;
      let canScrollInTarget = false;

      while (current && current !== modalOverlay && current !== document.body) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;

        if (overflowY === "auto" || overflowY === "scroll") {
          const deltaY = e.deltaY;
          const maxScrollTop = current.scrollHeight - current.clientHeight;

          // Permitir scroll solo si el contenedor tiene espacio en esa dirección
          const canScrollDown = deltaY > 0 && current.scrollTop < maxScrollTop - 0.5;
          const canScrollUp = deltaY < 0 && current.scrollTop > 0.5;

          if (canScrollDown || canScrollUp) {
            canScrollInTarget = true;
            break;
          }
        }
        current = current.parentElement;
      }

      // Si el cursor está fuera de la ventana (en el backdrop) o en los bordes del contenido:
      if (!canScrollInTarget) {
        e.preventDefault();
      }
    };

    // 3. Intercepción táctil en móvil para evitar arrastrar el fondo
    const handleTouchMove = (e: TouchEvent) => {
      if (!document.body.classList.contains("modal-open")) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const modalOverlay = target.closest<HTMLElement>(
        ".fixed.inset-0:not(.pointer-events-none)"
      );

      if (!modalOverlay) {
        e.preventDefault();
        return;
      }

      let current: HTMLElement | null = target;
      let insideScrollable = false;

      while (current && current !== modalOverlay && current !== document.body) {
        const style = window.getComputedStyle(current);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          if (current.scrollHeight > current.clientHeight) {
            insideScrollable = true;
            break;
          }
        }
        current = current.parentElement;
      }

      if (!insideScrollable) {
        e.preventDefault();
      }
    };

    // Observar inserción y remoción de modales en el DOM
    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "hidden"],
    });

    // Verificación inicial
    checkModals();

    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false, capture: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("touchmove", handleTouchMove, { capture: true });
      document.body.classList.remove("modal-open");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return null;
}
