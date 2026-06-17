"use client";

import { useEffect, useRef, useState } from "react";

/**
 * CosmosBackground
 * ─────────────────────────────────────────────────────────────────────────────
 * OPTIMIZACIÓN MOBILE EXTREMA:
 * - Si es móvil (< 768px), el componente retorna NULL en el render (se destruye del DOM).
 * - Cero consumo de GPU/CPU, cero Canvas, cero animaciones en móviles.
 * - En PC (>= 768px), se inicializa y anima con hardware acceleration (will-change y translate3d).
 */

const STAR_COUNT = 150;
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
    this.size = Math.random() * 3.2 + 0.6;
    this.vX = (Math.random() - 0.5) * 0.18;
    this.vY = (Math.random() - 0.5) * 0.18;
    this.maxLife = Math.random() * 400 + 200;
    this.life = firstLoad ? Math.random() * this.maxLife : this.maxLife;
    this.fadeIn = 0;
    this.opacity = Math.random() * 0.5 + 0.3;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.pulse = Math.random() * Math.PI;
    this.pulseSpeed = 0.015 + Math.random() * 0.02;
  }

  draw(ctx: CanvasRenderingContext2D) {
    let currentOpacity = this.opacity;
    if (this.fadeIn < 60) currentOpacity *= this.fadeIn / 60;
    else if (this.life < 60) currentOpacity *= this.life / 60;

    const twinkle = Math.sin(this.pulse) * 0.4 + 0.6;
    const finalOpacity = currentOpacity * twinkle;

    ctx.fillStyle = this.color.replace("opacity", finalOpacity.toString());
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * twinkle, 0, Math.PI * 2);
    ctx.fill();

    if (this.size > 2.2) {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.color.replace("opacity", "0.5");
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  update(mouse: { x: number; y: number }) {
    this.x += this.vX;
    this.y += this.vY;
    this.life--;
    this.fadeIn++;
    this.pulse += this.pulseSpeed;

    if (this.life <= 0) this.init();
    if (this.x < -50) this.x = this.width + 50;
    if (this.x > this.width + 50) this.x = -50;
    if (this.y < -50) this.y = this.height + 50;
    if (this.y > this.height + 50) this.y = -50;

    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 300;
    if (distance < maxDistance) {
      const force = (maxDistance - distance) / maxDistance;
      this.x += (dx / distance) * force * 1.8;
      this.y += (dy / distance) * force * 1.8;
    }
  }
}

export default function CosmosBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nebulaRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // Detectar si es móvil de forma estricta al montar en cliente
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    };
    checkMobile();
  }, []);

  useEffect(() => {
    // Si todavía no se monta o si es móvil, no ejecutamos nada de canvas
    if (isMobile === null || isMobile === true) return;

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

      time += 0.002;
      virtualMouse.x = width / 2 + Math.cos(time) * (width / 3);
      virtualMouse.y = height / 2 + Math.sin(time * 0.8) * (height / 3);

      if (nebulaRef.current) {
        nebulaRef.current.style.transform = `translate3d(${virtualMouse.x - 450}px, ${virtualMouse.y - 450}px, 0)`;
      }

      stars.forEach((star) => {
        star.update(virtualMouse);
        star.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && isPaused) {
          isPaused = false;
          animate();
        } else if (!entry.isIntersecting) {
          isPaused = true;
          cancelAnimationFrame(animationFrameId);
        }
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

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

    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    init();
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [isMobile]);

  // Durante la carga inicial (SSR), renderizamos el fallback que Tailwind oculta en móviles
  if (isMobile === null) {
    return (
      <>
        <div className="hidden md:block fixed top-0 left-0 w-[900px] h-[900px] rounded-full pointer-events-none z-0" />
        <canvas className="hidden md:block fixed inset-0 z-0 pointer-events-none" />
      </>
    );
  }

  // Si es móvil, destruimos completamente del DOM
  if (isMobile === true) {
    return null;
  }

  // En PC se renderiza y anima
  return (
    <>
      <div
        ref={nebulaRef}
        className="fixed top-0 left-0 w-[900px] h-[900px] rounded-full pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.04) 40%, transparent 70%)",
          transform: "translate3d(-1000px, -1000px, 0)",
          willChange: "transform",
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
