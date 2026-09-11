import { AnalysisResponse, SampleImage } from "../types";

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname || "localhost";
    return `http://${host}:8000`;
  }
  return "http://localhost:8000";
};

export async function checkBackendHealth(): Promise<{ healthy: boolean; latencyMs: number }> {
  const start = performance.now();
  const backendUrl = getBackendUrl();
  try {
    // Try proxy first
    let res = await fetch("/api/py/health").catch(() => null);
    if (!res || !res.ok) {
      // Fallback to direct backend URL
      res = await fetch(`${backendUrl}/health`);
    }
    const data = await res.json();
    const latencyMs = Math.round(performance.now() - start);
    return { healthy: data.status === "healthy", latencyMs };
  } catch {
    return { healthy: false, latencyMs: 0 };
  }
}

export async function analyzeBeardImage(
  imageSource: File | string
): Promise<AnalysisResponse> {
  // If imageSource is a URL string (e.g. /samples/...), fetch and convert to File
  if (typeof imageSource === "string" && (imageSource.startsWith("/") || imageSource.startsWith("http"))) {
    try {
      const imgRes = await fetch(imageSource);
      const blob = await imgRes.blob();
      imageSource = new File([blob], "sample.jpg", { type: blob.type || "image/jpeg" });
    } catch (e) {
      console.error("Failed to load image from URL:", e);
    }
  }

  const backendUrl = getBackendUrl();
  const endpoints = ["/api/py/analyze-beard", `${backendUrl}/api/analyze-beard`];

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      let response: Response;

      if (typeof imageSource === "string") {
        // Base64 payload
        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: imageSource }),
        });
      } else {
        // File upload
        const formData = new FormData();
        formData.append("file", imageSource);
        response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      const data: AnalysisResponse = await response.json();
      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Try next endpoint
    }
  }

  throw lastError || new Error("Failed to connect to computer vision backend.");
}

export async function fetchSampleImages(): Promise<SampleImage[]> {
  try {
    const backendUrl = getBackendUrl();
    const endpoints = ["/api/py/samples", `${backendUrl}/api/samples`];
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep);
        if (res.ok) {
          const data = await res.json();
          if (data.samples && data.samples.length > 0) {
            return data.samples;
          }
        }
      } catch {}
    }
  } catch {}

  // Fallback preset samples from public folder
  return [
    {
      id: "lumberjack_full_beard",
      title: "Full Density Beard",
      image_b64: "/samples/lumberjack_full_beard.jpg",
    },
    {
      id: "designer_stubble",
      title: "Designer Stubble",
      image_b64: "/samples/designer_stubble.jpg",
    },
    {
      id: "classic_boxed_beard",
      title: "Classic Boxed Beard",
      image_b64: "/samples/classic_boxed_beard.jpg",
    },
  ];
}
