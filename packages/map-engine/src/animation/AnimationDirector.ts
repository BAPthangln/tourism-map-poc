import { MapAction, Place, TourRoute } from '@tourism-map/shared-types';
import { CameraController } from './CameraController.js';
import { RouteLayer } from '../layers/RouteLayer.js';
import { POILayer } from '../layers/POILayer.js';

export interface AnimationDirectorContext {
  cameraController: CameraController;
  routeLayer: RouteLayer;
  poiLayer: POILayer;
  placesMap: Map<string, Place>;
  routesMap: Map<string, TourRoute>;
  onOpenContent?: (placeId: string) => void;
  onCloseContent?: () => void;
}

export class AnimationDirector {
  private ctx: AnimationDirectorContext;
  private isExecuting = false;

  constructor(ctx: AnimationDirectorContext) {
    this.ctx = ctx;
  }

  public async executeAction(action: MapAction): Promise<void> {
    switch (action.type) {
      case 'camera.flyTo': {
        const place = this.ctx.placesMap.get(action.placeId);
        if (place) {
          this.ctx.cameraController.flyToPlace(place, {
            zoom: action.zoom,
            pitch: action.pitch,
            bearing: action.bearing,
            durationMs: action.durationMs,
          });
          this.ctx.poiLayer.setSelectedPlace(place.id);
        }
        break;
      }

      case 'route.reveal': {
        const route = this.ctx.routesMap.get(action.routeId);
        if (route) {
          this.ctx.routeLayer.revealRoute(route, action.durationMs);
        }
        break;
      }

      case 'route.hide': {
        this.ctx.routeLayer.hideRoute();
        break;
      }

      case 'marker.highlight': {
        if (action.placeIds.length > 0) {
          this.ctx.poiLayer.setSelectedPlace(action.placeIds[0]);
        }
        break;
      }

      case 'marker.clear': {
        this.ctx.poiLayer.setSelectedPlace(null);
        break;
      }

      case 'content.open': {
        if (this.ctx.onOpenContent) {
          this.ctx.onOpenContent(action.placeId);
        }
        break;
      }

      case 'content.close': {
        if (this.ctx.onCloseContent) {
          this.ctx.onCloseContent();
        }
        break;
      }

      case 'sequence.cancel': {
        this.abort();
        break;
      }
    }
  }

  public abort() {
    this.isExecuting = false;
    this.ctx.cameraController.cancelSequence();
    this.ctx.routeLayer.cancelAnimation();
  }
}
