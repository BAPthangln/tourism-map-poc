import { Map as MapLibreMap } from 'maplibre-gl';
import {
  LandmarkManifest,
  Place,
  QualityTier,
  SceneState,
  TourRoute,
} from '@tourism-map/shared-types';
import { MapController } from './MapController.js';
import { Landmark3DLayer } from '../layers/Landmark3DLayer.js';
import { POILayer } from '../layers/POILayer.js';
import { RouteLayer } from '../layers/RouteLayer.js';
import { CameraController } from '../animation/CameraController.js';
import { AnimationDirector } from '../animation/AnimationDirector.js';
import { QualityManager } from '../performance/QualityManager.js';
import { PerformanceMonitor } from '../performance/PerformanceMonitor.js';
import { fetchOsrmRoute, OsrmProfile } from '../routing/RoutingService.js';

export interface SceneManagerConfig {
  container: HTMLElement | string;
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  style?: string | import('maplibre-gl').StyleSpecification;
  onSelectPlace?: (place: Place | null) => void;
  onQualityChange?: (tier: QualityTier) => void;
  /** OSRM routing profile. Defaults to 'foot' (walking) for tourism. */
  routingProfile?: OsrmProfile;
}

export class SceneManager {
  public mapController: MapController;
  public landmarkLayer: Landmark3DLayer;
  public poiLayer: POILayer;
  public routeLayer: RouteLayer;
  public cameraController: CameraController | null = null;
  public animationDirector: AnimationDirector | null = null;
  public qualityManager: QualityManager;
  public performanceMonitor: PerformanceMonitor;

  private placesMap = new Map<string, Place>();
  private routesMap = new Map<string, TourRoute>();
  private manifestsMap = new Map<string, LandmarkManifest>();
  private sceneState: SceneState;
  private routingProfile: OsrmProfile;
  /** Abort controller for in-flight OSRM requests */
  private routingAbortController: AbortController | null = null;

  constructor(config: SceneManagerConfig) {
    this.qualityManager = new QualityManager();
    this.performanceMonitor = new PerformanceMonitor();

    this.sceneState = {
      visiblePlaceIds: [],
      quality: this.qualityManager.getTier(),
      cameraMode: 'manual',
    };

    this.routingProfile = config.routingProfile ?? 'foot';

    this.landmarkLayer = new Landmark3DLayer('danang-landmark-layer');
    this.poiLayer = new POILayer({
      onSelectPlace: (place) => {
        this.selectPlace(place.id);
        if (config.onSelectPlace) {
          config.onSelectPlace(place);
        }
      },
    });
    this.routeLayer = new RouteLayer();

    this.mapController = new MapController({
      container: config.container,
      style: config.style,
      center: config.center,
      zoom: config.zoom,
      pitch: config.pitch,
      bearing: config.bearing,
      onUserInteraction: () => {
        // "User interaction wins" -> abort running sequences
        if (this.cameraController && this.cameraController.isRunning()) {
          console.info('[SceneManager] User interaction detected -> cancelling guided sequence.');
          this.cameraController.cancelSequence();
          this.sceneState.cameraMode = 'manual';
        }
      },
      onLoad: () => {
        this.onMapReady();
      },
    });

    // Wire up fallback triggers
    this.landmarkLayer.onFallbackTriggered = (placeId, reason) => {
      console.warn(`[SceneManager] Triggering 2D fallback for ${placeId}: ${reason}`);
      this.poiLayer.setFallbackPlace(placeId, true);
      this.performanceMonitor.setWebGLStatus('fallback_2d');
    };

    // Wire up telemetry
    this.landmarkLayer.onStatsUpdate = (drawCalls, triangles) => {
      this.performanceMonitor.setGLMetrics(drawCalls, triangles);
    };

    // Listen to quality tier changes
    this.qualityManager.subscribe((cfg) => {
      this.sceneState.quality = cfg.tier;
      this.landmarkLayer.setEnabled(cfg.render3D);

      if (!cfg.render3D) {
        // In Low quality tier, flag all 3D landmark places as 2D fallback
        for (const [placeId, manifest] of this.manifestsMap) {
          this.poiLayer.setFallbackPlace(manifest.place_id, true);
        }
      } else {
        this.poiLayer.clearFallbacks();
      }

      this.performanceMonitor.setQuality(cfg.tier);
      if (config.onQualityChange) {
        config.onQualityChange(cfg.tier);
      }
    });
  }

  public init() {
    this.mapController.initialize();
  }

  private onMapReady() {
    const map = this.mapController.getMap();
    if (!map) return;

    // Add 3D Landmark layer
    map.addLayer(this.landmarkLayer);

    // Attach Route layer & POI layer
    this.routeLayer.attach(map);
    this.poiLayer.attach(map);

    // Init CameraController & AnimationDirector
    this.cameraController = new CameraController(map);
    this.animationDirector = new AnimationDirector({
      cameraController: this.cameraController,
      routeLayer: this.routeLayer,
      poiLayer: this.poiLayer,
      placesMap: this.placesMap,
      routesMap: this.routesMap,
      onOpenContent: (placeId) => this.selectPlace(placeId),
      onCloseContent: () => this.selectPlace(null),
    });

    // Populate existing data if loaded beforehand
    this.reloadScene();
  }

