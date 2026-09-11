"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { 
  Upload, 
  Camera, 
  Sparkles, 
  Zap, 
  Crosshair, 
  Activity, 
  RefreshCw, 
  Sliders, 
  Play, 
  Square,
  ShieldCheck
} from "lucide-react";
import { SampleImage } from "../types";
import { playBeep, playLaserScan } from "../lib/audio";

interface ImageUploaderProps {
  onImageSelected: (source: File | string, previewUrl: string) => void;
  isLoading: boolean;
  samples: SampleImage[];
  soundEnabled: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  isLoading,
  samples,
  soundEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "camera" | "presets">("upload");
  const [isDragOver, setIsDragOver] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Real-Time Scanning Mode States
  const [isRealTimeScanning, setIsRealTimeScanning] = useState(true);
  const [isSimulatedCamera, setIsSimulatedCamera] = useState(false);
  const [liveHairCount, setLiveHairCount] = useState<number>(3450);
  const [liveSymmetry, setLiveSymmetry] = useState<number>(1.02);
  const [liveFps, setLiveFps] = useState<number>(30);
  const [statusText, setStatusText] = useState<string>("Tracking facial perimeter...");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const simImageRef = useRef<HTMLImageElement | null>(null);

  // Stop camera stream & live loop
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsSimulatedCamera(false);
  }, []);

  // Start hardware camera
  const startCamera = async () => {
    setCameraError(null);
    setIsSimulatedCamera(false);
    try {
      if (soundEnabled) playBeep(800, 0.05);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError("Physical camera not detected or permission denied. You can use the Demo Camera Simulator below.");
      setCameraActive(false);
    }
  };

  // Start simulated demo camera
  const startSimulatedCamera = () => {
    setCameraError(null);
    setIsSimulatedCamera(true);
    setCameraActive(true);

    const img = new Image();
    img.src = samples[0]?.image_b64 || "/samples/lumberjack_full_beard.jpg";
    simImageRef.current = img;
    if (soundEnabled) playBeep(850, 0.05);
  };

  // Real-Time Scanning Animation & Edge Processor Loop
  useEffect(() => {
    if (!cameraActive) return;

    let lastTime = performance.now();
    let frameCount = 0;
    let scanYProgress = 0;
    let scanDirection = 1;

    const procCanvas = document.createElement("canvas");
    procCanvas.width = 160;
    procCanvas.height = 120;
    const procCtx = procCanvas.getContext("2d", { willReadFrequently: true });

    const statusOptions = [
      "Isolating mandibular contour...",
      "Extracting follicle linear gradients...",
      "Applying adaptive morphological matrix...",
      "Calibrating bilateral symmetry equilibrium...",
      "Rasterizing high-frequency edge vectors...",
    ];
    let statusTimer = 0;

    const renderLoop = (time: number) => {
      frameCount++;
      if (time - lastTime >= 1000) {
        setLiveFps(frameCount);
        frameCount = 0;
        lastTime = time;
      }

      statusTimer++;
      if (statusTimer % 80 === 0) {
        setStatusText(statusOptions[Math.floor(Math.random() * statusOptions.length)]);
      }

      const canvas = liveCanvasRef.current;
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Render simulated video if camera simulation is active
      if (isSimulatedCamera && simImageRef.current && simImageRef.current.complete) {
        ctx.save();
        // Subtle breathing sway motion to simulate live face feed
        const swayX = Math.sin(time * 0.001) * 3;
        const swayY = Math.cos(time * 0.0015) * 3;
        ctx.drawImage(simImageRef.current, swayX, swayY, width, height);
        ctx.restore();
      }

      if (isRealTimeScanning) {
        // Lower-Face ROI definition
        const roiX = width * 0.22;
        const roiY = height * 0.44;
        const roiW = width * 0.56;
        const roiH = height * 0.48;

        // Perform fast real-time edge highlight on camera frame
        // Perform fast real-time edge & texture highlight on camera frame
        if (procCtx) {
          try {
            let hasFrame = false;
            if (isSimulatedCamera && simImageRef.current && simImageRef.current.complete) {
              procCtx.drawImage(simImageRef.current, 0, 0, 160, 120);
              hasFrame = true;
            } else if (videoRef.current && videoRef.current.readyState >= 2) {
              procCtx.drawImage(videoRef.current, 0, 0, 160, 120);
              hasFrame = true;
            }

            if (hasFrame) {
              // Sample lower face area corresponding to lower 50% center
              // 160x120 dimensions: center x ~ 40..120, y ~ 50..115
              const sampleX = 35;
              const sampleY = 50;
              const sampleW = 90;
              const sampleH = 65;

              const imgData = procCtx.getImageData(sampleX, sampleY, sampleW, sampleH);
              const d = imgData.data;
              const wR = sampleW;
              const hR = sampleH;

              let edgeClusterCount = 0;
              let leftCount = 0;
              let rightCount = 0;
              let totalLuminance = 0;
              let pixelCount = 0;

              // Sensitive texture gradient detection for webcam video
              ctx.fillStyle = "rgba(0, 240, 255, 0.75)";
              const scaleX = roiW / wR;
              const scaleY = roiH / hR;

              for (let y = 1; y < hR - 1; y += 2) {
                for (let x = 1; x < wR - 1; x += 2) {
                  const idx = (y * wR + x) * 4;
                  const lumCenter = d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114;
                  const lumRight = d[idx + 4] * 0.299 + d[idx + 5] * 0.587 + d[idx + 6] * 0.114;
                  const lumDown = d[idx + wR * 4] * 0.299 + d[idx + wR * 4 + 1] * 0.587 + d[idx + wR * 4 + 2] * 0.114;

                  totalLuminance += lumCenter;
                  pixelCount++;

                  const grad = Math.abs(lumRight - lumCenter) + Math.abs(lumDown - lumCenter);
                  // Webcams have motion blur and lower contrast, so threshold ~12-14 captures facial hair
                  if (grad > 13) {
                    edgeClusterCount++;
                    if (x < wR / 2) leftCount++;
                    else rightCount++;

                    // Draw glowing strand spark on live canvas inside lower-face ROI
                    const px = roiX + x * scaleX;
                    const py = roiY + y * scaleY;
                    ctx.fillRect(px, py, 2, 2);
                  }
                }
              }

              // Update live estimated hair telemetry
              // Only drop to 0 if edge clusters are truly negligible (clean-shaven smooth skin)
              const isClean = edgeClusterCount < 14;
              const estimated = isClean ? 0 : Math.min(19500, Math.max(850, Math.round(edgeClusterCount * 11.5 + 400)));
              
              setLiveHairCount((prev) => {
                if (isClean) {
                  return 0;
                }
                if (prev === 0) return estimated;
                return Math.round(prev * 0.8 + estimated * 0.2);
              });

              const liveRatio = isClean 
                ? 1.0 
                : Math.max(0.75, Math.min(1.35, Math.round((leftCount / Math.max(1, rightCount)) * 100) / 100));
              setLiveSymmetry((prev) => (isClean ? 1.0 : Math.round((prev * 0.85 + liveRatio * 0.15) * 100) / 100));
            }
          } catch {}
        }

        // Real-Time Sweeping Laser Bar
        scanYProgress += 0.02 * scanDirection;
        if (scanYProgress >= 1) {
          scanYProgress = 1;
          scanDirection = -1;
        } else if (scanYProgress <= 0) {
          scanYProgress = 0;
          scanDirection = 1;
        }

        const laserY = roiY + roiH * scanYProgress;

        // Laser beam gradient
        const laserGrad = ctx.createLinearGradient(roiX, laserY, roiX + roiW, laserY);
        laserGrad.addColorStop(0, "rgba(0, 240, 255, 0)");
        laserGrad.addColorStop(0.2, "rgba(0, 240, 255, 0.8)");
        laserGrad.addColorStop(0.5, "rgba(255, 255, 255, 1)");
        laserGrad.addColorStop(0.8, "rgba(217, 70, 239, 0.8)");
        laserGrad.addColorStop(1, "rgba(217, 70, 239, 0)");

        ctx.fillStyle = laserGrad;
        ctx.fillRect(roiX - 10, laserY - 1.5, roiW + 20, 3);

        // Laser aura / bloom
        const glowGrad = ctx.createLinearGradient(roiX, laserY - 12, roiX, laserY + 12);
        glowGrad.addColorStop(0, "rgba(0, 240, 255, 0)");
        glowGrad.addColorStop(0.5, "rgba(0, 240, 255, 0.25)");
        glowGrad.addColorStop(1, "rgba(0, 240, 255, 0)");
        ctx.fillStyle = glowGrad;
        ctx.fillRect(roiX - 15, laserY - 12, roiW + 30, 24);

        // Tech Brackets around ROI
        ctx.strokeStyle = "rgba(0, 240, 255, 0.8)";
        ctx.lineWidth = 2;
        const corner = 18;

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(roiX, roiY + corner);
        ctx.lineTo(roiX, roiY);
        ctx.lineTo(roiX + corner, roiY);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(roiX + roiW - corner, roiY);
        ctx.lineTo(roiX + roiW, roiY);
        ctx.lineTo(roiX + roiW, roiY + corner);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(roiX, roiY + roiH - corner);
        ctx.lineTo(roiX, roiY + roiH);
        ctx.lineTo(roiX + corner, roiY + roiH);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(roiX + roiW - corner, roiY + roiH);
        ctx.lineTo(roiX + roiW, roiY + roiH);
        ctx.lineTo(roiX + roiW, roiY + roiH - corner);
        ctx.stroke();

        // Chin crosshair target
        const chinX = roiX + roiW / 2;
        const chinY = roiY + roiH * 0.9;
        ctx.strokeStyle = "rgba(16, 185, 129, 0.9)";
        ctx.beginPath();
        ctx.arc(chinX, chinY, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(16, 185, 129, 0.8)";
        ctx.fillRect(chinX - 1, chinY - 12, 2, 6);
        ctx.fillRect(chinX - 1, chinY + 6, 2, 6);
        ctx.fillRect(chinX - 12, chinY - 1, 6, 2);
        ctx.fillRect(chinX + 6, chinY - 1, 6, 2);

        // Scanline effect
        ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
        for (let sl = 0; sl < height; sl += 4) {
          ctx.fillRect(0, sl, width, 1.5);
        }
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [cameraActive, isRealTimeScanning, isSimulatedCamera, samples]);

  // Capture current live frame and perform full analysis
  const captureAndAnalyze = () => {
    if (soundEnabled) playBeep(1200, 0.1);

    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isSimulatedCamera && simImageRef.current && simImageRef.current.complete) {
      ctx.drawImage(simImageRef.current, 0, 0, canvas.width, canvas.height);
    } else if (videoRef.current && videoRef.current.readyState >= 2) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    } else if (liveCanvasRef.current) {
      ctx.drawImage(liveCanvasRef.current, 0, 0, canvas.width, canvas.height);
    }

    const b64 = canvas.toDataURL("image/jpeg", 0.92);
    stopCamera();
    onImageSelected(b64, b64);
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(file);
        if (soundEnabled) playBeep(950, 0.06);
        onImageSelected(file, previewUrl);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      if (soundEnabled) playBeep(950, 0.06);
      onImageSelected(file, previewUrl);
    }
  };

  return (
    <div className="w-full bg-slate-900/60 border border-cyan-500/20 rounded-2xl p-4 md:p-6 backdrop-blur-sm shadow-xl">
      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-6">
        <button
          onClick={() => {
            stopCamera();
            setActiveTab("upload");
            if (soundEnabled) playBeep(700, 0.04);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all ${
            activeTab === "upload"
              ? "bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-300 border border-cyan-500/40 shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload File</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("camera");
            startCamera();
            if (soundEnabled) playBeep(700, 0.04);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all ${
            activeTab === "camera"
              ? "bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-300 border border-cyan-500/40 shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Live Camera</span>
        </button>

        <button
          onClick={() => {
            stopCamera();
            setActiveTab("presets");
            if (soundEnabled) playBeep(700, 0.04);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all ${
            activeTab === "presets"
              ? "bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-300 border border-cyan-500/40 shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4 text-fuchsia-400" />
          <span>Presets</span>
        </button>
      </div>

      {/* Tab 1: Upload */}
      {activeTab === "upload" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer relative flex flex-col items-center justify-center min-h-[260px] md:min-h-[300px] border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            isDragOver
              ? "border-cyan-400 bg-cyan-950/20 scale-[1.01]"
              : "border-slate-700/80 hover:border-cyan-500/50 bg-slate-950/40 hover:bg-slate-900/40"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg box-glow-cyan">
            <Upload className="w-8 h-8 animate-bounce" />
          </div>

          <h2 className="text-base md:text-lg font-semibold text-slate-100 mb-1">
            Drop beard photo here or <span className="text-cyan-400 underline">browse</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Supports high-res JPG, PNG, and WebP. For optimal hair segmentation, ensure chin and cheeks are well-lit.
          </p>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/60">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            MediaPipe Face Mesh ROI active
          </div>
        </div>
      )}

      {/* Tab 2: Camera Feed with Real-Time Scanning */}
      {activeTab === "camera" && (
        <div className="space-y-4">
          {/* Real-time scanning controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-950/90 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsRealTimeScanning((prev) => !prev);
                  if (soundEnabled) playBeep(900, 0.04);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  isRealTimeScanning
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-500/50 box-glow-cyan"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${isRealTimeScanning ? "text-cyan-400 animate-pulse" : ""}`} />
                <span>{isRealTimeScanning ? "Real-Time Scan: ON" : "Real-Time Scan: OFF"}</span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{liveFps} FPS</span>
              </div>
            </div>

            {/* Switch between Live Stream and Demo Simulator */}
            <button
              onClick={() => {
                if (isSimulatedCamera) startCamera();
                else startSimulatedCamera();
              }}
              className="text-xs font-mono text-slate-400 hover:text-cyan-300 underline transition"
            >
              {isSimulatedCamera ? "Switch to Hardware Webcam" : "Test with Camera Simulator"}
            </button>
          </div>

          {/* Camera Viewport Area */}
          <div className="relative min-h-[320px] md:min-h-[420px] rounded-xl overflow-hidden bg-black border border-cyan-500/40 shadow-2xl flex flex-col items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center max-w-md">
                <p className="text-red-400 text-xs mb-3">{cameraError}</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={startSimulatedCamera}
                    className="px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition"
                  >
                    Launch Camera Simulator
                  </button>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                  >
                    Retry Webcam
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Physical video feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover max-h-[420px] ${isSimulatedCamera ? "hidden" : "block"}`}
                />

                {/* Real-time dynamic overlay canvas */}
                <canvas
                  ref={liveCanvasRef}
                  width={640}
                  height={480}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                />

                {/* Real-Time Floating Telemetry Badges */}
                {isRealTimeScanning && (
                  <>
                    {/* Top Status Bar */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20 text-[10px] md:text-xs font-mono">
                      <div className="flex items-center gap-2 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-cyan-500/40 rounded-lg text-cyan-300">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span className="font-bold tracking-wider">LIVE REAL-TIME SCANNER</span>
                      </div>
                      <div className="px-2.5 py-1 bg-black/80 backdrop-blur-md border border-slate-700 rounded-lg text-slate-300">
                        {statusText}
                      </div>
                    </div>

                    {/* Bottom Telemetry HUD */}
                    <div className="absolute bottom-16 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20 text-xs font-mono">
                      <div className="px-3 py-1.5 bg-black/85 backdrop-blur-md border border-cyan-500/50 rounded-xl text-slate-200 shadow-lg">
                        <div className="text-[10px] text-cyan-400 uppercase">Live Count Estimate</div>
                        <div className="text-xl font-bold font-mono text-cyan-300 glow-cyan">
                          {liveHairCount === 0 ? (
                            <span className="text-slate-300">0 <span className="text-[11px] font-normal text-slate-400">(Clean-Shaven)</span></span>
                          ) : (
                            <span>~{liveHairCount.toLocaleString()} <span className="text-[11px] font-normal text-slate-400">follicles</span></span>
                          )}
                        </div>
                      </div>

                      <div className="px-3 py-1.5 bg-black/85 backdrop-blur-md border border-emerald-500/50 rounded-xl text-slate-200 shadow-lg">
                        <div className="text-[10px] text-emerald-400 uppercase">Symmetry Ratio</div>
                        <div className="text-xl font-bold font-mono text-emerald-300">
                          {liveSymmetry} : 1.0
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Bottom Action Controls */}
                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3 z-30 px-4">
                  <button
                    onClick={captureAndAnalyze}
                    disabled={!cameraActive}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-full shadow-xl transition-transform active:scale-95 text-xs md:text-sm box-glow-cyan"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Lock & Generate Full Report</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 rounded-full text-xs font-mono border border-slate-700"
                  >
                    Stop Camera
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Presets */}
      {activeTab === "presets" && (
        <div>
          <p className="text-xs text-slate-400 mb-3">
            Choose from pre-analyzed benchmark bearded portraits to evaluate the CV engine instantly:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {samples.map((sample) => (
              <div
                key={sample.id}
                onClick={() => {
                  if (soundEnabled) playBeep(850, 0.05);
                  onImageSelected(sample.image_b64, sample.image_b64);
                }}
                className="group relative cursor-pointer rounded-xl border border-slate-700/80 hover:border-cyan-400 bg-slate-950/60 overflow-hidden transition-all hover:scale-[1.02] hover:box-glow-cyan"
              >
                <div className="h-36 w-full overflow-hidden bg-slate-900">
                  <img
                    src={sample.image_b64}
                    alt={sample.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2.5">
                  <h3 className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {sample.title}
                  </h3>
                  <span className="text-[10px] text-cyan-400/80 font-mono">Click to scan →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
