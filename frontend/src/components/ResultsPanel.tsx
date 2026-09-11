"use client";

import React, { useEffect, useState } from "react";
import { 
  Sparkles, 
  Scale, 
  Droplet, 
  Timer, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  RefreshCw,
  Award,
  Zap,
  Leaf,
  Scissors
} from "lucide-react";
import { AnalysisResponse } from "@/types";
import { playBeep, playSuccessChime } from "@/lib/audio";
import confetti from "canvas-confetti";

interface ResultsPanelProps {
  analysis: AnalysisResponse;
  onReset: () => void;
  onOpenReport: () => void;
  soundEnabled: boolean;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  analysis,
  onReset,
  onOpenReport,
  soundEnabled,
}) => {
  const { metrics, cv_details } = analysis;
  const [displayCount, setDisplayCount] = useState(0);
  const [copied, setCopied] = useState(false);

  // Animated digit counter effect
  useEffect(() => {
    let start = 0;
    const end = metrics.hair_count;
    const duration = 1200; // ms
    const stepTime = 25;
    const totalSteps = duration / stepTime;
    const increment = Math.ceil(end / totalSteps);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayCount(end);
        clearInterval(timer);
        if (soundEnabled) playSuccessChime();
        // Trigger celebratory confetti for high follicle count!
        if (end > 3000) {
          try {
            confetti({
              particleCount: 40,
              spread: 60,
              origin: { y: 0.7 },
              colors: ["#00f0ff", "#d946ef", "#10b981"],
            });
          } catch {}
        }
      } else {
        setDisplayCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [metrics.hair_count, soundEnabled]);

  const copyTelemetry = () => {
    if (soundEnabled) playBeep(850, 0.05);
    navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col gap-5 bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-5 md:p-6 backdrop-blur-sm shadow-xl">
      {/* Total Hair Count Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/30 p-6 text-center box-glow-cyan">
        <div className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 rounded">
          {metrics.is_face_detected ? "Mesh Verified" : "Adaptive ROI Fallback"}
        </div>

        <div className="text-xs font-mono text-cyan-400/90 tracking-widest uppercase mb-1">
          Total Estimated Beard Hairs
        </div>

        {/* Big Neon Digit */}
        <div className="text-5xl md:text-6xl font-black tracking-tight font-mono bg-gradient-to-r from-cyan-300 via-white to-fuchsia-400 bg-clip-text text-transparent glow-cyan my-1">
          {displayCount.toLocaleString()}
        </div>

        <div className="flex items-center justify-center gap-3 text-xs text-slate-400 font-mono mt-2">
          <span>Density: <strong className="text-cyan-300">{metrics.density_cm2} /cm²</strong></span>
          <span>•</span>
          <span>
            {metrics.hair_count === 0 ? (
              <strong className="text-emerald-300">Clean Shaven / Smooth Dermal Matrix</strong>
            ) : (
              <>Follicle Coverage: <strong className="text-emerald-300">{metrics.symmetry.percentage}% symmetry</strong></>
            )}
          </span>
        </div>
      </div>

      {/* Follicle Density Profile Badge */}
      <div 
        className="rounded-xl border p-4 bg-slate-950/60 transition-all"
        style={{ borderColor: `${metrics.persona.color}60` }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4" style={{ color: metrics.persona.color }} />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Follicle Density Profile</span>
          </div>
          <span 
            className="text-xs font-mono px-2 py-0.5 rounded border"
            style={{ 
              borderColor: `${metrics.persona.color}80`, 
              backgroundColor: `${metrics.persona.color}20`,
              color: metrics.persona.color 
            }}
          >
            {metrics.persona.badge}
          </span>
        </div>
        <h3 className="text-lg font-bold text-slate-100 mb-1" style={{ color: metrics.persona.color }}>
          {metrics.persona.title}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {metrics.persona.description}
        </p>
      </div>

      {/* Biometric Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Metric 1: Follicle Density Index */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-mono font-semibold uppercase">Density Index</span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-200">
            {metrics.density_equivalence.label}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Standardized density factor relative to baseline coverage.
          </p>
        </div>

        {/* Metric 2: Left vs Right Jaw Symmetry */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <Scale className="w-4 h-4" />
            <span className="text-xs font-mono font-semibold uppercase">Jawline Symmetry</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-200">
            {metrics.symmetry.ratio} : 1.0
          </div>
          {/* Visual Balance Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full my-1.5 overflow-hidden flex">
            <div 
              className="bg-cyan-400 h-full transition-all" 
              style={{ width: `${metrics.hair_count === 0 ? 50 : (metrics.symmetry.left_count / Math.max(1, metrics.symmetry.left_count + metrics.symmetry.right_count)) * 100}%` }}
              title={`Left: ${metrics.symmetry.left_count} hairs`}
            />
            <div 
              className="bg-fuchsia-400 h-full transition-all" 
              style={{ width: `${metrics.hair_count === 0 ? 50 : (metrics.symmetry.right_count / Math.max(1, metrics.symmetry.left_count + metrics.symmetry.right_count)) * 100}%` }}
              title={`Right: ${metrics.symmetry.right_count} hairs`}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {metrics.symmetry.description} ({metrics.symmetry.left_count} L / {metrics.symmetry.right_count} R).
          </p>
        </div>

        {/* Metric 3: Hydration Formulation */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Droplet className="w-4 h-4" />
            <span className="text-xs font-mono font-semibold uppercase">Hydration Formulation</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-200">
            {metrics.beard_oil.microliters} µL
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Recommended dose: <strong className="text-amber-300">~{metrics.beard_oil.drops} drops</strong> for follicle nourishment.
          </p>
        </div>

        {/* Metric 4: Estimated Grooming Time */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <Timer className="w-4 h-4" />
            <span className="text-xs font-mono font-semibold uppercase">Estimated Grooming Time</span>
          </div>
          <div className="text-2xl font-bold font-mono text-red-200">
            {metrics.shave_time.formatted}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Duration for standard maintenance trim ({metrics.shave_time.blade_risk}).
          </p>
        </div>
      </div>

      {/* Bonus Dev Metrics */}
      <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Leaf className="w-3.5 h-3.5 text-emerald-400" />
          <span>Carbon Offset: <strong className="text-emerald-300">{metrics.carbon_sequestered_g}g CO₂</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>OpenCV Thinning: <strong className="text-cyan-300">1-pixel kernel</strong></span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
        <button
          onClick={() => {
            if (soundEnabled) playBeep(900, 0.05);
            onOpenReport();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-[0.98] text-sm box-glow-cyan"
        >
          <Download className="w-4 h-4" />
          <span>Download Analysis Report</span>
        </button>

        <button
          onClick={copyTelemetry}
          className="flex items-center justify-center gap-1.5 py-3 px-4 bg-slate-950/90 hover:bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-mono transition-colors"
          title="Copy full telemetry JSON payload"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? "Copied JSON!" : "Copy JSON"}</span>
        </button>

        <button
          onClick={() => {
            if (soundEnabled) playBeep(650, 0.05);
            onReset();
          }}
          className="flex items-center justify-center gap-1.5 py-3 px-4 bg-slate-950/90 hover:bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-mono transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>New Face</span>
        </button>
      </div>
    </div>
  );
};
