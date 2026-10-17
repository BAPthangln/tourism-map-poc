import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AssetManager {
  private loader: GLTFLoader;
  private cache = new Map<string, GLTF>();
  private pendingPromises = new Map<string, Promise<GLTF>>();

  constructor() {
    this.loader = new GLTFLoader();
  }

  public async loadModel(url: string): Promise<GLTF> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    if (this.pendingPromises.has(url)) {
      return this.pendingPromises.get(url)!;
    }

    const promise = new Promise<GLTF>((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          this.cache.set(url, gltf);
          this.pendingPromises.delete(url);
          resolve(gltf);
        },
        undefined,
        (err) => {
          this.pendingPromises.delete(url);
          console.error(`[AssetManager] Failed to load 3D model from ${url}:`, err);
          reject(err);
        }
      );
    });

    this.pendingPromises.set(url, promise);
    return promise;
  }

  public disposeModel(url: string) {
    const gltf = this.cache.get(url);
    if (!gltf) return;

    gltf.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => this.disposeMaterial(mat));
        } else if (mesh.material) {
          this.disposeMaterial(mesh.material);
        }
      }
    });

    this.cache.delete(url);
  }

  private disposeMaterial(mat: THREE.Material) {
    mat.dispose();
    for (const key of Object.keys(mat)) {
      const val = (mat as unknown as Record<string, unknown>)[key];
      if (val && typeof val === 'object' && 'isTexture' in val && (val as THREE.Texture).isTexture) {
        (val as THREE.Texture).dispose();
      }
    }
  }

  public clearAll() {
    for (const url of this.cache.keys()) {
      this.disposeModel(url);
    }
    this.cache.clear();
    this.pendingPromises.clear();
  }
}
