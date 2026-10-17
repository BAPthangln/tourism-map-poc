import maplibregl, { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { Place } from '@tourism-map/shared-types';

export interface POILayerConfig {
  onSelectPlace?: (place: Place) => void;
}

export class POILayer {
  private map: MapLibreMap | null = null;
  private markers = new Map<string, Marker>();
  private places: Place[] = [];
  private selectedPlaceId: string | null = null;
  private fallbackPlaceIds = new Set<string>();
  private config: POILayerConfig;

  constructor(config: POILayerConfig = {}) {
    this.config = config;
  }

  public attach(map: MapLibreMap) {
    this.map = map;
    this.renderMarkers();
  }

  public setPlaces(places: Place[]) {
    this.places = places;
    this.renderMarkers();
  }

  public setSelectedPlace(placeId: string | null) {
    this.selectedPlaceId = placeId;
    this.updateMarkerStyles();
  }

  public setFallbackPlace(placeId: string, isFallback: boolean) {
    if (isFallback) {
      this.fallbackPlaceIds.add(placeId);
    } else {
      this.fallbackPlaceIds.delete(placeId);
    }
    this.updateMarkerStyles();
  }

  public clearFallbacks() {
    this.fallbackPlaceIds.clear();
    this.updateMarkerStyles();
  }

  private renderMarkers() {
    if (!this.map) return;

    // Clear existing markers
    for (const marker of this.markers.values()) {
      marker.remove();
    }
    this.markers.clear();

    // Render new markers
    for (const place of this.places) {
      const el = this.createMarkerElement(place);
      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat(place.coordinates)
        .addTo(this.map);

      this.markers.set(place.id, marker);
    }
  }

  private createMarkerElement(place: Place): HTMLElement {
    const el = document.createElement('div');
    el.className = `poi-marker-container poi-category-${place.category}`;
    el.setAttribute('data-place-id', place.id);

    this.applyMarkerContent(el, place);

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.config.onSelectPlace) {
        this.config.onSelectPlace(place);
      }
    });

    return el;
  }

  private applyMarkerContent(el: HTMLElement, place: Place) {
    const isSelected = place.id === this.selectedPlaceId;
    const isFallback = this.fallbackPlaceIds.has(place.id);

    let iconSvg = '';
    if (isFallback || place.has_3d_landmark) {
      // 3D Landmark or 2D fallback icon
      iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`;
    } else if (place.category === 'bridge') {
      iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"></path><path d="M4 10h16"></path><path d="M8 10v9"></path><path d="M16 10v9"></path></svg>`;
    } else if (place.category === 'culture') {
      iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 21h18"></path><path d="M5 21V9l7-6 7 6v12"></path><path d="M9 21v-6a3 3 0 0 1 6 0v6"></path></svg>`;
    } else if (place.category === 'food') {
      iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`;
    } else {
      iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`;
    }

    const badge3d = isFallback
      ? `<span class="badge-fallback">2D Fallback</span>`
      : place.has_3d_landmark
      ? `<span class="badge-3d">3D</span>`
      : '';

    el.innerHTML = `
      <div class="poi-marker ${isSelected ? 'poi-selected' : ''} ${isFallback ? 'poi-fallback' : ''}">
        <div class="poi-icon-box">
          ${iconSvg}
        </div>
        <div class="poi-label">
          <span class="poi-name">${place.name}</span>
          ${badge3d}
        </div>
      </div>
    `;
  }

  private updateMarkerStyles() {
    for (const place of this.places) {
      const marker = this.markers.get(place.id);
      if (marker) {
        const el = marker.getElement();
        this.applyMarkerContent(el, place);
      }
    }
  }

  public detach() {
    for (const marker of this.markers.values()) {
      marker.remove();
    }
    this.markers.clear();
    this.map = null;
  }
}
