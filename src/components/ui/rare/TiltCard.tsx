"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  maxTilt?: number;
  onClick?: () => void;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = "",
  glowColor = "rgba(16, 185, 129, 0.18)",
  maxTilt = 8,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile / touch device to disable tilt for high performance (Rule 2)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(0, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 200, damping: 20 });

  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMobile || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setGlowPos({ x, y });

      const xPct = (x / width - 0.5) * 2;
      const yPct = (y / height - 0.5) * 2;

      rotateY.set(xPct * maxTilt);
      rotateX.set(-yPct * maxTilt);
    },
    [isMobile, maxTilt, rotateX, rotateY]
  );

  const handleMouseEnter = () => {
    if (!isMobile) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  };

  if (isMobile) {
    return (
      <div
        className={`relative rounded-[32px] border border-[var(--border)] bg-[var(--bg3)]/80 backdrop-blur-md transition-all active:scale-[0.98] ${className}`}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative rounded-[32px] border border-[var(--border)] bg-[var(--bg3)]/80 backdrop-blur-md transition-shadow duration-300 overflow-hidden cursor-pointer ${
        isHovered ? "shadow-2xl border-[var(--verde)]/40" : "shadow-md"
      } ${className}`}
    >
      {/* Radial Glow follow cursor */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-[32px] opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${glowPos.x}px ${glowPos.y}px, ${glowColor}, transparent 60%)`,
          }}
        />
      )}
      <div className="relative z-10 w-full h-full">{children}</div>
    </motion.div>
  );
};

export default TiltCard;
