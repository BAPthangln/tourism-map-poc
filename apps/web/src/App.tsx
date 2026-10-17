import React, { useEffect, useRef, useState } from 'react';
import {
  LandmarkManifest,
  PerformanceMetrics,
  Place,
  QualityTier,
  TourRoute,
} from '@tourism-map/shared-types';
import { createTourismMapStyle, SceneManager } from '@tourism-map/map-engine';
import { PerformanceHUD } from './components/PerformanceHUD.tsx';
import { POIDetailDrawer } from './components/POIDetailDrawer.tsx';
import { TourPanel } from './components/TourPanel.tsx';
import { GateATestModal } from './components/GateATestModal.tsx';
import { AIAssistantModal } from './components/AIAssistantModal.tsx';
import { Bot, Compass, MapPin, Navigation, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  const [places, setPlaces] = useState<Place[]>([]);
  const [routes, setRoutes] = useState<TourRoute[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [placesMap, setPlacesMap] = useState<Map<string, Place>>(new Map());

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTimeMs: 16.6,
    drawCalls: 0,
    triangles: 0,
    webglStatus: 'normal',
    quality: (import.meta.env.VITE_DEFAULT_QUALITY_TIER as QualityTier) || 'high',
  });

  const [isTourPlaying, setIsTourPlaying] = useState(false);
  const [activeTourStep, setActiveTourStep] = useState(0);
  const [showTourPanel, setShowTourPanel] = useState(false);
  const [showGateATests, setShowGateATests] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLng = parseFloat(import.meta.env.VITE_DEFAULT_LNG || '108.2255');
    const initialLat = parseFloat(import.meta.env.VITE_DEFAULT_LAT || '16.0610');
    const initialZoom = parseFloat(import.meta.env.VITE_DEFAULT_ZOOM || '15.5');
    const initialPitch = parseFloat(import.meta.env.VITE_DEFAULT_PITCH || '50');
    const initialBearing = parseFloat(import.meta.env.VITE_DEFAULT_BEARING || '-15');

    const mapStyle = createTourismMapStyle({
      provider: import.meta.env.VITE_MAP_PROVIDER,
      maptilerKey: import.meta.env.VITE_MAPTILER_API_KEY,
      cartoKey: import.meta.env.VITE_CARTO_API_KEY,
      mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    });

    // 1. Initialize SceneManager with env configuration
    const sm = new SceneManager({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [initialLng, initialLat],
      zoom: initialZoom,
      pitch: initialPitch,
      bearing: initialBearing,
      onSelectPlace: (place) => {
        setSelectedPlace(place);
      },
      onQualityChange: (tier) => {
        setMetrics((prev) => ({ ...prev, quality: tier }));
      },
    });
    sceneManagerRef.current = sm;

    // 2. Subscribe to performance telemetry
    const unsubscribePerf = sm.performanceMonitor.subscribe((m) => {
      setMetrics({ ...m });
    });

    // 3. Load Datasets & Manifests
    Promise.all([
      fetch('/assets/manifests/danang_places.json').then((r) => r.json()),
      fetch('/assets/manifests/danang_landmarks.json').then((r) => r.json()),
      fetch('/assets/manifests/danang_routes.json').then((r) => r.json()),
    ])
      .then(([placesData, landmarksData, routesData]: [Place[], LandmarkManifest[], TourRoute[]]) => {
        setPlaces(placesData);
        setRoutes(routesData);

        const pMap = new Map<string, Place>();
        for (const p of placesData) {
          pMap.set(p.id, p);
        }
        setPlacesMap(pMap);

        sm.setPlaces(placesData);
        sm.setLandmarks(landmarksData);
        sm.setRoutes(routesData);

        // Bind tour events
        if (sm.cameraController) {
          sm.cameraController.onSequenceStep = (_, stepIndex) => {
            setActiveTourStep(stepIndex);
          };
          sm.cameraController.onSequenceComplete = () => {
            setIsTourPlaying(false);
          };
          sm.cameraController.onSequenceCancelled = () => {
            setIsTourPlaying(false);
          };
        }
      })
      .catch((err) => {
        console.error('Failed to load map data manifests:', err);
      });

    sm.init();

    return () => {
      unsubscribePerf();
      sm.destroy();
    };
  }, []);

  const handleSelectTier = (tier: QualityTier) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setQualityTier(tier);
    }
  };

  const handleFlyToPlace = (place: Place) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.selectPlace(place.id);
    }
  };

  const handleStartTour = () => {
    if (sceneManagerRef.current && routes.length > 0) {
      setIsTourPlaying(true);
      setActiveTourStep(0);
      sceneManagerRef.current.startTour(routes[0].id);
    }
  };

  const handleStopTour = () => {
    if (sceneManagerRef.current) {
      setIsTourPlaying(false);
      sceneManagerRef.current.stopTour();
    }
  };

  const handleResetCamera = () => {
    const map = sceneManagerRef.current?.getMap();
    if (map) {
      map.flyTo({
        center: [108.2255, 16.061],
        zoom: 15.5,
        pitch: 52,
        bearing: -15,
        duration: 1800,
        essential: true,
      });
      setSelectedPlace(null);
      if (sceneManagerRef.current) {
        sceneManagerRef.current.selectPlace(null);
      }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none">
      {/* 1. Map Canvas */}
      <div id="map-container" ref={mapContainerRef} className="w-full h-full" />

      {/* 2. Top-Left App Title & Location */}
      <div className="absolute top-4 left-4 z-30 pointer-events-auto">
        <div className="glass-panel p-3 shadow-2xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
            <Compass size={20} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-white text-sm tracking-wide">
                ĐÀ NẴNG HYBRID MAP
              </h1>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.2 rounded border border-rose-500/40">
                PHASE 0 SPIKE
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-300">
              <MapPin size={11} className="text-rose-400" />
              <span>Sông Hàn • 15 POIs • 3 Landmark 3D</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top-Right Telemetry & Quality HUD */}
      <div className="absolute top-4 right-4 z-30 pointer-events-auto">
        <PerformanceHUD
          metrics={metrics}
          onSelectTier={handleSelectTier}
          onOpenGateATests={() => setShowGateATests(true)}
        />
      </div>

      {/* 4. Left Tour Drawer (when open) */}
      {showTourPanel && (
        <div className="absolute top-20 left-4 z-30 pointer-events-auto animate-in slide-in-from-left duration-300">
          <TourPanel
            route={routes[0] || null}
            placesMap={placesMap}
            isPlaying={isTourPlaying}
            activeStep={activeTourStep}
            onStartTour={handleStartTour}
            onStopTour={handleStopTour}
            onSelectStop={(id) => {
              if (sceneManagerRef.current) {
                sceneManagerRef.current.selectPlace(id);
              }
            }}
          />
        </div>
      )}

      {/* 5. Bottom Quick Action Bar */}
      <div className="absolute bottom-6 right-6 z-30 pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => setShowTourPanel(!showTourPanel)}
          className={`glass-btn py-2.5 px-3.5 shadow-xl ${
            showTourPanel || isTourPlaying ? 'glass-btn-primary' : ''
          }`}
          title="Tuyến tham quan di sản"
        >
          <Navigation size={15} />
          <span>{isTourPlaying ? 'Đang chạy Tour...' : 'Lộ trình Sông Hàn'}</span>
        </button>

        <button
          onClick={() => setShowAIChat(true)}
          className="glass-btn py-2.5 px-3.5 shadow-xl bg-gradient-to-r from-purple-600/80 to-rose-600/80 hover:from-purple-600 hover:to-rose-600 text-white font-semibold border-none"
          title="Trợ lý AI Du lịch"
        >
          <Sparkles size={15} className="text-amber-300 animate-pulse" />
          <span>Hỏi Trợ Lý AI</span>
        </button>

        <button
          onClick={handleResetCamera}
          className="glass-btn py-2.5 px-3 shadow-xl"
          title="Góc nhìn toàn cảnh"
        >
          <Compass size={15} />
          <span>Toàn cảnh</span>
        </button>
      </div>

      {/* 6. Selected POI Detail Drawer */}
      <POIDetailDrawer
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        onFlyTo={handleFlyToPlace}
      />

      {/* 7. Gate A Verification Test Suite Modal */}
      {showGateATests && (
        <GateATestModal
          sceneManager={sceneManagerRef.current}
          onClose={() => setShowGateATests(false)}
        />
      )}

      {/* 8. Grounded AI Assistant Modal */}
      {showAIChat && (
        <AIAssistantModal
          sceneManager={sceneManagerRef.current}
          places={places}
          routes={routes}
          onClose={() => setShowAIChat(false)}
        />
      )}
    </div>
  );
};
