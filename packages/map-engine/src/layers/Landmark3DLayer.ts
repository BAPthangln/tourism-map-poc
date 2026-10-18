import * as THREE from 'three';
import maplibregl, { CustomLayerInterface, Map as MapLibreMap } from 'maplibre-gl';
import { LandmarkManifest } from '@tourism-map/shared-types';
import { AssetManager } from '../assets/AssetManager.js';

interface ActiveLandmark {
  manifest: LandmarkManifest;
  scene: THREE.Scene;
  modelGroup: THREE.Group;
  localTransform: THREE.Matrix4;
  isLoaded: boolean;
  hasError: boolean;
}

export class Landmark3DLayer implements CustomLayerInterface {
  public id: string;
  public type: 'custom' = 'custom';
  public renderingMode: '3d' = '3d';

  private map: MapLibreMap | null = null;
  private camera = new THREE.Camera();
  private renderer: THREE.WebGLRenderer | null = null;
  private assetManager: AssetManager;
  private activeLandmarks = new Map<string, ActiveLandmark>();
  private isEnabled = true;

  // Callbacks
  public onFallbackTriggered?: (placeId: string, reason: string) => void;
  public onStatsUpdate?: (drawCalls: number, triangles: number) => void;

  constructor(id = 'landmark-3d-layer', assetManager?: AssetManager) {
    this.id = id;
    this.assetManager = assetManager || new AssetManager();
  }

  public onAdd(map: MapLibreMap, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.map = map;

    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    this.renderer.autoClear = false;

    // Listen to context loss
    map.getCanvas().addEventListener('webglcontextlost', (e) => {
      console.warn('[Landmark3DLayer] WebGL context lost!');
      e.preventDefault();
    });

    map.getCanvas().addEventListener('webglcontextrestored', () => {
      console.info('[Landmark3DLayer] WebGL context restored.');
    });
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (this.map) {
      this.map.triggerRepaint();
    }
  }

  public computeLocalTransform(manifest: LandmarkManifest): THREE.Matrix4 {
    const coord = maplibregl.MercatorCoordinate.fromLngLat(
      [manifest.position.lng, manifest.position.lat],
      manifest.position.altitude_m || 0
    );
    const meterScale = coord.meterInMercatorCoordinateUnits() * manifest.scale_m;

    const headingRad = ((manifest.heading_deg || 0) * Math.PI) / 180;
    const pitchRad = ((manifest.pitch_deg || 0) * Math.PI) / 180;
    const rollRad = ((manifest.roll_deg || 0) * Math.PI) / 180;

    const rotationX = new THREE.Matrix4().makeRotationX(Math.PI / 2 + pitchRad);
    const rotationY = new THREE.Matrix4().makeRotationY(rollRad);
    const rotationZ = new THREE.Matrix4().makeRotationZ(headingRad);

    return new THREE.Matrix4()
      .makeTranslation(coord.x, coord.y, coord.z)
      .scale(new THREE.Vector3(meterScale, -meterScale, meterScale))
      .multiply(rotationZ)
      .multiply(rotationX)
      .multiply(rotationY);
  }

  public updateLandmarkHeading(id: string, headingDeg: number) {
    const lm = this.activeLandmarks.get(id);
    if (!lm) return;
    lm.manifest.heading_deg = headingDeg;
    lm.localTransform = this.computeLocalTransform(lm.manifest);
    if (this.map) {
      this.map.triggerRepaint();
    }
  }

  public async addLandmark(manifest: LandmarkManifest): Promise<void> {
    if (this.activeLandmarks.has(manifest.id)) {
      return;
    }

    const landmarkScene = new THREE.Scene();

    // Lighting setup for landmark
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    landmarkScene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    dirLight.position.set(100, 150, 200);
    landmarkScene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xb0d0ff, 0.8);
    fillLight.position.set(-100, -100, -50);
    landmarkScene.add(fillLight);

    const modelGroup = new THREE.Group();
    landmarkScene.add(modelGroup);

    const localTransform = this.computeLocalTransform(manifest);

    const activeLandmark: ActiveLandmark = {
      manifest,
      scene: landmarkScene,
      modelGroup,
      localTransform,
      isLoaded: false,
      hasError: false,
    };

    this.activeLandmarks.set(manifest.id, activeLandmark);

    try {
      const gltf = await this.assetManager.loadModel(manifest.asset_url);
      const clonedModel = gltf.scene.clone();

      // Adjust model origin if bottom_center requested
      if (manifest.origin === 'bottom_center') {
        const bbox = new THREE.Box3().setFromObject(clonedModel);
        const centerX = -(bbox.min.x + bbox.max.x) / 2;
        const centerZ = -(bbox.min.z + bbox.max.z) / 2;
        const bottomY = -bbox.min.y;
        clonedModel.position.set(centerX, bottomY, centerZ);
      }

      modelGroup.add(clonedModel);
      activeLandmark.isLoaded = true;

      if (this.map) {
        this.map.triggerRepaint();
      }
    } catch (err) {
      console.warn(`[Landmark3DLayer] Error loading ${manifest.name}: falling back to 2D icon`, err);
      activeLandmark.hasError = true;
      if (this.onFallbackTriggered) {
        this.onFallbackTriggered(manifest.place_id, 'model_load_failed');
      }
    }
  }

  public removeLandmark(id: string) {
    const lm = this.activeLandmarks.get(id);
    if (!lm) return;

    this.assetManager.disposeModel(lm.manifest.asset_url);
    this.activeLandmarks.delete(id);

    if (this.map) {
      this.map.triggerRepaint();
    }
  }

  public render(
    gl: Parameters<CustomLayerInterface['render']>[0],
    matrix: Parameters<CustomLayerInterface['render']>[1]
  ): void {
    if (!this.isEnabled || !this.renderer || this.activeLandmarks.size === 0) {
      return;
    }

    const currentZoom = this.map ? this.map.getZoom() : 15;
    const projMatrix = new THREE.Matrix4().fromArray(matrix as unknown as number[]);

    let totalTriangles = 0;
    let totalDrawCalls = 0;

    // Reset Three.js WebGL state to prevent MapLibre conflict
    this.renderer.resetState();

    for (const [, landmark] of this.activeLandmarks) {
      if (!landmark.isLoaded || landmark.hasError) continue;

      // Zoom culling
      if (currentZoom < landmark.manifest.min_zoom || currentZoom > landmark.manifest.max_zoom) {
        continue;
      }

      // Multiply MapLibre projection matrix by local landmark matrix
      this.camera.projectionMatrix = projMatrix.clone().multiply(landmark.localTransform);

      this.renderer.render(landmark.scene, this.camera);

      // Collect render stats
      const info = this.renderer.info.render;
      totalTriangles += info.triangles;
      totalDrawCalls += info.calls;
    }

    // Reset again after rendering so MapLibre's next layers render cleanly
    this.renderer.resetState();

    if (this.onStatsUpdate) {
      this.onStatsUpdate(totalDrawCalls, totalTriangles);
    }
  }

  public onRemove(): void {
    this.activeLandmarks.clear();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.map = null;
  }
}
