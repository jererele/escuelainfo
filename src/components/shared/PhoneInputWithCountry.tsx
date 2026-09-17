"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Check, AlertCircle } from "lucide-react";

export interface CountryCodeItem {
  code: string;        // Prefijo internacional (ej: "+54")
  name: string;        // Nombre del país (ej: "Argentina")
  flag: string;        // Emoji de bandera (ej: "🇦🇷")
  iso: string;         // Código ISO 2 (ej: "AR")
  minDigits: number;   // Mínimo de dígitos locales requeridos
  maxDigits: number;   // Límite estricto de dígitos locales
  placeholder: string; // Ejemplo de formato local (ej: "2945 123456")
}

// Lista oficial de países de América del Sur y sus códigos de llamada
export const SOUTH_AMERICAN_COUNTRIES: CountryCodeItem[] = [
  { code: "+54", name: "Argentina", flag: "🇦🇷", iso: "AR", minDigits: 8, maxDigits: 11, placeholder: "2945 123456" },
  { code: "+591", name: "Bolivia", flag: "🇧🇴", iso: "BO", minDigits: 8, maxDigits: 9, placeholder: "71234567" },
  { code: "+55", name: "Brasil", flag: "🇧🇷", iso: "BR", minDigits: 10, maxDigits: 11, placeholder: "11 91234 5678" },
  { code: "+56", name: "Chile", flag: "🇨🇱", iso: "CL", minDigits: 8, maxDigits: 9, placeholder: "9 1234 5678" },
  { code: "+57", name: "Colombia", flag: "🇨🇴", iso: "CO", minDigits: 10, maxDigits: 10, placeholder: "300 123 4567" },
  { code: "+593", name: "Ecuador", flag: "🇪🇨", iso: "EC", minDigits: 8, maxDigits: 9, placeholder: "99 123 4567" },
  { code: "+592", name: "Guyana", flag: "🇬🇾", iso: "GY", minDigits: 7, maxDigits: 8, placeholder: "612 3456" },
  { code: "+595", name: "Paraguay", flag: "🇵🇾", iso: "PY", minDigits: 8, maxDigits: 9, placeholder: "981 123456" },
  { code: "+51", name: "Perú", flag: "🇵🇪", iso: "PE", minDigits: 9, maxDigits: 9, placeholder: "912 345 678" },
  { code: "+597", name: "Surinam", flag: "🇸🇷", iso: "SR", minDigits: 7, maxDigits: 7, placeholder: "712 3456" },
  { code: "+598", name: "Uruguay", flag: "🇺🇾", iso: "UY", minDigits: 8, maxDigits: 9, placeholder: "99 123 456" },
  { code: "+58", name: "Venezuela", flag: "🇻🇪", iso: "VE", minDigits: 10, maxDigits: 10, placeholder: "412 1234567" },
  { code: "+594", name: "Guayana Francesa", flag: "🇬🇫", iso: "GF", minDigits: 9, maxDigits: 9, placeholder: "694 12 34 56" }
];

export interface PhoneInputWithCountryProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  autoFocus?: boolean;
}

// Separar valor completo en país y dígitos locales
function parseIncomingPhone(fullValue: string): { country: CountryCodeItem; localDigits: string } {
  const trimmed = (fullValue || "").trim();
  if (!trimmed) {
    return { country: SOUTH_AMERICAN_COUNTRIES[0], localDigits: "" };
  }

  // Ordenar países por longitud de código descendente para evitar colisiones (+591 vs +5)
  const sorted = [...SOUTH_AMERICAN_COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (trimmed.startsWith(c.code)) {
      const rest = trimmed.slice(c.code.length).replace(/\D/g, "").slice(0, c.maxDigits);
      return { country: c, localDigits: rest };
    }
  }

  // Si no tiene prefijo con "+", asumir Argentina y limpiar dígitos
  const onlyDigits = trimmed.replace(/\D/g, "").slice(0, SOUTH_AMERICAN_COUNTRIES[0].maxDigits);
  return { country: SOUTH_AMERICAN_COUNTRIES[0], localDigits: onlyDigits };
}

