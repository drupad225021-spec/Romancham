"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Volume2, VolumeX, Cpu, Activity, Info, RefreshCw } from "lucide-react";
import { checkBackendHealth } from "../lib/api";
import { playBeep } from "../lib/audio";

interface NavbarProps {
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenInfo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ soundEnabled, setSoundEnabled, onOpenInfo }) => {
  const [backendStatus, setBackendStatus] = useState<{ healthy: boolean; latencyMs: number } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const pingBackend = async () => {
    setIsChecking(true);
    const health = await checkBackendHealth();
    setBackendStatus(health);
    setIsChecking(false);
  };

  useEffect(() => {
    pingBackend();
    const interval = setInterval(pingBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next) playBeep(900, 0.08);
      return next;
    });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-[#080b12]/90 backdrop-blur-md px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/30 border border-cyan-400/40 box-glow-cyan">
            <span className="text-xl select-none">🧔‍♂️</span>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-sky-200 to-fuchsia-400 bg-clip-text text-transparent">
                ROMANCHAM<span className="text-cyan-400 font-mono">.AI</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 rounded">
                v2.4 CV-CORE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              OpenCV Morphological Follicle Rasterizer & MediaPipe Mesh
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Backend Status Pill */}
          <button
            onClick={() => {
              if (soundEnabled) playBeep(600, 0.05);
              pingBackend();
            }}
            title="Click to re-ping Computer Vision backend"
            className="flex items-center gap-2 px-2.5 py-1 text-xs font-mono rounded-lg border bg-slate-900/80 transition-colors hover:bg-slate-800"
            style={{
              borderColor: backendStatus?.healthy ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)",
            }}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus?.healthy ? "bg-emerald-400 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="hidden sm:inline text-slate-300">
              {backendStatus === null
                ? "Connecting..."
                : backendStatus.healthy
                ? `CV-ENGINE (${backendStatus.latencyMs}ms)`
                : "OFFLINE"}
            </span>
            <RefreshCw className={`w-3 h-3 text-slate-400 ${isChecking ? "animate-spin" : ""}`} />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound Effects"
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled
                ? "bg-cyan-950/50 border-cyan-500/40 text-cyan-300"
                : "bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>


          {/* Pipeline Info Modal Trigger */}
          <button
            onClick={() => {
              if (soundEnabled) playBeep(700, 0.05);
              onOpenInfo();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">How It Works</span>
          </button>
        </div>
      </div>
    </header>
  );
};
