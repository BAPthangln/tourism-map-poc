import { Map as MapLibreMap, FlyToOptions } from 'maplibre-gl';
import { Place, TourRoute } from '@tourism-map/shared-types';

export class CameraController {
  private map: MapLibreMap;
  private isSequenceRunning = false;
  private sequenceTimeout: ReturnType<typeof setTimeout> | null = null;
  public onSequenceCancelled?: () => void;
  public onSequenceStep?: (placeId: string, stepIndex: number) => void;
  public onSequenceComplete?: () => void;

  constructor(map: MapLibreMap) {
    this.map = map;
  }

  public flyToPlace(
    place: Place,
    options: {
      zoom?: number;
      pitch?: number;
      bearing?: number;
      durationMs?: number;
    } = {}
  ) {
    this.cancelSequence();

    const flyOptions: FlyToOptions = {
      center: place.coordinates,
      zoom: options.zoom ?? 16.5,
      pitch: options.pitch ?? 55,
      bearing: options.bearing ?? -20,
      duration: options.durationMs ?? 1800,
      essential: true,
    };

    this.map.flyTo(flyOptions);
  }

  public playTour(
    route: TourRoute,
    placesMap: Map<string, Place>,
    options: { dwellMs?: number; speed?: number } = {}
  ) {
    this.cancelSequence();
    this.isSequenceRunning = true;

    const stops = route.stops;
    if (stops.length === 0) return;

    const dwellMs = options.dwellMs ?? 2500;
    let currentStep = 0;

    const executeNextStep = () => {
      if (!this.isSequenceRunning) return;

      if (currentStep >= stops.length) {
        this.isSequenceRunning = false;
        if (this.onSequenceComplete) this.onSequenceComplete();
        return;
      }

      const stop = stops[currentStep];
      const place = placesMap.get(stop.place_id);

      if (place) {
        if (this.onSequenceStep) {
          this.onSequenceStep(place.id, currentStep);
        }

        this.map.flyTo({
          center: place.coordinates,
          zoom: 16.8,
          pitch: 58,
          bearing: -20 + (currentStep % 2 === 0 ? 25 : -25),
          duration: 2200,
          essential: true,
        });

        // Wait for fly animation + dwell time before proceeding to next stop
        this.sequenceTimeout = setTimeout(() => {
          currentStep++;
          executeNextStep();
        }, 2200 + dwellMs);
      } else {
        currentStep++;
        executeNextStep();
      }
    };

    executeNextStep();
  }

  public cancelSequence() {
    if (this.sequenceTimeout !== null) {
      clearTimeout(this.sequenceTimeout);
      this.sequenceTimeout = null;
    }

    if (this.isSequenceRunning) {
      this.isSequenceRunning = false;
      this.map.stop();
      if (this.onSequenceCancelled) {
        this.onSequenceCancelled();
      }
    }
  }

  public isRunning(): boolean {
    return this.isSequenceRunning;
  }
}
