"use client";

import { useEffect, useRef } from "react";

const STAR_COUNT = 150; // Reducido para máximo rendimiento (240hz)
const COLORS = [
  "rgba(5, 150, 105, opacity)",  // Esmeralda Intenso
  "rgba(37, 99, 235, opacity)",  // Azul Intenso
  "rgba(124, 58, 237, opacity)", // Violeta Intenso
  "rgba(8, 145, 178, opacity)",  // Cyan Intenso
  "rgba(239, 68, 68, opacity)",  // Rojo (un toque)
];

class Star {
  x!: number;
  y!: number;
  size!: number;
  opacity!: number;
  vX!: number;
  vY!: number;
  life!: number;
  maxLife!: number;
  fadeIn!: number;
  color!: string;
  pulse!: number;
  pulseSpeed!: number;
  width: number;
  height: number;

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
    if (this.fadeIn < 60) {
      currentOpacity *= (this.fadeIn / 60);
    } else if (this.life < 60) {
      currentOpacity *= (this.life / 60);
    }

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

  update(mouse: { x: number, y: number }) {
    this.x += this.vX;
    this.y += this.vY;
    this.life--;
    this.fadeIn++;
    this.pulse += this.pulseSpeed;

    if (this.life <= 0) {
      this.init();
    }

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let stars: Star[] = [];
    const virtualMouse = { x: width / 2, y: height / 2 };
    let animationFrameId: number;
    let isPaused = false;
    let time = 0;

    function init() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      stars = [];
      const isMobile = window.innerWidth < 768;
      const count = isMobile ? 50 : 150; // Menor cantidad en móvil para máximo rendimiento
      for (let i = 0; i < count; i++) {
        stars.push(new Star(width, height));
      }
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

    function handleResize() {
      init();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true;
        cancelAnimationFrame(animationFrameId);
      } else {
        if (isPaused) {
          isPaused = false;
          animate();
        }
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    init();
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <div 
        ref={nebulaRef}
        suppressHydrationWarning
        className="fixed top-0 left-0 w-[900px] h-[900px] rounded-full pointer-events-none z-0"
        style={{ 
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.04) 40%, transparent 70%)',
          transform: 'translate3d(-1000px, -1000px, 0)',
          willChange: 'transform'
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
