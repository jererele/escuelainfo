"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";

interface GravityTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export const GravityText: React.FC<GravityTextProps> = ({
  text,
  className = "",
  delay = 0.03,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768 || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const characters = text.split("");

  if (isMobile) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={`inline-flex flex-wrap ${className}`}>
      {characters.map((char, index) => {
        if (char === " ") {
          return (
            <span key={index} className="inline-block w-2">
              &nbsp;
            </span>
          );
        }

        return (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: -24, rotate: -8 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{
              type: "spring",
              damping: 12,
              stiffness: 150,
              delay: index * delay,
            }}
            whileHover={{
              y: -8,
              rotate: [0, -6, 6, 0],
              transition: { duration: 0.25 },
            }}
            className="inline-block cursor-default select-none"
          >
            {char}
          </motion.span>
        );
      })}
    </span>
  );
};

export default GravityText;
