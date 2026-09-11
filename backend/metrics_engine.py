import math

PERSONAS = [
    {
        "min": 0,
        "max": 0,
        "title": "Clean-Shaven / Smooth Skin",
        "description": "Smooth follicular surface. No visible facial hair filaments detected in the mandibular ROI.",
        "badge": "Level 0 • Clean Shaven",
        "color": "#94a3b8"
    },
    {
        "min": 1,
        "max": 2500,
        "title": "Light Stubble Coverage",
        "description": "Sparse follicular distribution with emerging low-density strand matrix.",
        "badge": "Level 1 • Stubble",
        "color": "#38bdf8"
    },
    {
        "min": 2501,
        "max": 6000,
        "title": "Medium Density Trim",
        "description": "Uniform facial coverage with clearly contoured jawline and cheek margins.",
        "badge": "Level 2 • Defined",
        "color": "#a855f7"
    },
    {
        "min": 6001,
        "max": 11000,
        "title": "Full Follicular Coverage",
        "description": "Dense follicle saturation across jaw, chin, and lower cheek areas.",
        "badge": "Level 3 • Full Beard",
        "color": "#10b981"
    },
    {
        "min": 11001,
        "max": 17000,
        "title": "High-Density Heavy Beard",
        "description": "Extensive multilayered follicle clustering with high volumetric mass.",
        "badge": "Level 4 • Heavy",
        "color": "#f59e0b"
    },
    {
        "min": 17001,
        "max": 999999,
        "title": "Maximum Volumetric Density",
        "description": "Peak follicular density with continuous edge coverage across the entire lower-face perimeter.",
        "badge": "Level 5 • Maximum",
        "color": "#ec4899"
    }
]

SCAN_LOGS = [
    "Calibrating optical follicle sensor...",
    "Isolating lower-face Euclidean manifold (cheeks & jaw)...",
    "Applying multi-scale Black Top-Hat transform...",
    "Analyzing follicular pigmentation contrast against skin...",
    "Eliminating skin pore background noise components...",
    "Executing Zhang-Suen morphological skeletonization...",
    "Calculating bilateral mandibular symmetry equilibrium...",
    "Computing follicle spatial distribution & density matrix...",
    "Synthesizing cyberpunk biometric HUD overlay..."
]

def calculate_beard_metrics(
    raw_hair_count: int, 
    left_hairs: int, 
    right_hairs: int, 
    roi_area_px: int, 
    density_cm2: float = 0.0,
    roi_area_cm2: float = 100.0,
    is_face_detected: bool = True
):
    """
    Computes biometric facial hair metrics based on calibrated CV follicle counts and anatomical ROI metrics.
    Accurately handles clean-shaven / female faces (0 hairs).
    """
    calibrated_count = max(0, int(raw_hair_count))

    # Clean-shaven / female face case
    if calibrated_count == 0:
        return {
            "hair_count": 0,
            "is_face_detected": is_face_detected,
            "is_clean_shaven": True,
            "symmetry": {
                "ratio": 1.0,
                "percentage": 100,
                "left_count": 0,
                "right_count": 0,
                "description": "Uniform Smooth Dermal Matrix"
            },
            "density_equivalence": {
                "alpaca_power": 0.0,
                "unit": "Density Index",
                "wookiee_factor": 0.0,
                "label": "0.00 Index (Smooth)"
            },
            "beard_oil": {
                "microliters": 0.0,
                "drops": 0.0,
                "recommendation": "0 µL (No facial hair detected)"
            },
            "shave_time": {
                "seconds": 0,
                "formatted": "0s",
                "cartridge_wear": 0.0,
                "blade_risk": "None (Clean Shaven)"
            },
            "density_cm2": 0.0,
            "roi_area_cm2": roi_area_cm2,
            "carbon_sequestered_g": 0.0,
            "persona": PERSONAS[0],
            "scan_logs": SCAN_LOGS
        }

    # Left vs Right Mandibular Symmetry
    total_sides = left_hairs + right_hairs
    if total_sides > 0:
        ratio = round(left_hairs / max(1, right_hairs), 2)
        symmetry_pct = max(10, min(100, int(100 - abs(left_hairs - right_hairs) / float(total_sides) * 100)))
    else:
        ratio = 1.0
        symmetry_pct = 95
        
    symmetry_desc = "Symmetric Euclidean Balance" if 0.9 <= ratio <= 1.1 else ("Left-Sided Predominance" if ratio > 1.1 else "Right-Sided Predominance")

    # Density saturation index relative to standard beard coverage (8,500 hairs baseline)
    density_factor = round(calibrated_count / 8500.0, 2)
    
    # Recommended Hydration Formulation (in microliters, 1 drop ≈ 50 µL)
    oil_ul = round(calibrated_count * 0.022 + 15, 1)
    drops = round(oil_ul / 50.0, 1)

    # Estimated Grooming Duration
    shave_seconds = int(calibrated_count * 0.035 + 35)
    cartridges_consumed = round(calibrated_count / 4200.0, 1)

    # Density classification
    density_rating = "Low Density" if calibrated_count < 3000 else ("Medium Density" if calibrated_count < 8500 else "High Density")

    # Select profile
    persona = PERSONAS[1]
    for p in PERSONAS:
        if p["min"] <= calibrated_count <= p["max"]:
            persona = p
            break

    carbon_offset_grams = round(calibrated_count * 0.008, 2)

    return {
        "hair_count": calibrated_count,
        "is_face_detected": is_face_detected,
        "is_clean_shaven": False,
        "symmetry": {
            "ratio": ratio,
            "percentage": symmetry_pct,
            "left_count": left_hairs,
            "right_count": right_hairs,
            "description": symmetry_desc
        },
        "density_equivalence": {
            "alpaca_power": density_factor,
            "unit": "Density Index",
            "wookiee_factor": round(density_factor * 0.38, 3),
            "label": f"{density_factor} Index"
        },
        "beard_oil": {
            "microliters": oil_ul,
            "drops": drops,
            "recommendation": f"{oil_ul} µL (~{drops} drops formulation)"
        },
        "shave_time": {
            "seconds": shave_seconds,
            "formatted": f"{shave_seconds // 60}m {shave_seconds % 60}s",
            "cartridge_wear": cartridges_consumed,
            "blade_risk": density_rating
        },
        "density_cm2": density_cm2,
        "roi_area_cm2": roi_area_cm2,
        "carbon_sequestered_g": carbon_offset_grams,
        "persona": persona,
        "scan_logs": SCAN_LOGS
    }
