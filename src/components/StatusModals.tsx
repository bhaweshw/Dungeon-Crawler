import React from 'react';
import { Play, RotateCcw, Home, Skull, Trophy } from 'lucide-react';
import { PlayerStats } from '../game/types.ts';

interface StatusModalProps {
  type: 'pause' | 'defeat' | 'victory';
  floorLevel: number;
  stats: PlayerStats;
  onResume?: () => void;
  onRestart: () => void;
  onNextFloor?: () => void;
  onTitle: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  type,
  floorLevel,
  stats,
  onResume,
  onRestart,
  onNextFloor,
  onTitle,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 pointer-events-auto select-none">
      <div className="relative w-full max-w-md bg-slate-950 border border-slate-700 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center text-slate-200">
        {type === 'pause' && (
          <>
            <h2 className="text-xl font-bold font-mono tracking-widest text-slate-100 uppercase">
              EXPEDITION PAUSED
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">Deep Crypt Exploration Stalled</p>

            {/* Stat tiles */}
            <div className="grid grid-cols-3 gap-2 w-full my-6 font-mono text-center">
              <div className="p-3 bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">FLOOR</span>
                <p className="text-lg font-bold text-amber-400 tabular-nums">{floorLevel}</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">LEVEL</span>
                <p className="text-lg font-bold text-sky-400 tabular-nums">{stats.level}</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">GOLD</span>
                <p className="text-lg font-bold text-yellow-400 tabular-nums">{stats.gold}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full font-mono text-xs font-bold tracking-wider uppercase">
              <button
                onClick={onResume}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-lg cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                RESUME EXPEDITION
              </button>

              <button
                onClick={onRestart}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                RESTART RUN
              </button>

              <button
                onClick={onTitle}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                TITLE SCREEN
              </button>
            </div>
          </>
        )}

        {type === 'defeat' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-600 flex items-center justify-center text-red-500 mb-3">
              <Skull className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold font-mono tracking-widest text-red-500 uppercase">
              EXPEDITION FAILED
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">Your essence remains trapped in the crypts</p>

            <div className="grid grid-cols-3 gap-2 w-full my-6 font-mono text-center">
              <div className="p-3 bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">REACHED</span>
                <p className="text-lg font-bold text-amber-400 tabular-nums">Floor {floorLevel}</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">HERO LEVEL</span>
                <p className="text-lg font-bold text-sky-400 tabular-nums">{stats.level}</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">GOLD</span>
                <p className="text-lg font-bold text-yellow-400 tabular-nums">{stats.gold}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full font-mono text-xs font-bold tracking-wider uppercase">
              <button
                data-start="true"
                onClick={onRestart}
                className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white shadow-xl cursor-pointer transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                TRY AGAIN
              </button>

              <button
                onClick={onTitle}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                RETURN TO TITLE
              </button>
            </div>
          </>
        )}

        {type === 'victory' && (
          <>
            <div className="w-12 h-12 rounded-full bg-amber-950/80 border border-amber-500 flex items-center justify-center text-amber-400 mb-3">
              <Trophy className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold font-mono tracking-widest text-amber-400 uppercase">
              DEPTHS CLEARED
            </h2>
            <p className="text-xs text-slate-300 font-mono mt-1">Abyssal Warden Vanquished</p>

            <div className="grid grid-cols-3 gap-2 w-full my-6 font-mono text-center">
              <div className="p-3 bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">FLOOR</span>
                <p className="text-lg font-bold text-emerald-400 tabular-nums">Depth {floorLevel}</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">HERO LEVEL</span>
                <p className="text-lg font-bold text-sky-400 tabular-nums">{stats.level}</p>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400">TOTAL GOLD</span>
                <p className="text-lg font-bold text-amber-400 tabular-nums">{stats.gold}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full font-mono text-xs font-bold tracking-wider uppercase">
              <button
                data-start="true"
                onClick={onNextFloor}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-xl cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                DESCEND TO NEXT DEPTHS
              </button>

              <button
                onClick={onTitle}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                RETURN TO SURFACE
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
