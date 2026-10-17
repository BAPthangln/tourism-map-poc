import { PerformanceMetrics, QualityTier } from '@tourism-map/shared-types';

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private frameTimeMs = 16.6;
  private drawCalls = 0;
  private triangles = 0;
  private webglStatus: PerformanceMetrics['webglStatus'] = 'normal';
  private currentQuality: QualityTier = 'high';
  private listeners: ((metrics: PerformanceMetrics) => void)[] = [];
  private rafId: number | null = null;

  constructor() {
    this.startTracking();
  }

  private startTracking() {
    const loop = (currentTime: number) => {
      this.frameCount++;
      const delta = currentTime - this.lastTime;

      if (delta >= 500) {
        this.fps = Math.round((this.frameCount * 1000) / delta);
        this.frameTimeMs = parseFloat((delta / this.frameCount).toFixed(1));
        this.frameCount = 0;
        this.lastTime = currentTime;
        this.notify();
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  public setGLMetrics(drawCalls: number, triangles: number) {
    this.drawCalls = drawCalls;
    this.triangles = triangles;
  }

  public setWebGLStatus(status: PerformanceMetrics['webglStatus']) {
    this.webglStatus = status;
    this.notify();
  }

  public setQuality(quality: QualityTier) {
    this.currentQuality = quality;
    this.notify();
  }

  public subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.push(callback);
    callback(this.getMetrics());
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    const metrics = this.getMetrics();
    for (const listener of this.listeners) {
      listener(metrics);
    }
  }

  public getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      frameTimeMs: this.frameTimeMs,
      drawCalls: this.drawCalls,
      triangles: this.triangles,
      webglStatus: this.webglStatus,
      quality: this.currentQuality,
    };
  }

  public destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.listeners = [];
  }
}
