import React, { useRef, useState, useEffect } from 'react';
import {
  Shield,
  Zap,
  Volume2,
  VolumeX,
  Pause,
  Backpack,
  Hammer,
  Store,
  Sparkles,
  Hand,
  Compass,
} from 'lucide-react';
import { CraftingMaterial, PlayerStats } from '../game/types.ts';

interface GameHudProps {
  stats: PlayerStats;
  materials: Record<CraftingMaterial['id'], number>;
  floorLevel: number;
  message: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenInventory: () => void;
  onOpenSkillTree: () => void;
  onOpenForge: () => void;
  onOpenBazaar: () => void;
  onTriggerAttack: () => void;
  onTriggerDodge: () => void;
  onTriggerSkill: (slot: 1 | 2 | 3) => void;
  onTriggerInteract: () => void;
  onTouchJoystickMove: (x: number, y: number) => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  stats,
  materials,
  floorLevel,
  message,
  isMuted,
  onToggleMute,
  onPause,
  onOpenInventory,
  onOpenSkillTree,
  onOpenForge,
  onOpenBazaar,
  onTriggerAttack,
  onTriggerDodge,
  onTriggerSkill,
  onTriggerInteract,
  onTouchJoystickMove,
}) => {
  // Mobile virtual joystick state
  const joystickZoneRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickOrigin, setJoystickOrigin] = useState({ x: 0, y: 0 });
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = joystickZoneRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    setJoystickOrigin({ x, y });
    setJoystickKnob({ x, y });
    setJoystickActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickActive) return;
    const touch = e.touches[0];
    const rect = joystickZoneRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;
    const dx = currentX - joystickOrigin.x;
    const dy = currentY - joystickOrigin.y;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 45;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const knobX = joystickOrigin.x + Math.cos(angle) * clampedDist;
    const knobY = joystickOrigin.y + Math.sin(angle) * clampedDist;

    setJoystickKnob({ x: knobX, y: knobY });

    const normX = (knobX - joystickOrigin.x) / maxRadius;
    const normY = (knobY - joystickOrigin.y) / maxRadius;
    onTouchJoystickMove(normX, normY);
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    onTouchJoystickMove(0, 0);
  };

  // Trailing damage ghost effect
  const [ghostHp, setGhostHp] = useState(stats.hp);
  useEffect(() => {
    const timer = setTimeout(() => {
      setGhostHp(stats.hp);
    }, 350);
    return () => clearTimeout(timer);
  }, [stats.hp]);

  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const ghostPercent = Math.max(0, Math.min(100, (ghostHp / stats.maxHp) * 100));
  const manaPercent = Math.max(0, Math.min(100, (stats.mana / stats.maxMana) * 100));
  const stamPercent = Math.max(0, Math.min(100, (stats.stamina / stats.maxStamina) * 100));
  const xpPercent = Math.max(0, Math.min(100, (stats.xp / stats.xpNeeded) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      {/* Top Bar: Perimeter Clusters */}
      <div className="flex items-start justify-between w-full gap-2">
        {/* Top-Left: Player Vitality Cluster */}
        <div className="flex flex-col gap-1.5 bg-slate-950/90 p-2 sm:p-3 border border-slate-700/80 shadow-lg pointer-events-auto min-w-[155px] sm:min-w-[250px]">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono font-bold tracking-wider">
            <span className="text-amber-400">LVL {stats.level}</span>
            <span className="text-slate-400">FLOOR {floorLevel}</span>
          </div>

          {/* Health Bar with Trailing Ghost */}
          <div className="relative w-full h-3.5 sm:h-4 bg-slate-900 border border-red-950/80 overflow-hidden">
            {/* Ghost bar */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-red-400/60 transition-all duration-300"
              style={{ width: `${ghostPercent}%` }}
            />
            {/* Live HP bar */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-red-700 to-rose-600 transition-all duration-75"
              style={{ width: `${hpPercent}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px] font-mono font-bold text-white tabular-nums drop-shadow">
              HP {Math.round(stats.hp)} / {stats.maxHp}
            </span>
          </div>

          {/* Mana Bar */}
          <div className="relative w-full h-2.5 sm:h-3 bg-slate-900 border border-sky-950/80 overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-sky-700 to-blue-500 transition-all duration-75"
              style={{ width: `${manaPercent}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[9px] font-mono font-bold text-sky-100 tabular-nums drop-shadow">
              MP {Math.round(stats.mana)} / {stats.maxMana}
            </span>
          </div>

          {/* Stamina Bar */}
          <div className="relative w-full h-1.5 sm:h-2 bg-slate-900 border border-emerald-950/80 overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-600 to-green-400 transition-all duration-75"
              style={{ width: `${stamPercent}%` }}
            />
          </div>

          {/* XP Progress Bar */}
          <div className="relative w-full h-1 bg-slate-900 overflow-hidden">
            <div className="h-full bg-amber-400 transition-all duration-150" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>

        {/* Top-Center Message Notification */}
        {message && (
          <div className="hidden lg:flex items-center px-4 py-1.5 bg-slate-950/90 border border-amber-500/60 text-amber-300 text-xs font-mono font-medium tracking-wide shadow-md animate-fade-in">
            {message}
          </div>
        )}

        {/* Top-Right: Economy & Utilities Cluster */}
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          {/* Currencies & Materials */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950/90 px-2 sm:px-3 py-1 border border-slate-700/80 text-[11px] sm:text-xs font-mono tabular-nums">
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <span>🪙</span>
              <span>{stats.gold}</span>
            </div>
            <div className="w-[1px] h-3 bg-slate-700" />
            <div className="flex items-center gap-1 text-slate-300" title="Scrap Metal">
              <span className="text-[9px] text-slate-400">SC</span>
              <span>{materials.scrapMetal}</span>
            </div>
            <div className="flex items-center gap-1 text-sky-300" title="Mystic Essence">
              <span className="text-[9px] text-sky-400">ES</span>
              <span>{materials.mysticEssence}</span>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenInventory}
              title="Inventory [Tab / I]"
              aria-label="Open Inventory"
              className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 active:scale-95 transition cursor-pointer"
            >
              <Backpack className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSkillTree}
              title="Skill Tree [K]"
              aria-label="Open Skill Tree"
              className="relative p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 active:scale-95 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              {stats.skillPoints > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[9px] font-bold text-slate-950 flex items-center justify-center">
                  {stats.skillPoints}
                </span>
              )}
            </button>

            <button
              onClick={onOpenForge}
              title="Crafting Forge [F]"
              aria-label="Open Crafting Forge"
              className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 active:scale-95 transition cursor-pointer"
            >
              <Hammer className="w-4 h-4 text-amber-400" />
            </button>

            <button
              onClick={onOpenBazaar}
              title="Trading Bazaar [B]"
              aria-label="Open Trading Bazaar"
              className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 active:scale-95 transition cursor-pointer"
            >
              <Store className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={onToggleMute}
              title="Toggle Audio [M]"
              aria-label="Toggle Audio Mute"
              className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 active:scale-95 transition cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onPause}
              title="Pause [Esc / P]"
              aria-label="Pause Game"
              className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700 active:scale-95 transition cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Touch Layer: Virtual Joystick on Left, Action Cluster on Right */}
      <div className="flex items-end justify-between w-full pointer-events-none mt-auto">
        {/* Left Side: Touch Joystick Zone */}
        <div
          ref={joystickZoneRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="relative w-36 h-36 sm:w-44 sm:h-44 pointer-events-auto touch-none flex items-center justify-center opacity-80"
        >
          {/* Base circle */}
          <div className="w-28 h-28 rounded-full border-2 border-slate-600/70 bg-slate-950/40 flex items-center justify-center">
            <Compass className="w-6 h-6 text-slate-500/40" />
          </div>

          {/* Active Knob */}
          {joystickActive && (
            <div
              className="absolute w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-rose-500 border border-amber-300 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
              style={{ left: joystickKnob.x, top: joystickKnob.y }}
            />
          )}
        </div>

        {/* Center: Desktop Skill Hotbar Clues */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/85 px-4 py-2 border border-slate-700/80 pointer-events-auto">
          <button
            onClick={() => onTriggerSkill(1)}
            className="flex flex-col items-center p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left min-w-[70px] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono text-amber-400 font-bold">[1]</span>
              <span className="text-[9px] font-mono text-sky-400">25 MP</span>
            </div>
            <span className="text-xs font-bold text-slate-200 mt-1">Cleave</span>
          </button>

          <button
            onClick={() => onTriggerSkill(2)}
            className="flex flex-col items-center p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left min-w-[70px] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono text-amber-400 font-bold">[2]</span>
              <span className="text-[9px] font-mono text-sky-400">35 MP</span>
            </div>
            <span className="text-xs font-bold text-slate-200 mt-1">Whirlwind</span>
          </button>

          <button
            onClick={() => onTriggerSkill(3)}
            className="flex flex-col items-center p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left min-w-[70px] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono text-amber-400 font-bold">[3]</span>
              <span className="text-[9px] font-mono text-emerald-400">RESTORE</span>
            </div>
            <span className="text-xs font-bold text-slate-200 mt-1">Flask</span>
          </button>

          <div className="w-[1px] h-8 bg-slate-700 mx-1" />

          <button
            onClick={onTriggerInteract}
            className="flex flex-col items-center p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 min-w-[70px] cursor-pointer"
          >
            <span className="text-[10px] font-mono text-amber-400 font-bold">[E]</span>
            <span className="text-xs font-bold text-slate-200 mt-1">Interact</span>
          </button>
        </div>

        {/* Right Side: Virtual Action Touch Cluster */}
        <div className="flex flex-col items-end gap-2.5 pointer-events-auto touch-none pb-2 pr-1">
          {/* Secondary Action Row: Skills & Interact */}
          <div className="flex items-center gap-2">
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onTriggerSkill(1);
              }}
              onClick={() => onTriggerSkill(1)}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/90 active:bg-sky-600 border border-sky-500/70 text-sky-300 font-mono text-xs font-bold flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
            </button>

            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onTriggerSkill(2);
              }}
              onClick={() => onTriggerSkill(2)}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/90 active:bg-orange-600 border border-orange-500/70 text-orange-300 font-mono text-xs font-bold flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onTriggerInteract();
              }}
              onClick={onTriggerInteract}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/90 active:bg-amber-600 border border-amber-500/70 text-amber-300 font-mono text-xs font-bold flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
            >
              <Hand className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Action Row: Dodge & Attack */}
          <div className="flex items-center gap-3">
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onTriggerDodge();
              }}
              onClick={onTriggerDodge}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-slate-900/90 active:bg-emerald-600 border border-emerald-500 text-emerald-300 font-mono text-xs font-bold flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
            >
              <Shield className="w-5 h-5" />
            </button>

            {/* Primary Attack Button (Largest) */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onTriggerAttack();
              }}
              onClick={onTriggerAttack}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-amber-700 via-rose-600 to-amber-500 active:scale-90 border-2 border-amber-300 text-white font-bold flex items-center justify-center shadow-2xl cursor-pointer"
            >
              <span className="text-xl">⚔️</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
