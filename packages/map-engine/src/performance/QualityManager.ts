import { QualityTier } from '@tourism-map/shared-types';

export interface QualityConfig {
  tier: QualityTier;
  maxPixelDeviceRatio: number;
  render3D: boolean;
  maxModels: number;
  enableTerrain: boolean;
  reduceMotion: boolean;
}

export class QualityManager {
  private currentTier: QualityTier = 'high';
  private listeners: ((config: QualityConfig) => void)[] = [];

  constructor(initialTier?: QualityTier) {
    if (initialTier) {
      this.currentTier = initialTier;
    } else {
      this.currentTier = this.detectRecommendedTier();
    }
  }

  private detectRecommendedTier(): QualityTier {
    if (typeof window === 'undefined') return 'high';

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return 'low';

    // Simple heuristic: check hardware concurrency & device memory if available
    const nav = window.navigator as Navigator & { deviceMemory?: number };
    const memory = nav.deviceMemory || 4;
    const cores = nav.hardwareConcurrency || 4;

    if (memory <= 2 || cores <= 2) {
      return 'low';
    } else if (memory <= 4 || cores <= 4) {
      return 'medium';
    }
    return 'high';
  }

  public getTier(): QualityTier {
    return this.currentTier;
  }

  public setTier(tier: QualityTier) {
    if (this.currentTier === tier) return;
    this.currentTier = tier;
    this.notify();
  }

  public getConfig(): QualityConfig {
    switch (this.currentTier) {
      case 'low':
        return {
          tier: 'low',
          maxPixelDeviceRatio: 1.0,
          render3D: false, // Fallback to 2D/2.5D markers
          maxModels: 0,
          enableTerrain: false,
          reduceMotion: true,
        };
      case 'medium':
        return {
          tier: 'medium',
          maxPixelDeviceRatio: 1.5,
          render3D: true,
          maxModels: 2,
          enableTerrain: false,
          reduceMotion: false,
        };
      case 'high':
      default:
        return {
          tier: 'high',
          maxPixelDeviceRatio: 2.0,
          render3D: true,
          maxModels: 5,
          enableTerrain: false,
          reduceMotion: false,
        };
    }
  }

  public subscribe(callback: (config: QualityConfig) => void): () => void {
    this.listeners.push(callback);
    callback(this.getConfig());
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    const config = this.getConfig();
    for (const listener of this.listeners) {
      listener(config);
    }
  }
}
