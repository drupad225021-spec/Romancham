"use client";

import React, { useEffect, useState } from "react";
import { Terminal, Cpu, Loader2, Sparkles } from "lucide-react";
import { playLaserScan } from "../lib/audio";

interface ScanningHUDProps {
  imagePreviewUrl: string;
  soundEnabled: boolean;
}

const DEFAULT_LOGS = [
  "Initializing Optical Follicle Sensor...",
  "Running MediaPipe Face Mesh landmark detection...",
  "Isolating lower-face Euclidean manifold (cheeks & jaw)...",
  "Applying CLAHE contrast equalization & bilateral blur...",
  "Extracting high-frequency filament gradient vectors...",
  "Eliminating skin pore background noise components...",
  "Executing Zhang-Suen morphological skeletonization...",
  "Isolating single-pixel hair filament linear contours...",
  "Calculating left-to-right jawline equilibrium...",
  "Computing follicle spatial distribution & density matrix...",
  "Measuring follicular coverage & perimeter index...",
  "Synthesizing cyberpunk biometric HUD overlay..."
];

export const ScanningHUD: React.FC<ScanningHUDProps> = ({
  imagePreviewUrl,
  soundEnabled,
}) => {
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    if (soundEnabled) {
      playLaserScan();
    }

    const logInterval = setInterval(() => {
      setCurrentLogIndex((prev) => (prev + 1) % DEFAULT_LOGS.length);
    }, 450);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + Math.floor(Math.random() * 12 + 5) : 95));
    }, 300);

    return () => {
      clearInterval(logInterval);
      clearInterval(progressInterval);
    };
  }, [soundEnabled]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-cyan-500/40 shadow-2xl box-glow-cyan">
      {/* Background Image Underneath Scan */}
      <div className="relative h-[380px] md:h-[460px] w-full flex items-center justify-center bg-slate-950 overflow-hidden">
        <img
          src={imagePreviewUrl}
          alt="Scanning target"
          className="w-full h-full object-contain filter brightness-75 contrast-125 blur-[1px]"
        />

        {/* Cyberpunk Grid Overlay */}
        <div className="cyber-grid absolute inset-0 pointer-events-none opacity-40" />
        <div className="scanline" />

        {/* Sweeping Laser Line */}
        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-white to-fuchsia-500 animate-laser shadow-[0_0_15px_#00f0ff,0_0_30px_#d946ef] z-30">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/90 border border-cyan-400 text-[10px] font-mono text-cyan-300 rounded">
            SCANNING FOLLICLES: {progress}%
          </div>
        </div>

        {/* Tech Corner Crosshairs */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400 z-20" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400 z-20" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400 z-20" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400 z-20" />

        {/* Center Target Box */}
        <div className="absolute inset-16 md:inset-24 border border-cyan-400/30 rounded-xl pointer-events-none flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border border-cyan-400/40 animate-ping" />
        </div>
      </div>

      {/* Real-time Faux Terminal Logs */}
      <div className="p-4 bg-[#070a10] border-t border-cyan-500/30 font-mono text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold tracking-wider">
            <Terminal className="w-3.5 h-3.5 animate-pulse" />
            <span>CV TELEMETRY STREAM</span>
          </div>
          <span className="text-[11px] text-fuchsia-400 font-bold">{progress}% COMPLETE</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Animated Terminal Log Line */}
        <div className="flex items-center gap-2 text-slate-300 bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800">
          <span className="text-cyan-400 select-none">&gt;&gt;</span>
          <span className="truncate text-cyan-200">{DEFAULT_LOGS[currentLogIndex]}</span>
          <span className="w-1.5 h-3.5 bg-cyan-400 animate-pulse ml-auto" />
        </div>
      </div>
    </div>
  );
};
