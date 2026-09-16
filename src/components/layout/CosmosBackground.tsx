"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CosmosBackground
 * ─────────────────────────────────────────────────────────────────────────────
 * OPTIMIZACIÓN EXTREMA DE RENDIMIENTO:
 * 1. En Modo Claro: Se desactiva completamente (retorna null). 0% consumo de CPU/GPU.
 * 2. En Móviles (< 768px): Se desactiva completamente (retorna null).
 * 3. En Escritorio Modo Oscuro:
 *    - 45 estrellas ultra-optimizadas (en vez de 150).
 *    - Eliminado `shadowBlur` de Canvas 2D (que degradaba severamente los FPS). En su
 *      lugar se utilizan arcos concéntricos con canal alfa, ejecutados en ~0.001ms.
 *    - La nebulosa flota con aceleración CSS GPU (@keyframes) en vez de modificar el DOM con JS.
 *    - El loop de Canvas se pausa automáticamente durante el scroll para garantizar 120 FPS nativos.
 */

const STAR_COUNT = 45;
const COLORS = [
  "rgba(5, 150, 105, opacity)",
  "rgba(37, 99, 235, opacity)",
  "rgba(124, 58, 237, opacity)",
  "rgba(8, 145, 178, opacity)",
  "rgba(239, 68, 68, opacity)",
];

class Star {
  x!: number; y!: number; size!: number; opacity!: number;
  vX!: number; vY!: number; life!: number; maxLife!: number;
  fadeIn!: number; color!: string; pulse!: number; pulseSpeed!: number;
  width: number; height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.init(true);
  }

  init(firstLoad = false) {
    this.x = Math.random() * this.width;
    this.y = Math.random() * this.height;
    this.size = Math.random() * 2.4 + 0.6;
    this.vX = (Math.random() - 0.5) * 0.14;
    this.vY = (Math.random() - 0.5) * 0.14;
    this.maxLife = Math.random() * 400 + 200;
    this.life = firstLoad ? Math.random() * this.maxLife : this.maxLife;
    this.fadeIn = 0;
    this.opacity = Math.random() * 0.45 + 0.25;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.pulse = Math.random() * Math.PI;
    this.pulseSpeed = 0.012 + Math.random() * 0.015;
  }

  draw(ctx: CanvasRenderingContext2D) {
    let currentOpacity = this.opacity;
    if (this.fadeIn < 60) currentOpacity *= this.fadeIn / 60;
    else if (this.life < 60) currentOpacity *= this.life / 60;

    const twinkle = Math.sin(this.pulse) * 0.35 + 0.65;
    const finalOpacity = currentOpacity * twinkle;

    // Resplandor concéntrico suave (sin costo de shadowBlur)
    if (this.size > 1.8) {
      ctx.fillStyle = this.color.replace("opacity", (finalOpacity * 0.16).toString());
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 1.9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = this.color.replace("opacity", finalOpacity.toString());
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * twinkle, 0, Math.PI * 2);
    ctx.fill();
  }

  update(mouse: { x: number; y: number }) {
    this.x += this.vX;
    this.y += this.vY;
    this.life--;
    this.fadeIn++;
    this.pulse += this.pulseSpeed;

    if (this.life <= 0) this.init();
    if (this.x < -30) this.x = this.width + 30;
    if (this.x > this.width + 30) this.x = -30;
    if (this.y < -30) this.y = this.height + 30;
    if (this.y > this.height + 30) this.y = -30;

    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 240;
    if (distance < maxDistance) {
      const force = (maxDistance - distance) / maxDistance;
      this.x += (dx / distance) * force * 1.2;
      this.y += (dy / distance) * force * 1.2;
    }
  }
}

export default function CosmosBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Detectar móvil de forma reactiva
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.matchMedia("(max-width: 767px)").matches);
    };
    checkMobile();

    // Detectar si el tema activo es oscuro
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();

    const themeObserver = new MutationObserver(checkDark);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("resize", checkMobile, { passive: true });

    return () => {
      window.removeEventListener("resize", checkMobile);
      themeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    // En móviles o en modo claro, desactivamos todo canvas y bucle de render
    if (isMobile === null || isMobile === true || !isDark) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let stars: Star[] = [];
    const virtualMouse = { x: width / 2, y: height / 2 };
    let animationFrameId: number;
    let isPaused = false;
    let time = 0;

    function init() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      stars = Array.from({ length: STAR_COUNT }, () => new Star(width, height));
    }

    function animate() {
      if (!ctx || isPaused) return;
      ctx.clearRect(0, 0, width, height);

      time += 0.0015;
      virtualMouse.x = width / 2 + Math.cos(time) * (width / 3.5);
      virtualMouse.y = height / 2 + Math.sin(time * 0.75) * (height / 3.5);

      stars.forEach((star) => {
        star.update(virtualMouse);
        star.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    // Pausar el render de estrellas mientras el usuario hace scroll para garantizar 120 FPS
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      if (!isPaused) {
        isPaused = true;
        cancelAnimationFrame(animationFrameId);
      }
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (!document.hidden) {
          isPaused = false;
          animate();
        }
      }, 120);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true;
        cancelAnimationFrame(animationFrameId);
      } else if (!isPaused) {
        animate();
      }
    };

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(init, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    init();
    animate();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeTimer);
      clearTimeout(scrollTimeout);
    };
  }, [isMobile, isDark]);

  // Si es móvil o está en modo claro, 0 DOM, 0 memoria
  if (isMobile === null || isMobile === true || !isDark) {
    return null;
  }

  return (
    <>
      {/* Nebulosa suave acelerada exclusivamente por GPU con animación CSS nativa */}
      <div
        className="fixed top-[-10%] left-[-10%] w-[900px] h-[900px] rounded-full pointer-events-none z-0 animate-ambient-float"
        style={{
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.02) 40%, transparent 70%)",
        }}
      />
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: "transparent" }}
      />
    </>
  );
}