export default function PhoneInputWithCountry({
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  id,
  name,
  autoFocus = false
}: PhoneInputWithCountryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 280
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Extraer estado actual a partir del valor padre
  const { country: selectedCountry, localDigits } = useMemo(() => {
    return parseIncomingPhone(value);
  }, [value]);

  // Actualizar posición del menú desplegable con Portal fijo
  const updateMenuPosition = useCallback(() => {
    if (triggerButtonRef.current && containerRef.current) {
      const triggerRect = triggerButtonRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const width = Math.max(300, Math.min(containerRect.width, 360));
      let left = triggerRect.left;
      
      // Asegurar que no desborde horizontalmente la pantalla
      if (typeof window !== "undefined") {
        if (left + width > window.innerWidth - 12) {
          left = window.innerWidth - width - 12;
        }
        if (left < 12) left = 12;
      }

      setMenuPosition({
        top: triggerRect.bottom + 6,
        left,
        width
      });
    }
  }, []);

  useLayoutEffect(() => {
    if (isOpen) {
      updateMenuPosition();
    }
  }, [isOpen, updateMenuPosition]);

  // Manejo de clic exterior y scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerButtonRef.current &&
        !triggerButtonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = (e: Event) => {
      // Si se scrollea dentro del menú desplegable, no cerrarlo
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updateMenuPosition);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updateMenuPosition);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updateMenuPosition]);

  // Autofoco en el buscador al abrir el menú
  useEffect(() => {
    if (isOpen) {
      setSearchFilter("");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filtrar países
  const filteredCountries = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return SOUTH_AMERICAN_COUNTRIES;
    return SOUTH_AMERICAN_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.includes(q) ||
        c.iso.toLowerCase().includes(q)
    );
  }, [searchFilter]);

  // Manejo de cambio en los dígitos locales (estricto a números y límite)
  const handleDigitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Permitir solo caracteres numéricos (0-9)
    const cleaned = raw.replace(/\D/g, "");
    // Limitar al máximo de dígitos configurado para el país
    const limited = cleaned.slice(0, selectedCountry.maxDigits);

    if (limited.length === 0) {
      onChange("");
    } else {
      onChange(`${selectedCountry.code} ${limited}`);
    }
  };

  // Selección de país
  const handleSelectCountry = (country: CountryCodeItem) => {
    const trimmedDigits = localDigits.slice(0, country.maxDigits);
    setIsOpen(false);
    if (trimmedDigits) {
      onChange(`${country.code} ${trimmedDigits}`);
    } else {
      onChange(`${country.code} `);
    }
    inputRef.current?.focus();
  };

  const isComplete = localDigits.length >= selectedCountry.minDigits;
  const hasDigits = localDigits.length > 0;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className={`relative flex items-center w-full bg-[var(--bg3)] border transition-all rounded-2xl overflow-hidden shadow-sm ${
          isFocused
            ? "border-[var(--verde)] ring-2 ring-[var(--verde)]/15 shadow-[0_0_15px_rgba(var(--verde-rgb),0.1)]"
            : "border-[var(--border)] hover:border-[var(--verde-border)]"
        } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
      >
        {/* Botón selector de país (Código de área) */}
        <button
          ref={triggerButtonRef}
          type="button"
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
            }
          }}
          title={`Código de área actual: ${selectedCountry.name} (${selectedCountry.code}). Clic para cambiar país.`}
          className="flex items-center gap-1.5 px-3.5 py-4 bg-[var(--bg2)]/60 hover:bg-[var(--bg2)] border-r border-[var(--border)] transition-colors cursor-pointer shrink-0 select-none"
        >
          <span className="text-lg leading-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="text-xs font-black text-[var(--text)] tracking-tight">
            {selectedCountry.code}
          </span>
          <ChevronDown
            size={13}
            className={`text-[var(--text3)] transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[var(--verde)]" : ""
            }`}
          />
        </button>

        {/* Input de número telefónico (con limitador numérico) */}
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            id={id}
            name={name}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            autoComplete="tel-national"
            maxLength={selectedCountry.maxDigits}
            placeholder={placeholder || selectedCountry.placeholder}
            value={localDigits}
            onChange={handleDigitsChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-transparent px-3.5 py-4 outline-none font-bold text-[var(--text)] text-sm placeholder:text-[var(--text3)]/60"
          />

          {/* Indicador de dígitos / Estado */}
          <div className="pr-3.5 pl-1 flex items-center shrink-0">
            {hasDigits && (
              <div
                className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
                  isComplete
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                }`}
                title={
                  isComplete
                    ? "Número válido"
                    : `Mínimo ${selectedCountry.minDigits} dígitos requeridos`
                }
              >
                {localDigits.length}/{selectedCountry.maxDigits}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Portal del Menú Desplegable con Países de Sudamérica */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: 99999
            }}
            className="glass border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-zoom-in bg-[var(--bg)]/95 backdrop-blur-xl"
          >
            {/* Buscador de Países */}
            <div className="p-2.5 border-b border-[var(--border)] bg-[var(--bg2)]/60">
              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg3)] border border-[var(--border)] rounded-xl">
                <Search size={14} className="text-[var(--text3)] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar país o prefijo..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-transparent outline-none text-xs font-bold text-[var(--text)] placeholder:text-[var(--text3)]"
                />
              </div>
            </div>

            {/* Listado de Países de Sudamérica */}
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 overscroll-contain">
              <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--text3)]">
                Países de Sudamérica ({filteredCountries.length})
              </div>

              {filteredCountries.map((country) => {
                const isSelected = country.code === selectedCountry.code;
                return (
                  <button
                    key={country.iso}
                    type="button"
                    onClick={() => handleSelectCountry(country)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--verde-bg)] text-[var(--verde)] font-black border border-[var(--verde-border)] shadow-sm"
                        : "text-[var(--text)] hover:bg-[var(--bg3)] font-bold"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base leading-none shrink-0" role="img" aria-label={country.name}>
                        {country.flag}
                      </span>
                      <span className="truncate text-left">{country.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          isSelected ? "text-[var(--verde)]" : "text-[var(--text2)]"
                        }`}
                      >
                        {country.code}
                      </span>
                      {isSelected && <Check size={14} strokeWidth={3} className="text-[var(--verde)]" />}
                    </div>
                  </button>
                );
              })}

              {filteredCountries.length === 0 && (
                <div className="p-4 text-center text-xs font-bold text-[var(--text3)] flex flex-col items-center gap-1">
                  <AlertCircle size={18} />
                  <span>No se encontró ningún país coincidente</span>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
