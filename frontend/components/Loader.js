"use client";

import React from "react";
import { HeartHandshake } from "lucide-react";

export default function Loader({
  size = "md",
  text = "Loading...",
  subtext = null,
  className = ""
}) {
  if (size === "inline") {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <span className="relative flex w-3.5 h-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
        </span>
        {text && <span className="text-xs font-semibold">{text}</span>}
      </span>
    );
  }

  const isSmall = size === "sm";
  const isLarge = size === "lg";

  const ringSize = isSmall ? "w-10 h-10" : isLarge ? "w-20 h-20" : "w-14 h-14";
  const iconSize = isSmall ? "w-4 h-4" : isLarge ? "w-8 h-8" : "w-6 h-6";

  return (
    <div className={`flex flex-col items-center justify-center py-6 px-4 ${className}`}>
      {/* Outer Orbital Glowing Spinner */}
      <div className={`relative ${ringSize} flex items-center justify-center`}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />

        {/* Counter-rotating Outer Orbital Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-r-teal-300 animate-spin" />

        {/* Inner Reverse Rotating Ring */}
        <div
          className="absolute inset-1 rounded-full border-2 border-transparent border-b-sky-400 border-l-emerald-500 animate-spin"
          style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
        />

        {/* Center Pulsing HeartHandshake Icon */}
        <div className="relative z-10 w-3/5 h-3/5 rounded-full bg-slate-950/90 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-inner">
          <HeartHandshake className={`${iconSize} animate-pulse`} />
        </div>
      </div>

      {/* Loading Text */}
      {text && (
        <div className="mt-3.5 text-center">
          <p className="text-xs sm:text-sm font-bold text-slate-200 tracking-wide flex items-center justify-center gap-1.5">
            <span>{text}</span>
            <span className="inline-flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          </p>
          {subtext && (
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{subtext}</p>
          )}
        </div>
      )}
    </div>
  );
}
