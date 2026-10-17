// Phase 0 & PoC Shared Types
export type QualityTier = 'low' | 'medium' | 'high';

export interface SceneState {
  selectedPlaceId?: string;
  visiblePlaceIds: string[];
  activeRouteId?: string;
  quality: QualityTier;
  cameraMode: 'manual' | 'guided';
  activeSequenceId?: string;
}

export interface LandmarkPosition {
  lng: number;
  lat: number;
  altitude_m: number;
}

export interface LandmarkManifest {
  id: string;
  place_id: string;
  name: string;
  asset_url: string;
  asset_version: number;
  position: LandmarkPosition;
  heading_deg: number;
  pitch_deg?: number;
  roll_deg?: number;
  scale_m: number;
  origin: 'bottom_center' | 'center' | 'ground_surface';
  min_zoom: number;
  max_zoom: number;
  fallback_icon: string;
  license_id: string;
}

export type MapAction =
  | { type: 'camera.flyTo'; placeId: string; zoom?: number; pitch?: number; bearing?: number; durationMs?: number }
  | { type: 'camera.fitBounds'; bounds: [number, number, number, number]; durationMs?: number }
  | { type: 'camera.easeTo'; center: [number, number]; zoom?: number; pitch?: number; bearing?: number; durationMs?: number }
  | { type: 'marker.highlight'; placeIds: string[] }
  | { type: 'marker.reveal'; placeIds: string[] }
  | { type: 'marker.clear' }
  | { type: 'route.reveal'; routeId: string; durationMs: number }
  | { type: 'route.hide'; routeId: string }
  | { type: 'content.open'; placeId: string }
  | { type: 'content.close' }
  | { type: 'sequence.cancel' };

export interface SourceEvidence {
  id?: string;
  source_url?: string;
  publisher: string;
  checked_at: string;
  rights?: string;
}

export interface Place {
  id: string;
  destination_id: string;
  name: string;
  category: 'landmark' | 'bridge' | 'culture' | 'food' | 'nature' | 'entertainment';
  coordinates: [number, number]; // [lng, lat]
  altitude_m?: number;
  rating?: number;
  thumbnail_url?: string;
  summary: string;
  description: string;
  address: string;
  open_hours?: string;
  ticket_price?: string;
  source_evidence: SourceEvidence;
  has_3d_landmark?: boolean;
  landmark_id?: string;
}

export interface TourStop {
  place_id: string;
  sequence: number;
  dwell_minutes: number;
  note?: string;
}

export interface TourRoute {
  id: string;
  destination_id: string;
  name: string;
  description: string;
  estimated_duration_min: number;
  distance_km: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  stops: TourStop[];
}

export interface PerformanceMetrics {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  webglStatus: 'normal' | 'context_lost' | 'fallback_2d';
  quality: QualityTier;
}