  public setPlaces(places: Place[]) {
    this.placesMap.clear();
    for (const p of places) {
      this.placesMap.set(p.id, p);
    }
    this.sceneState.visiblePlaceIds = places.map((p) => p.id);
    this.poiLayer.setPlaces(places);
  }

  public async setLandmarks(manifests: LandmarkManifest[]) {
    this.manifestsMap.clear();
    for (const m of manifests) {
      this.manifestsMap.set(m.id, m);
      await this.landmarkLayer.addLandmark(m);
    }
  }

  public updateLandmarkHeading(landmarkId: string, headingDeg: number) {
    this.landmarkLayer.updateLandmarkHeading(landmarkId, headingDeg);
  }

  public setRoutes(routes: TourRoute[]) {
    this.routesMap.clear();
    for (const r of routes) {
      this.routesMap.set(r.id, r);
    }
  }

  public selectPlace(placeId: string | null) {
    this.sceneState.selectedPlaceId = placeId || undefined;
    this.poiLayer.setSelectedPlace(placeId);

    if (placeId) {
      const place = this.placesMap.get(placeId);
      if (place && this.cameraController) {
        this.cameraController.flyToPlace(place, {
          zoom: place.has_3d_landmark ? 17.2 : 16.5,
          pitch: 60,
          bearing: -15,
        });
      }
    }
  }

  public async startTour(routeId: string) {
    const route = this.routesMap.get(routeId);
    if (!route || !this.cameraController) return;

    this.sceneState.activeRouteId = routeId;
    this.sceneState.cameraMode = 'guided';

    // Cancel any previous in-flight routing request
    this.routingAbortController?.abort();
    this.routingAbortController = new AbortController();

    // Build waypoints from stop place_ids (in sequence order)
    const sortedStops = [...route.stops].sort((a, b) => a.sequence - b.sequence);
    const waypoints: [number, number][] = [];

    for (const stop of sortedStops) {
      const place = this.placesMap.get(stop.place_id);
      if (place?.coordinates) {
        waypoints.push(place.coordinates as [number, number]);
      }
    }

    // Determine effective geometry: OSRM road-snapped or static fallback
    let effectiveRoute = route;

    if (waypoints.length >= 2) {
      try {
        const result = await fetchOsrmRoute(waypoints, {
          profile: this.routingProfile,
          signal: this.routingAbortController.signal,
        });

        // Clone route with OSRM geometry replacing the static LineString
        effectiveRoute = {
          ...route,
          geometry: {
            type: 'LineString',
            coordinates: result.coordinates,
          },
          distance_km: result.distanceKm,
          estimated_duration_min: Math.round(result.durationMin),
        };

        console.info(
          `[SceneManager] OSRM route ready: ${result.distanceKm.toFixed(2)} km, ` +
          `~${Math.round(result.durationMin)} min walking`
        );
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') {
          console.info('[SceneManager] OSRM request aborted — tour cancelled.');
          return;
        }
        console.warn('[SceneManager] OSRM fetch failed, falling back to static geometry:', err);
        // effectiveRoute remains the original static geometry
      }
    } else {
      console.warn('[SceneManager] Not enough waypoints for OSRM routing, using static geometry.');
    }

    // Update route in routesMap so AnimationDirector and TourPanel see the live geometry
    this.routesMap.set(routeId, effectiveRoute);

    // Reveal the road-snapped route line, then start camera sequence
    this.routeLayer.revealRoute(effectiveRoute, 2000, () => {
      this.cameraController?.playTour(effectiveRoute, this.placesMap, { dwellMs: 2500 });
    });
  }

  public stopTour() {
    this.sceneState.activeRouteId = undefined;
    this.sceneState.cameraMode = 'manual';
    // Abort any in-flight OSRM request
    this.routingAbortController?.abort();
    this.routingAbortController = null;
    this.cameraController?.cancelSequence();
    this.routeLayer.hideRoute();
  }

  public setQualityTier(tier: QualityTier) {
    this.qualityManager.setTier(tier);
  }

  public getMap(): MapLibreMap | null {
    return this.mapController.getMap();
  }

  private reloadScene() {
    this.poiLayer.setPlaces(Array.from(this.placesMap.values()));
    for (const manifest of this.manifestsMap.values()) {
      this.landmarkLayer.addLandmark(manifest);
    }
  }

  public destroy() {
    this.performanceMonitor.destroy();
    this.poiLayer.detach();
    this.routeLayer.detach();
    this.mapController.destroy();
  }
}
