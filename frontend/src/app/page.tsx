"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { ImageUploader } from "../components/ImageUploader";
import { ScanningHUD } from "../components/ScanningHUD";
import { ScanOverlay } from "../components/ScanOverlay";
import { ResultsPanel } from "../components/ResultsPanel";
import { ReportModal } from "../components/ReportModal";
import { InfoModal } from "../components/InfoModal";
import { analyzeBeardImage, fetchSampleImages } from "../lib/api";
import { AnalysisResponse, SampleImage } from "../types";
import { playBeep } from "../lib/audio";
import { Sparkles, Cpu, Scan, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export default function Home() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [samples, setSamples] = useState<SampleImage[]>([]);
  const [selectedImageSource, setSelectedImageSource] = useState<File | string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Load sample presets on mount
  useEffect(() => {
    fetchSampleImages().then((data) => setSamples(data));
  }, []);

  const handleImageSelected = async (source: File | string, previewUrl: string) => {
    setSelectedImageSource(source);
    setImagePreviewUrl(previewUrl);
    setError(null);
    setIsScanning(true);

    try {
      // Artificial delay so user can enjoy the laser scan and faux terminal logs if API returns too fast
      const [result] = await Promise.all([
        analyzeBeardImage(source),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);

      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process image with Computer Vision backend."
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setSelectedImageSource(null);
    setImagePreviewUrl(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080b12] text-slate-100 cyber-grid relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Navbar */}
      <Navbar
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenInfo={() => setShowInfo(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 md:py-8 flex flex-col gap-6">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center justify-between p-4 bg-red-950/40 border border-red-500/50 rounded-xl text-red-200 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => {
                if (selectedImageSource && imagePreviewUrl) {
                  handleImageSelected(selectedImageSource, imagePreviewUrl);
                }
              }}
              className="flex items-center gap-1 px-3 py-1 bg-red-900/60 hover:bg-red-800/80 rounded-lg text-xs font-mono text-white transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* State 1: Idle (No image or results yet) */}
        {!isScanning && !analysis && (
          <div className="flex flex-col items-center gap-8 py-4 md:py-8">
            {/* Hero Title & Subtitle */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Next-Gen Facial Hair Topological Analyzer</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Quantify Every Single <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 bg-clip-text text-transparent glow-cyan">
                  Facial Hair Follicle
                </span>
              </h1>

              <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
                Powered by <strong>MediaPipe 468-point Face Mesh</strong> ROI segmentation,
                <strong> OpenCV CLAHE</strong>, and <strong>Zhang-Suen morphological skeletonization</strong>.
                Upload a portrait or use your camera to calculate comprehensive biometric beard analytics.
              </p>
            </div>

            {/* Upload Component */}
            <div className="w-full max-w-2xl">
              <ImageUploader
                onImageSelected={handleImageSelected}
                isLoading={isScanning}
                samples={samples}
                soundEnabled={soundEnabled}
              />
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl pt-4">
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                  <Scan className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 font-mono uppercase">1-Pixel Thinning</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Zhang-Suen morphological erosion reduces complex beard hair strands to single-pixel vectors.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm flex items-start gap-3">
                <div className="p-2 rounded-lg bg-fuchsia-950/60 border border-fuchsia-500/30 text-fuchsia-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 font-mono uppercase">Cheek & Jaw ROI</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Automated oral cavity cutout prevents false follicle detection on lips or teeth.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 font-mono uppercase">Biometric Telemetry</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Calculates follicle density per cm², topological symmetry, and facial coverage index.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State 2: Scanning In Progress */}
        {isScanning && imagePreviewUrl && (
          <div className="w-full max-w-3xl mx-auto py-6">
            <ScanningHUD
              imagePreviewUrl={imagePreviewUrl}
              soundEnabled={soundEnabled}
            />
          </div>
        )}

        {/* State 3: Results Dashboard & Interactive Canvas Overlay */}
        {!isScanning && analysis && imagePreviewUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Canvas & Cyberpunk Layer Controls (7 cols) */}
            <div className="lg:col-span-7">
              <ScanOverlay
                imagePreviewUrl={imagePreviewUrl}
                analysis={analysis}
                soundEnabled={soundEnabled}
              />
            </div>

            {/* Right Column: Hair Count, Profile, and Biometric Metrics Dashboard (5 cols) */}
            <div className="lg:col-span-5">
              <ResultsPanel
                analysis={analysis}
                onReset={handleReset}
                onOpenReport={() => setShowReport(true)}
                soundEnabled={soundEnabled}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500 font-mono">
        <p>
          Romancham • Built with Next.js, Tailwind CSS, FastAPI, MediaPipe Face Mesh & OpenCV 5.0
        </p>
      </footer>

      {/* Report Modal */}
      {analysis && imagePreviewUrl && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          analysis={analysis}
          imagePreviewUrl={imagePreviewUrl}
          soundEnabled={soundEnabled}
        />
      )}

      {/* Info Architecture Modal */}
      <InfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        soundEnabled={soundEnabled}
      />
    </div>
  );
}
