"use client";

import React, { useRef, useState } from "react";
import { X, Download, Share2, Check, Printer, ShieldCheck, Sparkles } from "lucide-react";
import { AnalysisResponse } from "@/types";
import { playBeep } from "@/lib/audio";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResponse;
  imagePreviewUrl: string;
  soundEnabled: boolean;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  analysis,
  imagePreviewUrl,
  soundEnabled,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const { metrics, cv_details } = analysis;
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCopyLink = () => {
    if (soundEnabled) playBeep(850, 0.05);
    navigator.clipboard.writeText(
      `🧔‍♂️ Romancham Audit: ${metrics.hair_count.toLocaleString()} hairs detected. Profile: ${metrics.persona.title} (${metrics.density_cm2} hairs/cm²). Verified at ${window.location.href}`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    if (soundEnabled) playBeep(900, 0.05);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#080b14] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Topbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs font-semibold text-cyan-300 uppercase tracking-wider">
              Follicle Verification Certificate #BC-{Math.floor(Math.random() * 89999 + 10000)}
            </span>
          </div>
          <button
            onClick={() => {
              if (soundEnabled) playBeep(600, 0.04);
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Certificate Area */}
        <div ref={reportRef} className="p-6 overflow-y-auto space-y-5 bg-[#080b14] text-slate-200">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-cyan-500/20 pb-4">
            <div>
              <h2 className="text-xl font-black tracking-wider text-cyan-400 font-mono">
                ROMANCHAM<span className="text-white">.AI</span> REPORT
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Certified Computer Vision Biometric Analysis • MediaPipe + OpenCV
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono justify-end">
                <ShieldCheck className="w-4 h-4" />
                <span>HASH VERIFIED</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{dateStr}</span>
            </div>
          </div>

          {/* Subject Preview & Hair Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div className="relative h-28 w-28 rounded-lg overflow-hidden border border-cyan-500/40 mx-auto sm:mx-0">
              <img src={imagePreviewUrl} alt="Subject" className="w-full h-full object-cover" />
              <img
                src={analysis.overlay_mask_b64}
                alt="Mask overlay"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="sm:col-span-2 text-center sm:text-left">
              <div className="text-xs text-slate-400 font-mono uppercase">Detected Follicle Count</div>
              <div className="text-4xl font-black text-cyan-300 font-mono glow-cyan">
                {metrics.hair_count.toLocaleString()} <span className="text-lg font-normal text-slate-400">hairs</span>
              </div>
              <div className="text-xs font-semibold mt-1" style={{ color: metrics.persona.color }}>
                {metrics.persona.badge} — {metrics.persona.title}
              </div>
              <p className="text-[11px] text-slate-400 italic mt-0.5">&quot;{metrics.persona.description}&quot;</p>
            </div>
          </div>

          {/* Biometric Telemetry Audit Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden text-xs font-mono">
            <div className="bg-slate-900/90 px-4 py-2 text-cyan-400 font-bold uppercase tracking-wider border-b border-slate-800">
              Biometric Follicle Telemetry
            </div>
            <div className="divide-y divide-slate-800/60 bg-slate-950/60">
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-slate-400">Follicle Density Index</span>
                <span className="font-bold text-cyan-300">{metrics.density_equivalence.label}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-slate-400">Left vs Right Jaw Symmetry</span>
                <span className="font-bold text-emerald-300">{metrics.symmetry.ratio}:1 ({metrics.symmetry.description})</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-slate-400">Hydration Formulation</span>
                <span className="font-bold text-amber-300">{metrics.beard_oil.microliters} µL (~{metrics.beard_oil.drops} drops)</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-slate-400">Estimated Grooming Time</span>
                <span className="font-bold text-red-300">{metrics.shave_time.formatted} ({metrics.shave_time.blade_risk})</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-slate-400">Follicle Density</span>
                <span className="font-bold text-slate-200">{metrics.density_cm2} hairs / cm²</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-slate-400">Annual Carbon Offset</span>
                <span className="font-bold text-emerald-400">{metrics.carbon_sequestered_g} grams CO₂</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-[10px] text-slate-500 font-mono text-center pt-2">
            Generated by Romancham AI CV-Engine • Morphological Thinning algorithm calibrated for human facial hair.
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 rounded-lg hover:bg-cyan-900/60 transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Copied Link!" : "Share Result"}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
