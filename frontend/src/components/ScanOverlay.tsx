"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Layers, 
  Flame, 
  Eye, 
  Columns, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2,
  Crosshair,
  Sparkles
} from "lucide-react";
import { AnalysisResponse } from "@/types";
import { playBeep } from "@/lib/audio";

interface ScanOverlayProps {
  imagePreviewUrl: string;
  analysis: AnalysisResponse;
  soundEnabled: boolean;
}

export const ScanOverlay: React.FC<ScanOverlayProps> = ({
  imagePreviewUrl,
  analysis,
  soundEnabled,
}) => {
  const [viewMode, setViewMode] = useState<"strands" | "heatmap" | "split" | "original">("strands");
  const [splitPosition, setSplitPosition] = useState(50); // percentage 0 - 100
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showMesh, setShowMesh] = useState(true);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.max(1, Math.min(3, Math.round((prev + delta) * 10) / 10));
      if (soundEnabled) playBeep(750, 0.03);
      return next;
    });
  };

  const resetZoom = () => {
    setZoomLevel(1);
    if (soundEnabled) playBeep(650, 0.04);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    if (isDraggingSplit) {
      setSplitPosition(x);
    }
    setHoverCoord({ x: Math.round(x), y: Math.round(y) });
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDraggingSplit(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div className="w-full flex flex-col bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-4 md:p-6 backdrop-blur-sm shadow-xl">
      {/* HUD Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        {/* Layer View Mode Toggles */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setViewMode("strands");
              if (soundEnabled) playBeep(700, 0.04);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "strands"
                ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cyber Strands</span>
          </button>

          <button
            onClick={() => {
              setViewMode("heatmap");
              if (soundEnabled) playBeep(700, 0.04);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "heatmap"
                ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Heatmap</span>
          </button>

          <button
            onClick={() => {
              setViewMode("split");
              if (soundEnabled) playBeep(700, 0.04);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "split"
                ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>A/B Split</span>
          </button>

          <button
            onClick={() => {
              setViewMode("original");
              if (soundEnabled) playBeep(700, 0.04);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "original"
                ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Raw</span>
          </button>
        </div>

        {/* Zoom & Inspection Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950/80 rounded-xl border border-slate-800 p-1 text-slate-400">
            <button
              onClick={() => handleZoom(-0.25)}
              disabled={zoomLevel <= 1}
              title="Zoom out"
              className="p-1.5 hover:text-cyan-300 disabled:opacity-30 disabled:hover:text-slate-400 transition"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono text-cyan-400">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => handleZoom(0.25)}
              disabled={zoomLevel >= 3}
              title="Zoom in"
              className="p-1.5 hover:text-cyan-300 disabled:opacity-30 disabled:hover:text-slate-400 transition"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel > 1 && (
              <button
                onClick={resetZoom}
                title="Reset Zoom"
                className="p-1.5 hover:text-cyan-300 border-l border-slate-800 text-slate-400"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Viewer */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverCoord(null)}
        className="relative w-full h-[400px] md:h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 select-none cursor-crosshair group flex items-center justify-center"
      >
        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Base Layer: Original Photo */}
          <img
            src={imagePreviewUrl}
            alt="Original facial subject"
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Layer: Cyberpunk Glowing Strands */}
          {(viewMode === "strands" || (viewMode === "split" && splitPosition > 0)) && (
            <div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              style={
                viewMode === "split"
                  ? { clipPath: `polygon(0 0, ${splitPosition}% 0, ${splitPosition}% 100%, 0 100%)` }
                  : undefined
              }
            >
              <img
                src={analysis.overlay_mask_b64}
                alt="Cyberpunk hair strands overlay"
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]"
              />
            </div>
          )}

          {/* Layer: Follicle Heatmap */}
          {viewMode === "heatmap" && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <img
                src={analysis.heatmap_mask_b64}
                alt="Follicle density heatmap"
                className="w-full h-full object-contain opacity-85"
              />
            </div>
          )}

          {/* Interactive A/B Split Slider Bar */}
          {viewMode === "split" && (
            <div
              onMouseDown={() => setIsDraggingSplit(true)}
              className="absolute top-0 bottom-0 w-1 bg-cyan-400 cursor-ew-resize z-30 shadow-[0_0_10px_#00f0ff]"
              style={{ left: `${splitPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -left-3.5 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center shadow-lg text-cyan-300">
                <Columns className="w-3.5 h-3.5" />
              </div>
              <div className="absolute top-3 -left-12 px-1.5 py-0.5 bg-black/80 border border-cyan-500/60 rounded text-[9px] font-mono text-cyan-300 whitespace-nowrap">
                ANALYZED
              </div>
              <div className="absolute top-3 left-3 px-1.5 py-0.5 bg-black/80 border border-slate-700 rounded text-[9px] font-mono text-slate-300 whitespace-nowrap">
                ORIGINAL
              </div>
            </div>
          )}
        </div>

        {/* Scanline & Grid Effect */}
        <div className="scanline" />

        {/* Tech Corner Markers */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/70 backdrop-blur-md rounded border border-cyan-500/30 text-[10px] font-mono text-cyan-300 z-20">
          <Crosshair className="w-3 h-3 text-cyan-400 animate-spin" />
          <span>ROI LOCKED • {analysis.cv_details.dimensions.width}×{analysis.cv_details.dimensions.height}</span>
        </div>

        {/* Cursor Density Telemetry HUD Tooltip */}
        {hoverCoord && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1.5 bg-black/80 backdrop-blur-md rounded-lg border border-cyan-500/40 text-[11px] font-mono text-slate-300 z-20 flex items-center gap-3">
            <div>
              <span className="text-slate-500">POS: </span>
              <span className="text-cyan-400">X:{hoverCoord.x}% Y:{hoverCoord.y}%</span>
            </div>
            <div className="border-l border-slate-700 pl-3">
              <span className="text-slate-500">EST. DENSITY: </span>
              <span className="text-emerald-400 font-bold">{analysis.metrics.density_cm2} /cm²</span>
            </div>
          </div>
        )}
      </div>

      {/* Mode helper text */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span>
          {viewMode === "strands" && "✨ Displaying Zhang-Suen skeletonized hair strands with cyberpunk glow"}
          {viewMode === "heatmap" && "🔥 Follicle concentration heatmap (Turbo spectral gradient)"}
          {viewMode === "split" && "↔ Drag split slider horizontally to compare raw vs analyzed detection"}
          {viewMode === "original" && "👁 Unprocessed input portrait"}
        </span>
        <span className="text-cyan-400/80">
          ROI Area: {analysis.cv_details.roi_area_px.toLocaleString()} px
        </span>
      </div>
    </div>
  );
};
