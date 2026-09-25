"use client";

import React, { useId } from "react";
import { OTPInput, SlotProps, REGEXP_ONLY_DIGITS } from "input-otp";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export interface OtpVerificationInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  hasError?: boolean;
  isSuccess?: boolean;
  errorMessage?: string;
  onComplete?: (code: string) => void;
  className?: string;
}

function OtpSlot(props: SlotProps & { isSuccess?: boolean; hasError?: boolean }) {
  const { char, hasFakeCaret, isActive, isSuccess, hasError } = props;

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`relative w-11 h-14 sm:w-13 sm:h-16 flex items-center justify-center rounded-2xl text-xl sm:text-2xl font-black font-mono transition-all duration-200 select-none ${
        isSuccess
          ? "bg-[var(--verde-bg)] border-2 border-[var(--verde)] text-[var(--verde)] shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          : hasError
          ? "bg-[var(--rojo-bg)] border-2 border-[var(--rojo)] text-[var(--rojo)] shadow-[0_0_15px_rgba(239,68,68,0.25)]"
          : isActive
          ? "bg-[var(--bg3)] border-2 border-[var(--verde)] text-[var(--text)] ring-4 ring-[var(--verde)]/20 shadow-[0_0_18px_rgba(16,185,129,0.25)] scale-105"
          : char
          ? "bg-[var(--bg3)] border border-[var(--verde-border)] text-[var(--text)]"
          : "bg-[var(--bg3)] border border-[var(--border)] text-[var(--text3)] hover:border-[var(--border-hover)]"
      }`}
    >
      <AnimatePresence mode="popLayout">
        {char ? (
          <motion.span
            key={`char-${char}`}
            initial={{ scale: 0.4, opacity: 0, y: -4 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="tabular-nums"
          >
            {char}
          </motion.span>
        ) : hasFakeCaret ? (
          <motion.div
            key="caret"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-0.5 h-6 sm:h-7 bg-[var(--verde)] rounded-full"
          />
        ) : (
          <span className="text-[var(--text3)]/30 text-base sm:text-lg">·</span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function OtpVerificationInput({
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  hasError = false,
  isSuccess = false,
  errorMessage,
  onComplete,
  className = "",
}: OtpVerificationInputProps) {
  const inputId = useId();

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <motion.div
        animate={hasError ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="w-full flex justify-center"
      >
        <OTPInput
          id={inputId}
          maxLength={6}
          value={value}
          onChange={(val) => {
            onChange(val);
            if (val.length === 6 && onComplete) {
              onComplete(val);
            }
          }}
          disabled={disabled}
          autoFocus={autoFocus}
          pattern={REGEXP_ONLY_DIGITS}
          containerClassName="flex items-center gap-2 sm:gap-3"
          render={({ slots }) => (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Primer grupo de 3 dígitos */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {slots.slice(0, 3).map((slot, index) => (
                  <OtpSlot
                    key={`slot-${index}`}
                    {...slot}
                    isSuccess={isSuccess}
                    hasError={hasError}
                  />
                ))}
              </div>

              {/* Separador elegante de grupo */}
              <div className="px-1 text-[var(--text3)] font-mono text-sm sm:text-base font-bold select-none opacity-40">
                —
              </div>

              {/* Segundo grupo de 3 dígitos */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {slots.slice(3, 6).map((slot, index) => (
                  <OtpSlot
                    key={`slot-${index + 3}`}
                    {...slot}
                    isSuccess={isSuccess}
                    hasError={hasError}
                  />
                ))}
              </div>
            </div>
          )}
        />
      </motion.div>

      {/* Indicador de estado con microanimaciones */}
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--verde)]"
          >
            <CheckCircle2 size={14} className="shrink-0" />
            <span>Código de 6 dígitos verificado con éxito</span>
          </motion.div>
        ) : hasError && errorMessage ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--rojo)]"
          >
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
