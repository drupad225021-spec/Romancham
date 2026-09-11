export interface BeardPersona {
  min: number;
  max: number;
  title: string;
  description: string;
  badge: string;
  color: string;
}

export interface BeardMetrics {
  hair_count: number;
  is_face_detected: boolean;
  symmetry: {
    ratio: number;
    percentage: number;
    left_count: number;
    right_count: number;
    description: string;
  };
  density_equivalence: {
    density_factor?: number;
    alpaca_power?: number;
    unit: string;
    wookiee_factor?: number;
    label: string;
  };
  beard_oil: {
    microliters: number;
    drops: number;
    recommendation: string;
  };
  shave_time: {
    seconds: number;
    formatted: string;
    cartridge_wear: number;
    blade_risk: string;
  };
  density_cm2: number;
  carbon_sequestered_g: number;
  persona: BeardPersona;
  scan_logs: string[];
}

export interface CVDetails {
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  dimensions: {
    width: number;
    height: number;
  };
  roi_area_px: number;
  roi_polygon: Array<{ x: number; y: number }>;
}

export interface AnalysisResponse {
  success: boolean;
  metrics: BeardMetrics;
  cv_details: CVDetails;
  overlay_mask_b64: string;
  heatmap_mask_b64: string;
}

export interface SampleImage {
  id: string;
  title: string;
  image_b64: string;
  thumbnailUrl?: string;
}
