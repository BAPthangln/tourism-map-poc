import React from 'react';
import { Place, TourRoute } from '@tourism-map/shared-types';
import { CheckCircle2, ChevronRight, Navigation, Pause, Play } from 'lucide-react';

interface Props {
  route: TourRoute | null;
  placesMap: Map<string, Place>;
  isPlaying: boolean;
  activeStep: number;
  onStartTour: () => void;
  onStopTour: () => void;
  onSelectStop: (placeId: string) => void;
}

export const TourPanel: React.FC<Props> = ({
  route,
  placesMap,
  isPlaying,
  activeStep,
  onStartTour,
  onStopTour,
  onSelectStop,
}) => {
  if (!route) return null;

  return (
    <div className="glass-panel p-3.5 w-80 text-xs shadow-2xl">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <Navigation size={14} className="text-rose-400" />
          <span>{route.name}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {route.stops.length} điểm • {route.estimated_duration_min}p
        </span>
      </div>

      <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
        {route.description}
      </p>

      {/* Tour Stops List */}
      <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto pr-1">
        {route.stops.map((stop, idx) => {
          const place = placesMap.get(stop.place_id);
          const isCurrent = isPlaying && activeStep === idx;
          const isCompleted = isPlaying && activeStep > idx;

          return (
            <div
              key={stop.place_id}
              onClick={() => onSelectStop(stop.place_id)}
              className={`p-2 rounded-lg cursor-pointer transition-all flex items-center justify-between border ${
                isCurrent
                  ? 'bg-rose-500/20 border-rose-500/60 text-white'
                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-rose-500 text-white animate-bounce'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={12} /> : idx + 1}
                </span>
                <span className="truncate font-medium">{place?.name || stop.place_id}</span>
              </div>
              <ChevronRight size={13} className="text-slate-500 shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="pt-2 border-t border-white/10 flex gap-2">
        {isPlaying ? (
          <button
            onClick={onStopTour}
            className="flex-1 glass-btn bg-amber-600/80 hover:bg-amber-600 justify-center py-2 text-xs font-semibold"
          >
            <Pause size={14} />
            <span>Dừng lộ trình (Hủy)</span>
          </button>
        ) : (
          <button
            onClick={onStartTour}
            className="flex-1 glass-btn glass-btn-primary justify-center py-2 text-xs font-semibold"
          >
            <Play size={14} />
            <span>Bắt đầu Tour Khám phá</span>
          </button>
        )}
      </div>

      <div className="text-[10px] text-slate-400 text-center mt-2">
        * Chạm/kéo bản đồ sẽ tự động dừng tour (User interaction wins)
      </div>
    </div>
  );
};
