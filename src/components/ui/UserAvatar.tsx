"use client";

import React, { useMemo, useState } from "react";
import { Blobatar } from "@blobatar/react";

interface UserAvatarProps {
  name: string;
  email?: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  animate?: "hover" | "always" | boolean;
  showRing?: boolean;
  seed?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = React.memo(({
  name,
  email,
  avatarUrl,
  size = 40,
  className = "",
  animate = "hover",
  showRing = true,
  seed: customSeed,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);

  const animateMode: "hover" | "always" | undefined =
    animate === true || animate === "hover"
      ? "hover"
      : animate === "always"
      ? "always"
      : undefined;

  // Priorizar el nombre para que el avatar responda dinámicamente al escribirlo al crear la cuenta
  const seed = useMemo(() => {
    const raw = (customSeed || name || email || "usuario").trim().toLowerCase();
    return raw || "escuelainfo";
  }, [customSeed, name, email]);

  const initials = useMemo(() => {
    if (!name) return "?";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  const hasValidPhoto = Boolean(avatarUrl && !imgError);

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 transition-transform duration-300 select-none ${
        onClick ? "cursor-pointer active:scale-95 hover:scale-105" : "hover:scale-[1.02]"
      } ${
        showRing ? "ring-2 ring-[var(--border)] hover:ring-[var(--verde)] shadow-sm" : ""
      } ${className}`}
      style={{ width: size, height: size }}
      title={name || "Usuario"}
      aria-label={`Avatar de ${name || "Usuario"}`}
    >
      {hasValidPhoto ? (
        <img
          src={avatarUrl!}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <Blobatar
          name={seed}
          size={size}
          animate={animateMode}
          className="w-full h-full object-cover rounded-full transition-opacity duration-300"
        />
      )}
      <span className="sr-only">{initials}</span>
    </div>
  );
});

UserAvatar.displayName = "UserAvatar";

export default UserAvatar;
