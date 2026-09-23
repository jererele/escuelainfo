"use client";

import React, { useEffect, useState } from "react";
import { gamerEasterEgg } from "@/lib/gamerEasterEgg";
import { Sparkles, Gamepad2, Volume2, X } from "lucide-react";

/**
 * Nyan Cat SVG component with Pop-Tart body, rainbow trail, and pixel aesthetic
 */
function NyanCat({ size = 1 }: { size?: number }) {
  return (
    <div
      className="inline-flex items-center select-none pointer-events-none"
      style={{ transform: `scale(${size})`, transformOrigin: "left center" }}
    >
      {/* Rainbow Trail waving */}
      <div className="flex flex-col h-11 w-48 overflow-hidden nyan-trail-wavy opacity-90">
        <div className="h-[7.33px] bg-[#ff0000]" />
        <div className="h-[7.33px] bg-[#ff9900]" />
        <div className="h-[7.33px] bg-[#ffff00]" />
        <div className="h-[7.33px] bg-[#33ff00]" />
        <div className="h-[7.33px] bg-[#0099ff]" />
        <div className="h-[7.33px] bg-[#6633ff]" />
      </div>

      {/* Nyan Cat Body */}
      <div className="relative w-28 h-18 -ml-3 animate-[bounce_0.35s_infinite]">
        {/* Tail */}
        <div className="absolute -left-3 top-7 w-4 h-3 bg-[#9e9e9e] border-2 border-black rounded-sm animate-[wiggle_0.2s_infinite]" />

        {/* Back legs */}
        <div className="absolute left-2 bottom-0 w-3 h-3 bg-[#9e9e9e] border-2 border-black rounded-sm" />
        <div className="absolute right-4 bottom-0 w-3 h-3 bg-[#9e9e9e] border-2 border-black rounded-sm" />

        {/* Pop-Tart Toast Crust */}
        <div className="absolute inset-1 bg-[#f4b266] border-2 border-black rounded-xl p-1.5 shadow-md">
          {/* Strawberry Frosting */}
          <div className="w-full h-full bg-[#ff99bb] border border-[#ff6699] rounded-lg relative overflow-hidden flex flex-wrap gap-1 p-1">
            {/* Sprinkles */}
            <span className="w-1 h-1 bg-[#ff0055] rounded-full inline-block" />
            <span className="w-1 h-1 bg-[#0099ff] rounded-full inline-block ml-2" />
            <span className="w-1.5 h-1 bg-[#6600cc] rounded-full inline-block" />
            <span className="w-1 h-1 bg-[#00cc44] rounded-full inline-block ml-3" />
            <span className="w-1.5 h-1 bg-[#ff0055] rounded-full inline-block mt-2" />
            <span className="w-1 h-1 bg-[#ffff00] rounded-full inline-block ml-2 mt-1" />
            <span className="w-1.5 h-1 bg-[#0099ff] rounded-full inline-block ml-1 mt-1" />
          </div>
        </div>

        {/* Head */}
        <div className="absolute -right-5 top-1 w-12 h-11 bg-[#9e9e9e] border-2 border-black rounded-xl shadow-lg">
          {/* Ears */}
          <div className="absolute -top-2 left-0.5 w-3 h-3 bg-[#9e9e9e] border-t-2 border-l-2 border-black rotate-[-15deg]">
            <div className="w-1.5 h-1.5 bg-[#ff99bb] m-0.5 rounded-xs" />
          </div>
          <div className="absolute -top-2 right-1.5 w-3 h-3 bg-[#9e9e9e] border-t-2 border-r-2 border-black rotate-[15deg]">
            <div className="w-1.5 h-1.5 bg-[#ff99bb] m-0.5 rounded-xs" />
          </div>

          {/* Eyes */}
          <div className="absolute top-3 left-2 w-2 h-2 bg-black rounded-full flex items-start justify-start p-0.5">
            <span className="w-0.5 h-0.5 bg-white rounded-full block" />
          </div>
          <div className="absolute top-3 right-3 w-2 h-2 bg-black rounded-full flex items-start justify-start p-0.5">
            <span className="w-0.5 h-0.5 bg-white rounded-full block" />
          </div>

          {/* Cheeks */}
          <div className="absolute top-5 left-0.5 w-2.5 h-2 bg-[#ff6699] rounded-full" />
          <div className="absolute top-5 right-1.5 w-2.5 h-2 bg-[#ff6699] rounded-full" />

          {/* Nose & Mouth */}
          <div className="absolute top-4 left-5 w-1 h-0.5 bg-black" />
          <div className="absolute top-5 left-4 text-[7px] font-black leading-none text-black select-none">
            ω
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NyanCatGamerOverlay() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    return gamerEasterEgg.subscribe((isActive) => {
      setActive(isActive);
    });
  }, []);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden select-none">
      {/* Starfield Particles drifting backwards */}
      <div className="absolute inset-0 bg-transparent">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white font-black text-xs animate-[starDrift_3s_linear_infinite]"
            style={{
              top: `${(i * 19) % 96}%`,
              left: `${(i * 31) % 98}%`,
              animationDelay: `${(i * 0.25) % 2.5}s`,
              opacity: 0.85,
            }}
          >
            ✦
          </div>
        ))}
      </div>

      {/* Flying Nyan Cats at multiple elevations and speeds */}
      {/* Cat 1: Main fast */}
      <div
        className="absolute top-[18%] -left-64 animate-[nyanFly_6.5s_linear_infinite]"
        style={{ animationDelay: "0s" }}
      >
        <NyanCat size={1.25} />
      </div>

      {/* Cat 2: Medium height */}
      <div
        className="absolute top-[48%] -left-64 animate-[nyanFly_8s_linear_infinite]"
        style={{ animationDelay: "2.8s" }}
      >
        <NyanCat size={0.9} />
      </div>

      {/* Cat 3: Lower track */}
      <div
        className="absolute top-[76%] -left-64 animate-[nyanFly_5.5s_linear_infinite]"
        style={{ animationDelay: "4.2s" }}
      >
        <NyanCat size={1.1} />
      </div>

      {/* Cat 4: High altitude miniature */}
      <div
        className="absolute top-[8%] -left-64 animate-[nyanFly_9.5s_linear_infinite]"
        style={{ animationDelay: "1.2s" }}
      >
        <NyanCat size={0.7} />
      </div>

      {/* Floating HUD banner (clickable to close or informing how to exit) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-black/85 backdrop-blur-md border-2 border-pink-500 shadow-[0_0_25px_rgba(255,0,128,0.7)] text-white text-xs font-black uppercase tracking-wider animate-[pulse_1.5s_infinite]">
          <Gamepad2 size={16} className="text-yellow-300 animate-spin" />
          <span className="bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 to-purple-500 bg-clip-text text-transparent font-extrabold">
            ¡MODO ARGB GAMER ACTIVADO!
          </span>
          <span className="hidden sm:inline text-[11px] text-gray-300 font-semibold normal-case">
            (Cambiá de tema para salir)
          </span>
          <button
            onClick={() => gamerEasterEgg.deactivate()}
            className="p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors ml-1 cursor-pointer"
            title="Salir del Modo Gamer"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
