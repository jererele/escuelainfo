"use client";

import React, { useState, useCallback, useRef } from "react";

interface GravityTextProps {
  text: string;
  className?: string;
  delay?: number;
}

const ROTATION_ANGLES = [-9, 8, -7, 10, -8, 7, -10, 9, -7, 8];

interface InteractiveCharProps {
  char: string;
  index: number;
  totalIndex: number;
  delay: number;
  className?: string;
}

const InteractiveChar: React.FC<InteractiveCharProps> = ({
  char,
  totalIndex,
  delay,
  className = "",
}) => {
  const [bouncing, setBouncing] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const angle = ROTATION_ANGLES[totalIndex % ROTATION_ANGLES.length];
  const revAngle = -Math.round(angle * 0.55);
  const subAngle = Math.round(angle * 0.25);

  const triggerBounce = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setBounceKey((k) => k + 1);
    setBouncing(true);
    timeoutRef.current = setTimeout(() => {
      setBouncing(false);
    }, 550);
  }, []);

  return (
    <span
      key={bounceKey}
      onMouseEnter={triggerBounce}
      onPointerEnter={triggerBounce}
      onTouchStart={triggerBounce}
      style={{
        "--letter-rot": `${angle}deg`,
        "--letter-rot-rev": `${revAngle}deg`,
        "--letter-rot-sub": `${subAngle}deg`,
        animationDelay: bouncing ? "0ms" : `${totalIndex * delay * 1000}ms`,
      } as React.CSSProperties}
      className={`interactive-letter ${
        bouncing ? "animate-letter-bounce" : "animate-letter-in"
      } ${className}`}
      title="Escuela 713"
    >
      {char}
    </span>
  );
};

export const GravityText: React.FC<GravityTextProps> = ({
  text,
  className = "",
  delay = 0.04,
}) => {
  const words = text.split(" ");
  let globalCharIndex = 0;

  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2.5 sm:gap-x-3.5 ${className}`}>
      {words.map((word, wordIdx) => {
        const wordChars = word.split("");
        return (
          <span key={wordIdx} className="inline-flex whitespace-nowrap">
            {wordChars.map((char) => {
              const idx = globalCharIndex++;
              return (
                <InteractiveChar
                  key={`${wordIdx}-${idx}`}
                  char={char}
                  index={idx}
                  totalIndex={idx}
                  delay={delay}
                  className={className}
                />
              );
            })}
          </span>
        );
      })}
    </span>
  );
};

export default GravityText;

