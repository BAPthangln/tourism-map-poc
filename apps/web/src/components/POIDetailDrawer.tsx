import React from 'react';
import { Place } from '@tourism-map/shared-types';
import { Compass, Clock, DollarSign, MapPin, ShieldCheck, X } from 'lucide-react';

interface Props {
  place: Place | null;
  onClose: () => void;
  onFlyTo: (place: Place) => void;
}

export const POIDetailDrawer: React.FC<Props> = ({ place, onClose, onFlyTo }) => {
  if (!place) return null;

  return (
    <div className="fixed bottom-5 left-5 max-w-sm w-full z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="glass-panel overflow-hidden border border-white/20 shadow-2xl">
        {/* Thumbnail banner */}
        <div className="relative h-36 w-full overflow-hidden bg-slate-800">
          {place.thumbnail_url ? (
            <img
              src={place.thumbnail_url}
              alt={place.name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              Chưa có hình ảnh
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Category & 3D badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-900/80 text-rose-400 border border-rose-500/30 backdrop-blur-md">
              {place.category}
            </span>
            {place.has_3d_landmark && (
              <span className="badge-3d text-[10px]">
                3D MODEL
              </span>
            )}
          </div>

          <div className="absolute bottom-2 left-3 right-3 flex items-baseline justify-between">
            <h3 className="text-base font-bold text-white drop-shadow-md truncate">
              {place.name}
            </h3>
            {place.rating && (
              <span className="text-xs font-semibold text-amber-300 bg-black/60 px-1.5 py-0.5 rounded">
                ★ {place.rating}
              </span>
            )}
          </div>
        </div>

        {/* Content body */}
        <div className="p-3.5 space-y-2.5 text-xs text-slate-300">
          <p className="text-slate-200 line-clamp-2 leading-relaxed">
            {place.summary}
          </p>

          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <div className="flex items-start gap-2 text-slate-300">
              <MapPin size={13} className="text-rose-400 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{place.address}</span>
            </div>

            {place.open_hours && (
              <div className="flex items-start gap-2 text-slate-300">
                <Clock size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                <span>{place.open_hours}</span>
              </div>
            )}

            {place.ticket_price && (
              <div className="flex items-start gap-2 text-slate-300">
                <DollarSign size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>{place.ticket_price}</span>
              </div>
            )}
          </div>

          {/* Verified source evidence badge */}
          {place.source_evidence && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
              <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
              <span className="truncate">
                Nguồn: {place.source_evidence.publisher} ({place.source_evidence.checked_at})
              </span>
            </div>
          )}

          {/* Action button */}
          <div className="pt-1 flex gap-2">
            <button
              onClick={() => onFlyTo(place)}
              className="flex-1 glass-btn glass-btn-primary justify-center py-2 text-xs"
            >
              <Compass size={14} />
              <span>Góc nhìn 3D</span>
            </button>
            <button
              onClick={onClose}
              className="glass-btn justify-center py-2 px-3 text-xs"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
