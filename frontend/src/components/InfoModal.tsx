"use client";

import React from "react";
import { X, Cpu, Eye, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";
import { playBeep } from "../lib/audio";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, soundEnabled }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#080b14] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Topbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs font-semibold text-cyan-300 uppercase tracking-wider">
              Computer Vision Pipeline Architecture
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300 font-sans leading-relaxed">
          <p className="text-slate-300">
            <strong>Romancham</strong> leverages a hybrid deep learning + classical morphological computer vision pipeline designed for real-time edge follicle detection.
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <div className="font-mono text-cyan-300 font-bold mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-400 text-[10px] flex items-center justify-center text-cyan-400">1</span>
                MediaPipe 468-Point Face Mesh ROI
              </div>
              <p className="text-slate-400 text-[11px]">
                Identifies lower-face boundaries (jawline contour landmarks 234 to 454, chin 152, cheeks 58/288) while excising lips and oral cavities to prevent false follicle artifacts.
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <div className="font-mono text-cyan-300 font-bold mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-400 text-[10px] flex items-center justify-center text-cyan-400">2</span>
                CLAHE & Bilateral Texture Smoothing
              </div>
              <p className="text-slate-400 text-[11px]">
                Applies Contrast-Limited Adaptive Histogram Equalization (clip limit 3.5) to amplify subtle dark hair filaments against skin, paired with bilateral filtering to smooth skin pores.
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <div className="font-mono text-cyan-300 font-bold mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-400 text-[10px] flex items-center justify-center text-cyan-400">3</span>
                Zhang-Suen Morphological Skeletonization
              </div>
              <p className="text-slate-400 text-[11px]">
                Reduces detected hair contours to exactly 1-pixel-wide topological skeletons via OpenCV thinning (<code className="text-fuchsia-300">cv2.ximgproc.thinning</code>), stripping line thickness.
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <div className="font-mono text-cyan-300 font-bold mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-400 text-[10px] flex items-center justify-center text-cyan-400">4</span>
                Connected Component & Symmetry Analysis
              </div>
              <p className="text-slate-400 text-[11px]">
                Filters noise blobs (&lt; 3px sensor artifacts) and runs connected component labeling across the facial midline to output Left vs Right jaw symmetry and calibrated hair counts.
              </p>
            </div>
          </div>

          <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-[11px] text-cyan-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              All follicle metrics and density analytics are mathematically scaled to calibrated human beard densities (~7,000 to 25,000 hairs).
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
