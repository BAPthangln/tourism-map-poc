import maplibregl, { Map as MapLibreMap, MapOptions, StyleSpecification } from 'maplibre-gl';

export interface MapControllerConfig {
  container: HTMLElement | string;
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  style?: string | StyleSpecification;
  onUserInteraction?: () => void;
  onLoad?: () => void;
}

// Tourism themed raster basemap configuration (Esri World Street Map - warm pastel travel palette, no API key required)
export const DEFAULT_TOURISMAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'tourism-basemap': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [
    {
      id: 'tourism-basemap-layer',
      type: 'raster',
      source: 'tourism-basemap',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

export interface TileProviderOptions {
  provider?: 'esri' | 'osm' | 'maptiler' | 'carto' | string;
  maptilerKey?: string;
  cartoKey?: string;
  mapboxToken?: string;
}

export function createTourismMapStyle(options: TileProviderOptions = {}): StyleSpecification | string {
  const provider = options.provider || 'esri';

  if (provider === 'maptiler' && options.maptilerKey) {
    return `https://api.maptiler.com/maps/voyager/style.json?key=${options.maptilerKey}`;
  }

  if (provider === 'carto' && options.cartoKey) {
    return {
      version: 8,
      sources: {
        'tourism-basemap': {
          type: 'raster',
          tiles: [
            `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png?api_key=${options.cartoKey}`,
          ],
          tileSize: 256,
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        },
      },
      layers: [
        {
          id: 'tourism-basemap-layer',
          type: 'raster',
          source: 'tourism-basemap',
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    };
  }

  if (provider === 'osm') {
    return {
      version: 8,
      sources: {
        'osm-basemap': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
      },
      layers: [
        {
          id: 'osm-basemap-layer',
          type: 'raster',
          source: 'osm-basemap',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    };
  }

  // Default: Esri World Street Map (Free, pastel travel palette, no API key required)
  return DEFAULT_TOURISMAP_STYLE;
}

export class MapController {
  private map: MapLibreMap | null = null;
  private config: MapControllerConfig;
  private isUserInteracting = false;

  constructor(config: MapControllerConfig) {
    this.config = config;
  }

  public initialize(): MapLibreMap {
    const center = this.config.center || [108.2255, 16.0610]; // Da Nang Sông Hàn
    const zoom = this.config.zoom ?? 15.5;
    const pitch = this.config.pitch ?? 50;
    const bearing = this.config.bearing ?? -15;

    const mapOptions: MapOptions = {
      container: this.config.container,
      style: this.config.style || DEFAULT_TOURISMAP_STYLE,
      center,
      zoom,
      pitch,
      bearing,
      maxPitch: 75,
      antialias: true,
      attributionControl: { compact: true },
    };

    this.map = new maplibregl.Map(mapOptions);

    this.bindInteractionEvents();

    if (this.config.onLoad) {
      this.map.on('load', this.config.onLoad);
    }

    return this.map;
  }

  private bindInteractionEvents() {
    if (!this.map) return;

    const notifyUserInteraction = () => {
      this.isUserInteracting = true;
      if (this.config.onUserInteraction) {
        this.config.onUserInteraction();
      }
    };

    this.map.on('dragstart', notifyUserInteraction);
    this.map.on('zoomstart', notifyUserInteraction);
    this.map.on('rotatestart', notifyUserInteraction);
    this.map.on('pitchstart', notifyUserInteraction);
    this.map.on('touchstart', notifyUserInteraction);

    this.map.on('moveend', () => {
      this.isUserInteracting = false;
    });
  }

  public getMap(): MapLibreMap | null {
    return this.map;
  }

  public isInteracting(): boolean {
    return this.isUserInteracting;
  }

  public stopCamera() {
    if (this.map) {
      this.map.stop();
    }
  }

  public flyTo(options: maplibregl.FlyToOptions) {
    if (this.map) {
      this.map.flyTo({
        essential: true,
        ...options,
      });
    }
  }

  public easeTo(options: maplibregl.EaseToOptions) {
    if (this.map) {
      this.map.easeTo({
        essential: true,
        ...options,
      });
    }
  }

  public fitBounds(bounds: maplibregl.LngLatBoundsLike, options?: maplibregl.FitBoundsOptions) {
    if (this.map) {
      this.map.fitBounds(bounds, {
        essential: true,
        ...options,
      });
    }
  }

  public resize() {
    if (this.map) {
      this.map.resize();
    }
  }

  public destroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
