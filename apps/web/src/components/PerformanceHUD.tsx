import React from 'react';
import { PerformanceMetrics, QualityTier } from '@tourism-map/shared-types';
import { Activity, Cpu, Eye, Gauge } from 'lucide-react';

interface Props {
  metrics: PerformanceMetrics;
  onSelectTier: (tier: QualityTier) => void;
  onOpenGateATests: () => void;
}

export const PerformanceHUD: React.FC<Props> = ({ metrics, onSelectTier, onOpenGateATests }) => {
  const isHealthyFPS = metrics.fps >= 30;

  return (
    <div className="glass-panel p-3 text-xs w-72 select-none">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-bold tracking-wide text-rose-400">
          <Activity size={14} className="animate-pulse" />
          <span>PHASE 0 TELEMETRY</span>
        </div>
        <button
          onClick={onOpenGateATests}
          className="text-[11px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold px-2 py-0.5 rounded border border-rose-500/40 transition-colors"
        >
          Gate A Tests
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
          <div className="text-slate-400 text-[10px] flex items-center gap-1">
            <Gauge size={11} /> FPS TARGET
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-xl font-bold font-mono ${isHealthyFPS ? 'text-emerald-400' : 'text-amber-400'}`}>
              {metrics.fps}
            </span>
            <span className="text-[10px] text-slate-400">fps ({metrics.frameTimeMs}ms)</span>
          </div>
        </div>

        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
          <div className="text-slate-400 text-[10px] flex items-center gap-1">
            <Cpu size={11} /> 3D RENDER
          </div>
          <div className="mt-0.5">
            <span className="font-mono text-cyan-300 font-semibold text-xs">
              {metrics.drawCalls} calls
            </span>
            <div className="text-[10px] text-slate-400">
              {metrics.triangles > 0 ? `${(metrics.triangles / 1000).toFixed(1)}k tris` : '2D mode'}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-slate-400 text-[10px] mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1"><Eye size={11} /> QUALITY TIER</span>
          <span className="uppercase text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            {metrics.webglStatus === 'normal' ? 'WebGL 3D Active' : '2D Fallback Mode'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 p-0.5 bg-black/40 rounded-lg border border-white/5">
          {(['low', 'medium', 'high'] as QualityTier[]).map((tier) => {
            const isActive = metrics.quality === tier;
            return (
              <button
                key={tier}
                onClick={() => onSelectTier(tier)}
                className={`py-1 text-[11px] font-semibold rounded capitalize transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tier}
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-white/5">
        MapLibre v4 + Three.js r169 • Đà Nẵng
      </div>
    </div>
  );
};
