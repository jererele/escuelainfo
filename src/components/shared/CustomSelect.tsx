"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface Option {
  value: string;
  label: string;
  colorClass?: string; // e.g., 'text-[var(--verde)] bg-[var(--verde-bg)]'
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  className = "",
  buttonClassName = "",
  menuClassName = ""
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const updateMenuPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left,
        minWidth: rect.width,
        maxWidth: '90vw',
        zIndex: 9999
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(target);
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(target);
      
      if (isOutsideButton && isOutsideMenu) {
        setIsOpen(false);
      }
    };
    
    const handleScroll = (event: Event) => {
      const target = event.target as Node | null;
      // Si el desplazamiento ocurre dentro del propio menú desplegable, NO cerrarlo
      if (menuRef.current && target && (menuRef.current === target || menuRef.current.contains(target))) {
        return;
      }

      // Si el scroll proviene de la ventana externa:
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setIsOpen(false);
        } else {
          updateMenuPosition();
        }
      } else {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true); // true to catch all scroll events
      window.addEventListener("resize", updateMenuPosition);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [isOpen, updateMenuPosition]);

  useLayoutEffect(() => {
    if (isOpen) {
      updateMenuPosition();
    }
  }, [isOpen, updateMenuPosition]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 w-full glass border border-[var(--border)] hover:border-[var(--verde-border)] transition-all outline-none rounded-xl px-4 py-2 text-sm font-bold shadow-sm ${buttonClassName} ${selectedOption?.colorClass || 'text-[var(--text)]'}`}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {mounted && isOpen && createPortal(
        <div 
          ref={menuRef}
          style={menuStyle}
          className={`glass border border-[var(--border2)] rounded-xl shadow-2xl overflow-hidden animate-zoom-in origin-top bg-[var(--bg2)]/95 backdrop-blur-xl ${menuClassName}`}
        >
          <div className="max-h-60 overflow-y-auto overscroll-contain p-1 custom-scrollbar">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors hover:bg-[var(--bg3)] hover:text-[var(--text)] ${opt.value === value ? "bg-[var(--bg4)] text-[var(--verde)]" : "text-[var(--text)]"} ${opt.colorClass || ''}`}
              >
                {opt.label}
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-4 py-3 text-sm text-[var(--text3)] italic">Sin opciones</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
