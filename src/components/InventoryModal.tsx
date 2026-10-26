import React, { useState } from 'react';
import { X, Shield, Swords, Sparkles, Gem } from 'lucide-react';
import { Item, ItemSlot, PlayerStats, Rarity } from '../game/types.ts';
import { calculateItemPowerScore } from '../game/lootAndCrafting.ts';
import { sounds } from '../game/soundEffects.ts';

interface InventoryModalProps {
  inventory: Item[];
  equipped: Partial<Record<ItemSlot, Item>>;
  stats: PlayerStats;
  onEquipItem: (item: Item) => void;
  onUnequipItem: (slot: ItemSlot) => void;
  onDropItem: (item: Item) => void;
  onClose: () => void;
}

const RARITY_COLORS: Record<Rarity, { border: string; text: string; bg: string }> = {
  common: { border: 'border-slate-500', text: 'text-slate-300', bg: 'bg-slate-900' },
  uncommon: { border: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-950/30' },
  rare: { border: 'border-sky-500', text: 'text-sky-400', bg: 'bg-sky-950/30' },
  epic: { border: 'border-purple-500', text: 'text-purple-400', bg: 'bg-purple-950/30' },
  legendary: { border: 'border-amber-500', text: 'text-amber-400', bg: 'bg-amber-950/40' },
};

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  equipped,
  stats,
  onEquipItem,
  onUnequipItem,
  onDropItem,
  onClose,
}) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(inventory[0] || equipped.weapon || null);

  const equipSlots: { slot: ItemSlot; label: string }[] = [
    { slot: 'helmet', label: 'HELMET' },
    { slot: 'armor', label: 'CHEST' },
    { slot: 'boots', label: 'BOOTS' },
    { slot: 'weapon', label: 'WEAPON' },
    { slot: 'shield', label: 'OFF-HAND' },
    { slot: 'relic', label: 'RELIC' },
  ];

  const handleSelect = (item: Item) => {
    setSelectedItem(item);
    sounds.playUiClick();
  };

  const isEquipped = selectedItem && Object.values(equipped).some((e) => e?.id === selectedItem.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 pointer-events-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <Swords className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold font-mono tracking-wider text-slate-100">ARMORY & INVENTORY</h2>
              <p className="text-xs text-slate-400 font-mono">Combat Loadout & Gear Bag</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Inventory"
            className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Grid: Paperdoll + Bag + Item Details */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto">
          {/* Left Column: Equipped Gear Paperdoll + Stat Overview */}
          <div className="w-full lg:w-72 p-5 bg-slate-900/40 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col gap-4">
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">Equipped Loadout</h3>

            {/* Paperdoll Slots */}
            <div className="grid grid-cols-2 gap-2">
              {equipSlots.map(({ slot, label }) => {
                const item = equipped[slot];
                const rarityStyle = item ? RARITY_COLORS[item.rarity] : null;

                return (
                  <div
                    key={slot}
                    onClick={() => item && handleSelect(item)}
                    className={`p-2.5 border transition cursor-pointer flex flex-col justify-between min-h-[64px] ${
                      item
                        ? `${rarityStyle?.border} ${rarityStyle?.bg}`
                        : 'border-slate-800 bg-slate-950/60 opacity-60'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-slate-500 font-bold">{label}</span>
                    {item ? (
                      <div>
                        <div className={`text-xs font-bold font-mono truncate ${rarityStyle?.text}`}>
                          {item.name}
                        </div>
                        {item.upgradeLevel > 0 && (
                          <span className="text-[10px] font-mono text-amber-400">+{item.upgradeLevel}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-600">Empty</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Live Combat Attributes */}
            <div className="mt-2 pt-3 border-t border-slate-800 flex flex-col gap-1.5 text-xs font-mono">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Combat Attributes</span>
              <div className="flex justify-between text-slate-300">
                <span>Damage Rating:</span>
                <span className="text-amber-400 font-bold">{stats.damage}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Defense Value:</span>
                <span className="text-sky-400 font-bold">{stats.defense}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Critical Strike:</span>
                <span className="text-rose-400 font-bold">{Math.round(stats.critChance * 100)}%</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Critical Mult:</span>
                <span className="text-rose-400 font-bold">{(stats.critMultiplier * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Life Leech:</span>
                <span className="text-emerald-400 font-bold">{stats.lifeLeech}%</span>
              </div>
            </div>
          </div>

          {/* Middle Column: Bag Grid (24 Slots) */}
          <div className="flex-1 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
                Inventory Bag ({inventory.length} / 24)
              </h3>
              <span className="text-xs font-mono text-amber-400 font-bold">🪙 {stats.gold} Gold</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {Array.from({ length: 24 }).map((_, idx) => {
                const item = inventory[idx];
                const isSelected = item && selectedItem?.id === item.id;
                const rarityStyle = item ? RARITY_COLORS[item.rarity] : null;

                return (
                  <button
                    key={idx}
                    onClick={() => item && handleSelect(item)}
                    className={`aspect-square p-1.5 border flex flex-col justify-between items-center transition cursor-pointer ${
                      item
                        ? `${rarityStyle?.border} ${rarityStyle?.bg} hover:scale-105 ${
                            isSelected ? 'ring-2 ring-amber-400' : ''
                          }`
                        : 'border-slate-800/80 bg-slate-950/40 cursor-default'
                    }`}
                  >
                    {item ? (
                      <>
                        <div className="w-full flex items-center justify-between text-[9px] font-mono">
                          <span className={rarityStyle?.text}>{item.slot.substring(0, 3).toUpperCase()}</span>
                          {item.upgradeLevel > 0 && (
                            <span className="text-amber-400 font-bold">+{item.upgradeLevel}</span>
                          )}
                        </div>
                        <span className="text-lg">
                          {item.slot === 'weapon'
                            ? '⚔️'
                            : item.slot === 'shield'
                            ? '🛡️'
                            : item.slot === 'helmet'
                            ? '🪖'
                            : item.slot === 'armor'
                            ? '🥋'
                            : item.slot === 'boots'
                            ? '🥾'
                            : '💍'}
                        </span>
                        <div className="w-full truncate text-[10px] text-center font-mono font-bold">
                          {item.sockets.gemId && <span className="text-cyan-400">◆ </span>}
                          {item.baseDamage ? `${item.baseDamage} ATK` : `${item.baseDefense} DEF`}
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-800 text-xs my-auto">·</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Item Inspection Card */}
          <div className="w-full lg:w-80 p-5 bg-slate-900/60 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between">
            {selectedItem ? (
              <div className="flex flex-col gap-4">
                {/* Item Header */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={`uppercase font-bold ${RARITY_COLORS[selectedItem.rarity].text}`}>
                      {selectedItem.rarity} {selectedItem.slot}
                    </span>
                    <span className="text-slate-400">LVL {selectedItem.level}</span>
                  </div>
                  <h3 className="text-base font-bold font-mono text-white mt-1">
                    {selectedItem.name}
                    {selectedItem.upgradeLevel > 0 && (
                      <span className="text-amber-400 ml-1">+{selectedItem.upgradeLevel}</span>
                    )}
                  </h3>
                </div>

                {/* Primary Stats */}
                <div className="p-3 bg-slate-950 border border-slate-800 flex items-center justify-around font-mono">
                  {selectedItem.baseDamage !== undefined && (
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400">BASE DAMAGE</span>
                      <p className="text-lg font-bold text-amber-400">{selectedItem.baseDamage}</p>
                    </div>
                  )}
                  {selectedItem.baseDefense !== undefined && (
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400">BASE DEFENSE</span>
                      <p className="text-lg font-bold text-sky-400">{selectedItem.baseDefense}</p>
                    </div>
                  )}
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400">POWER SCORE</span>
                    <p className="text-lg font-bold text-purple-400">{calculateItemPowerScore(selectedItem)}</p>
                  </div>
                </div>

                {/* Affix List */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Properties & Affixes ({selectedItem.affixes.length})
                  </span>
                  <div className="flex flex-col gap-1">
                    {selectedItem.affixes.map((affix, i) => (
                      <div
                        key={i}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 flex items-center justify-between"
                      >
                        <span>{affix.name}</span>
                        <span className="font-bold">
                          +{affix.value}
                          {affix.isPercentage ? '%' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sockets */}
                {selectedItem.sockets.total > 0 && (
                  <div className="p-2.5 bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Gem className="w-3.5 h-3.5 text-cyan-400" />
                      Rune Socket:
                    </span>
                    <span className="text-cyan-300 font-bold">
                      {selectedItem.sockets.gemId ? selectedItem.sockets.gemId.toUpperCase() : 'Empty Socket'}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Merchant Value:</span>
                  <span className="text-amber-400 font-bold">🪙 {selectedItem.value}</span>
                </div>
              </div>
            ) : (
              <div className="my-auto text-center text-slate-500 font-mono text-xs">
                Select an item to inspect stats and actions.
              </div>
            )}

            {/* Action Buttons */}
            {selectedItem && (
              <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                {isEquipped ? (
                  <button
                    onClick={() => {
                      onUnequipItem(selectedItem.slot);
                      sounds.playUiClick();
                    }}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold border border-slate-600 transition cursor-pointer"
                  >
                    UNEQUIP
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onEquipItem(selectedItem);
                      sounds.playUiClick();
                    }}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-xs font-bold transition shadow-lg cursor-pointer"
                  >
                    EQUIP ITEM
                  </button>
                )}

                {!isEquipped && (
                  <button
                    onClick={() => {
                      onDropItem(selectedItem);
                      setSelectedItem(null);
                      sounds.playUiClick();
                    }}
                    className="px-4 py-2.5 bg-red-950/60 hover:bg-red-900 border border-red-700 text-red-300 font-mono text-xs font-bold transition cursor-pointer"
                  >
                    DROP
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
