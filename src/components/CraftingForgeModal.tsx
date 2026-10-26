import React, { useState } from 'react';
import { X, Hammer, Flame, Trash2, ArrowUpCircle, Gem, RefreshCw } from 'lucide-react';
import { CraftingMaterial, Item } from '../game/types.ts';
import {
  applyModularUpgrade,
  GEM_RUNES,
  getUpgradeCost,
  rerollItemAffix,
  salvageItem,
  socketGemIntoItem,
} from '../game/lootAndCrafting.ts';
import { sounds } from '../game/soundEffects.ts';

interface CraftingForgeModalProps {
  inventory: Item[];
  materials: Record<CraftingMaterial['id'], number>;
  gold: number;
  onUpdateInventory: (items: Item[]) => void;
  onUpdateMaterials: (mats: Record<CraftingMaterial['id'], number>, newGold: number) => void;
  onClose: () => void;
}

export const CraftingForgeModal: React.FC<CraftingForgeModalProps> = ({
  inventory,
  materials,
  gold,
  onUpdateInventory,
  onUpdateMaterials,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'salvage' | 'upgrade' | 'socket' | 'reforge'>('salvage');
  const [selectedItem, setSelectedItem] = useState<Item | null>(inventory[0] || null);
  const [selectedGemId, setSelectedGemId] = useState<string>('ruby');
  const [selectedAffixIdx, setSelectedAffixIdx] = useState<number>(0);

  // 1. Salvage Action
  const handleSalvage = () => {
    if (!selectedItem) return;
    const { materials: gainedMats, gold: gainedGold } = salvageItem(selectedItem);
    const updatedMats = { ...materials };
    updatedMats.scrapMetal += gainedMats.scrapMetal;
    updatedMats.mysticEssence += gainedMats.mysticEssence;
    updatedMats.voidShard += gainedMats.voidShard;
    updatedMats.runicIngot += gainedMats.runicIngot;

    const updatedInv = inventory.filter((i) => i.id !== selectedItem.id);
    onUpdateInventory(updatedInv);
    onUpdateMaterials(updatedMats, gold + gainedGold);
    setSelectedItem(updatedInv[0] || null);
    sounds.playHit(true);
  };

  // 2. Modular Upgrade Action
  const handleUpgrade = () => {
    if (!selectedItem) return;
    const cost = getUpgradeCost(selectedItem);
    if (!cost.canUpgrade) return;
    if (materials.scrapMetal < cost.scrapMetal || materials.mysticEssence < cost.mysticEssence || gold < cost.gold) {
      return;
    }

    const updatedMats = { ...materials };
    updatedMats.scrapMetal -= cost.scrapMetal;
    updatedMats.mysticEssence -= cost.mysticEssence;

    const upgradedItem = applyModularUpgrade(selectedItem);
    const updatedInv = inventory.map((i) => (i.id === selectedItem.id ? upgradedItem : i));
    onUpdateInventory(updatedInv);
    onUpdateMaterials(updatedMats, gold - cost.gold);
    setSelectedItem(upgradedItem);
    sounds.playLevelUp();
  };

  // 3. Socket Rune Action
  const handleSocket = () => {
    if (!selectedItem) return;
    const socketed = socketGemIntoItem(selectedItem, selectedGemId);
    if (!socketed) return;

    const updatedInv = inventory.map((i) => (i.id === selectedItem.id ? socketed : i));
    onUpdateInventory(updatedInv);
    setSelectedItem(socketed);
    sounds.playLevelUp();
  };

  // 4. Affix Reforge Action
  const handleReforge = () => {
    if (!selectedItem || materials.mysticEssence < 4) return;
    const reforged = rerollItemAffix(selectedItem, selectedAffixIdx);
    if (!reforged) return;

    const updatedMats = { ...materials };
    updatedMats.mysticEssence -= 4;

    const updatedInv = inventory.map((i) => (i.id === selectedItem.id ? reforged : i));
    onUpdateInventory(updatedInv);
    onUpdateMaterials(updatedMats, gold);
    setSelectedItem(reforged);
    sounds.playHit(false);
  };

  const upgradeCost = selectedItem ? getUpgradeCost(selectedItem) : null;
  const canAffordUpgrade =
    upgradeCost &&
    upgradeCost.canUpgrade &&
    materials.scrapMetal >= upgradeCost.scrapMetal &&
    materials.mysticEssence >= upgradeCost.mysticEssence &&
    gold >= upgradeCost.gold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 pointer-events-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <Hammer className="w-6 h-6 text-amber-500" />
            <div>
              <h2 className="text-lg font-bold font-mono tracking-wider text-slate-100">RUNIC FORGE & CRAFTING</h2>
              <p className="text-xs text-slate-400 font-mono">Salvage, Modular Upgrades, and Gem Infusions</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Materials Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700 text-xs font-mono">
              <span className="text-slate-300">Scrap: {materials.scrapMetal}</span>
              <span className="text-sky-300">Essence: {materials.mysticEssence}</span>
              <span className="text-amber-400">🪙 {gold}</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close Forge"
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-slate-800 bg-slate-900/40">
          <button
            onClick={() => {
              setActiveTab('salvage');
              sounds.playUiClick();
            }}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-mono font-bold tracking-wider transition border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'salvage'
                ? 'border-red-500 text-red-400 bg-red-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            SALVAGE BENCH
          </button>
          <button
            onClick={() => {
              setActiveTab('upgrade');
              sounds.playUiClick();
            }}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-mono font-bold tracking-wider transition border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'upgrade'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            MODULAR UPGRADE
          </button>
          <button
            onClick={() => {
              setActiveTab('socket');
              sounds.playUiClick();
            }}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-mono font-bold tracking-wider transition border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'socket'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gem className="w-4 h-4" />
            RUNE INFUSION
          </button>
          <button
            onClick={() => {
              setActiveTab('reforge');
              sounds.playUiClick();
            }}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-mono font-bold tracking-wider transition border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'reforge'
                ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            AFFIX REFORGE
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
          {/* Inventory Selector on Left */}
          <div className="w-full md:w-64 p-4 bg-slate-900/30 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col gap-2">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              Select Gear ({inventory.length})
            </span>
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[360px]">
              {inventory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    sounds.playUiClick();
                  }}
                  className={`p-2 border text-left font-mono transition cursor-pointer flex items-center justify-between ${
                    selectedItem?.id === item.id
                      ? 'border-amber-400 bg-slate-900'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <div className="text-xs font-bold truncate text-slate-200">
                      {item.name}
                      {item.upgradeLevel > 0 && <span className="text-amber-400 ml-1">+{item.upgradeLevel}</span>}
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase">{item.rarity} {item.slot}</span>
                  </div>
                </button>
              ))}
              {inventory.length === 0 && (
                <div className="text-xs text-slate-600 font-mono py-8 text-center">No gear in bag</div>
              )}
            </div>
          </div>

          {/* Action Stage on Right */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            {selectedItem ? (
              <div className="flex flex-col gap-5">
                {/* Selected Item Banner */}
                <div className="p-4 bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono uppercase text-amber-400 font-bold">
                      {selectedItem.rarity} {selectedItem.slot} · Level {selectedItem.level}
                    </span>
                    <h3 className="text-base font-bold font-mono text-white mt-0.5">
                      {selectedItem.name}
                      {selectedItem.upgradeLevel > 0 && (
                        <span className="text-amber-400 ml-1.5">+{selectedItem.upgradeLevel}</span>
                      )}
                    </h3>
                  </div>
                  <div className="text-right font-mono text-xs">
                    {selectedItem.baseDamage && (
                      <span className="text-amber-400 font-bold">{selectedItem.baseDamage} DMG</span>
                    )}
                    {selectedItem.baseDefense && (
                      <span className="text-sky-400 font-bold">{selectedItem.baseDefense} DEF</span>
                    )}
                  </div>
                </div>

                {/* Tab Specific Workspace */}
                {activeTab === 'salvage' && (
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-mono text-slate-400">Estimated Salvage Yield:</span>
                    {(() => {
                      const yieldData = salvageItem(selectedItem);
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                          <div className="p-3 bg-slate-950 border border-slate-800 text-center">
                            <span className="text-[10px] text-slate-400">SCRAP METAL</span>
                            <p className="text-base font-bold text-slate-200">+{yieldData.materials.scrapMetal}</p>
                          </div>
                          <div className="p-3 bg-slate-950 border border-slate-800 text-center">
                            <span className="text-[10px] text-sky-400">MYSTIC ESSENCE</span>
                            <p className="text-base font-bold text-sky-300">+{yieldData.materials.mysticEssence}</p>
                          </div>
                          <div className="p-3 bg-slate-950 border border-slate-800 text-center">
                            <span className="text-[10px] text-purple-400">VOID SHARD</span>
                            <p className="text-base font-bold text-purple-300">+{yieldData.materials.voidShard}</p>
                          </div>
                          <div className="p-3 bg-slate-950 border border-slate-800 text-center">
                            <span className="text-[10px] text-amber-400">GOLD VALUE</span>
                            <p className="text-base font-bold text-amber-300">+{yieldData.gold}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {activeTab === 'upgrade' && (
                  <div className="flex flex-col gap-3 font-mono">
                    <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 text-xs">
                      <span className="text-slate-400">Tier Progression:</span>
                      <span className="text-amber-400 font-bold">
                        +{selectedItem.upgradeLevel} to +{selectedItem.upgradeLevel + 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 text-xs">
                      <span className="text-slate-400">Stat Improvement:</span>
                      <span className="text-emerald-400 font-bold">
                        +15% Base Power (+2 Flat Boost)
                      </span>
                    </div>

                    {upgradeCost && upgradeCost.canUpgrade && (
                      <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 text-xs">
                        <span className="text-slate-400">Upgrade Cost:</span>
                        <div className="flex items-center gap-3">
                          <span className={materials.scrapMetal >= upgradeCost.scrapMetal ? 'text-slate-200' : 'text-red-400'}>
                            {upgradeCost.scrapMetal} Scrap
                          </span>
                          <span className={materials.mysticEssence >= upgradeCost.mysticEssence ? 'text-sky-300' : 'text-red-400'}>
                            {upgradeCost.mysticEssence} Essence
                          </span>
                          <span className={gold >= upgradeCost.gold ? 'text-amber-400' : 'text-red-400'}>
                            🪙 {upgradeCost.gold}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'socket' && (
                  <div className="flex flex-col gap-3 font-mono">
                    <div className="text-xs text-slate-400">Choose Elemental Rune:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(GEM_RUNES).map((gem) => (
                        <button
                          key={gem.id}
                          onClick={() => setSelectedGemId(gem.id)}
                          className={`p-3 border text-left transition cursor-pointer ${
                            selectedGemId === gem.id
                              ? 'border-cyan-400 bg-cyan-950/30'
                              : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span style={{ color: gem.color }}>◆</span>
                            <span>{gem.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">{gem.bonusDesc}</span>
                        </button>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 text-xs text-slate-400">
                      Socket Status:{' '}
                      <span className="text-white font-bold">
                        {selectedItem.sockets.total > 0
                          ? selectedItem.sockets.gemId
                            ? `Occupied (${selectedItem.sockets.gemId.toUpperCase()})`
                            : 'Open Socket Available'
                          : 'No Socket Available on this item'}
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === 'reforge' && (
                  <div className="flex flex-col gap-3 font-mono">
                    <span className="text-xs text-slate-400">Select Affix to Reroll (Cost: 4 Mystic Essence):</span>
                    <div className="flex flex-col gap-1.5">
                      {selectedItem.affixes.map((affix, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedAffixIdx(idx)}
                          className={`p-2.5 border text-left flex items-center justify-between text-xs transition cursor-pointer ${
                            selectedAffixIdx === idx
                              ? 'border-purple-400 bg-purple-950/30 text-purple-200'
                              : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span>{affix.name}</span>
                          <span className="font-bold">
                            +{affix.value}
                            {affix.isPercentage ? '%' : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="my-auto text-center text-slate-600 font-mono text-xs">
                Select an item on the left to begin crafting.
              </div>
            )}

            {/* Execute Button */}
            {selectedItem && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                {activeTab === 'salvage' && (
                  <button
                    onClick={handleSalvage}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold tracking-wider uppercase transition cursor-pointer shadow-lg"
                  >
                    DISMANTLE & SALVAGE ITEM
                  </button>
                )}

                {activeTab === 'upgrade' && (
                  <button
                    onClick={handleUpgrade}
                    disabled={!canAffordUpgrade}
                    className={`w-full py-3 font-mono text-xs font-bold tracking-wider uppercase transition cursor-pointer ${
                      canAffordUpgrade
                        ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-lg'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {canAffordUpgrade ? 'FORGE UPGRADE' : 'INSUFFICIENT MATERIALS'}
                  </button>
                )}

                {activeTab === 'socket' && (
                  <button
                    onClick={handleSocket}
                    disabled={selectedItem.sockets.total <= 0 || !!selectedItem.sockets.gemId}
                    className={`w-full py-3 font-mono text-xs font-bold tracking-wider uppercase transition cursor-pointer ${
                      selectedItem.sockets.total > 0 && !selectedItem.sockets.gemId
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-lg'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {selectedItem.sockets.total > 0 && !selectedItem.sockets.gemId
                      ? 'INFUSE RUNIC GEM'
                      : 'CANNOT INFUSE'}
                  </button>
                )}

                {activeTab === 'reforge' && (
                  <button
                    onClick={handleReforge}
                    disabled={materials.mysticEssence < 4}
                    className={`w-full py-3 font-mono text-xs font-bold tracking-wider uppercase transition cursor-pointer ${
                      materials.mysticEssence >= 4
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {materials.mysticEssence >= 4 ? 'REFORGE AFFIX' : 'NEED 4 MYSTIC ESSENCE'}
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
