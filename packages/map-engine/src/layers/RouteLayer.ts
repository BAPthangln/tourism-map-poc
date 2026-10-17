import { Map as MapLibreMap, GeoJSONSource } from 'maplibre-gl';
import { TourRoute } from '@tourism-map/shared-types';

export class RouteLayer {
  private map: MapLibreMap | null = null;
  private currentRoute: TourRoute | null = null;
  private animFrameId: number | null = null;
  private sourceId = 'tour-route-source';
  private casingLayerId = 'tour-route-casing';
  private lineLayerId = 'tour-route-line';

  public attach(map: MapLibreMap) {
    this.map = map;
    this.setupLayers();
  }

  private setupLayers() {
    if (!this.map) return;

    if (!this.map.getSource(this.sourceId)) {
      this.map.addSource(this.sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });
    }

    if (!this.map.getLayer(this.casingLayerId)) {
      this.map.addLayer({
        id: this.casingLayerId,
        type: 'line',
        source: this.sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': 7,
          'line-opacity': 0.9,
        },
      });
    }

    if (!this.map.getLayer(this.lineLayerId)) {
      this.map.addLayer({
        id: this.lineLayerId,
        type: 'line',
        source: this.sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#e11d48', // rose-600 vibrant tourism accent
          'line-width': 4.5,
          'line-opacity': 0.95,
        },
      });
    }
  }

  public revealRoute(route: TourRoute, durationMs = 1500, onComplete?: () => void) {
    if (!this.map) return;
    this.currentRoute = route;
    this.cancelAnimation();

    const coordinates = route.geometry.coordinates;
    if (coordinates.length === 0) return;

    if (durationMs <= 0) {
      this.updateSource(coordinates);
      if (onComplete) onComplete();
      return;
    }

    const startTime = performance.now();
    const totalPoints = coordinates.length;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1.0);
      const pointsToShow = Math.max(2, Math.floor(progress * totalPoints));

      const currentPoints = coordinates.slice(0, pointsToShow);
      this.updateSource(currentPoints);

      if (progress < 1.0) {
        this.animFrameId = requestAnimationFrame(animate);
      } else {
        this.animFrameId = null;
        if (onComplete) onComplete();
      }
    };

    this.animFrameId = requestAnimationFrame(animate);
  }

  public hideRoute() {
    this.cancelAnimation();
    this.currentRoute = null;
    this.updateSource([]);
  }

  private updateSource(coords: [number, number][]) {
    if (!this.map) return;
    const source = this.map.getSource(this.sourceId) as GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: coords.length > 1 ? [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coords,
            },
            properties: {},
          },
        ] : [],
      });
    }
  }

  public cancelAnimation() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public detach() {
    this.cancelAnimation();
    if (this.map) {
      if (this.map.getLayer(this.lineLayerId)) this.map.removeLayer(this.lineLayerId);
      if (this.map.getLayer(this.casingLayerId)) this.map.removeLayer(this.casingLayerId);
      if (this.map.getSource(this.sourceId)) this.map.removeSource(this.sourceId);
    }
    this.map = null;
  }
}
