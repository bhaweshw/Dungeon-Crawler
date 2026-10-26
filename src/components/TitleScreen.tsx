import React, { useEffect } from 'react';
import { Play, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between items-center p-6 sm:p-12 pointer-events-auto bg-gradient-to-b from-black/60 via-black/40 to-black/80 select-none">
      {/* Top Atmospheric negative space */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs tracking-widest text-slate-400 uppercase font-mono">
        <span>V1.0.0 · PROCEDURAL 3D ARPG</span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>DEEP DUNGEON CRAWLER</span>
        </span>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center text-center my-auto">
        <svg
          viewBox="0 0 600 120"
          className="w-full max-w-lg sm:max-w-xl h-auto drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
          aria-label="Dungeon Exile Title"
        >
          <defs>
            <linearGradient id="titleGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <filter id="shadowFilter">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.9" />
            </filter>
          </defs>
          {/* Runic Crest Emblem */}
          <path
            d="M 300 10 L 320 40 L 300 70 L 280 40 Z"
            fill="none"
            stroke="url(#titleGlow)"
            strokeWidth="3"
            filter="url(#shadowFilter)"
          />
          <circle cx="300" cy="40" r="4" fill="#38bdf8" />

          {/* Lettering */}
          <text
            x="300"
            y="95"
            textAnchor="middle"
            fill="#f8fafc"
            stroke="#0f172a"
            strokeWidth="4"
            paintOrder="stroke fill"
            fontSize="46"
            fontWeight="900"
            letterSpacing="8"
            fontFamily="system-ui, sans-serif"
          >
            DUNGEON EXILE
          </text>
        </svg>

        <p className="mt-2 text-sm sm:text-base font-medium text-slate-300 max-w-md tracking-wide">
          Descend into procedural crypts, forge modular relics, master arcane masteries, and conquer the depths.
        </p>

        {/* Primary Start CTA */}
        <button
          data-start="true"
          onClick={onStart}
          className="mt-8 group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-lg rounded-none tracking-widest uppercase transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-xl shadow-amber-900/40 border border-amber-400/50 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>ENTER THE DEPTHS</span>
        </button>
      </div>

      {/* Flat Control Hints Line in Safe Bottom Margin */}
      <div className="w-full text-center">
        <p className="text-xs sm:text-sm font-mono tracking-wider text-slate-400 bg-slate-900/60 py-2 px-4 inline-block border border-slate-700/60">
          WASD Move · Space Dodge Roll · Left Click Attack · 1-3 Skills · E Interact · Touch Virtual Controls
        </p>
      </div>
    </div>
  );
};
