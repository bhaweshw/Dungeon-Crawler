import React, { useState } from 'react';
import { X, Store, Scale, Coins, ArrowRightLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { CraftingMaterial, Item, TradeOffer } from '../game/types.ts';
import { canFulfillTrade, evaluateTradeFairness } from '../game/tradingEconomy.ts';
import { sounds } from '../game/soundEffects.ts';

interface TradingBazaarModalProps {
  offers: TradeOffer[];
  inventory: Item[];
  materials: Record<CraftingMaterial['id'], number>;
  gold: number;
  onAcceptTrade: (offer: TradeOffer) => void;
  onSellPlayerItem: (item: Item, payoutGold: number, payoutMaterials: { id: CraftingMaterial['id']; amount: number }[]) => void;
  onRefreshOffers: () => void;
  onClose: () => void;
}

export const TradingBazaarModal: React.FC<TradingBazaarModalProps> = ({
  offers,
  inventory,
  materials,
  gold,
  onAcceptTrade,
  onSellPlayerItem,
  onRefreshOffers,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'bazaar' | 'sell'>('bazaar');
  const [selectedOffer, setSelectedOffer] = useState<TradeOffer | null>(offers[0] || null);
  const [selectedSellItem, setSelectedSellItem] = useState<Item | null>(inventory[0] || null);

  const handleBuy = (offer: TradeOffer) => {
    const check = canFulfillTrade(offer, gold, materials);
    if (check.canAfford) {
      onAcceptTrade(offer);
      sounds.playLootDrop(offer.offeredItem.rarity);
    }
  };

  const handleSell = () => {
    if (!selectedSellItem) return;
    const goldPayout = Math.round(selectedSellItem.value * 0.85);
    const matPayout: { id: CraftingMaterial['id']; amount: number }[] = [
      { id: 'scrapMetal', amount: Math.max(3, Math.floor(selectedSellItem.level * 2)) },
    ];
    if (selectedSellItem.rarity === 'epic' || selectedSellItem.rarity === 'legendary') {
      matPayout.push({ id: 'voidShard', amount: 1 });
    } else if (selectedSellItem.rarity === 'rare') {
      matPayout.push({ id: 'mysticEssence', amount: 2 });
    }

    onSellPlayerItem(selectedSellItem, goldPayout, matPayout);
    setSelectedSellItem(inventory.filter((i) => i.id !== selectedSellItem.id)[0] || null);
    sounds.playUiClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 pointer-events-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-700 shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <Store className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold font-mono tracking-wider text-slate-100">OUTPOST TRADING BAZAAR</h2>
              <p className="text-xs text-slate-400 font-mono">Balanced Player & Caravan Exchange Economy</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700 text-xs font-mono">
              <span className="text-amber-400 font-bold">🪙 {gold} Gold</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close Bazaar"
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-slate-800 bg-slate-900/40">
          <button
            onClick={() => {
              setActiveTab('bazaar');
              sounds.playUiClick();
            }}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-mono font-bold tracking-wider transition border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'bazaar'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            CARAVAN TRADES ({offers.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('sell');
              sounds.playUiClick();
            }}
            className={`flex-1 py-3 text-center text-xs sm:text-sm font-mono font-bold tracking-wider transition border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'sell'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-4 h-4" />
            SELL & BARTER BAG GEAR
          </button>
        </div>

        {/* Tab 1: Caravan Bazaar */}
        {activeTab === 'bazaar' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
            {/* Offer List */}
            <div className="w-full md:w-80 p-4 bg-slate-900/30 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Active Listings</span>
                <button
                  onClick={onRefreshOffers}
                  className="text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
                >
                  Refresh Caravan
                </button>
              </div>

              <div className="flex flex-col gap-2 overflow-y-auto max-h-[380px]">
                {offers.map((offer) => {
                  const evalResult = evaluateTradeFairness(
                    offer.offeredItem,
                    offer.demandedGold,
                    offer.demandedMaterials
                  );
                  const isSelected = selectedOffer?.id === offer.id;

                  return (
                    <button
                      key={offer.id}
                      onClick={() => {
                        setSelectedOffer(offer);
                        sounds.playUiClick();
                      }}
                      className={`p-3 border text-left font-mono transition cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'border-emerald-400 bg-slate-900 shadow-lg'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate max-w-[170px]">
                          {offer.offeredItem.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 font-bold uppercase ${
                            evalResult.verdict === 'generous'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : evalResult.verdict === 'fair'
                              ? 'bg-sky-950 text-sky-300 border border-sky-700'
                              : 'bg-rose-950 text-rose-300 border border-rose-700'
                          }`}
                        >
                          {evalResult.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{offer.traderName}</span>
                        <span className="text-amber-400 font-bold">🪙 {offer.demandedGold}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Offer Detail Stage */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              {selectedOffer ? (
                <div className="flex flex-col gap-5">
                  {/* Trader Banner */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300">
                      Merchant: <strong className="text-white">{selectedOffer.traderName}</strong> ({selectedOffer.traderTitle})
                    </span>
                    <span className="text-emerald-400 font-bold">Verified Fair Exchange</span>
                  </div>

                  {/* Offered Item */}
                  <div className="p-4 bg-slate-950 border border-slate-800 flex flex-col gap-3 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase text-amber-400 font-bold">
                        [OFFERING] {selectedOffer.offeredItem.rarity} {selectedOffer.offeredItem.slot}
                      </span>
                      <span className="text-slate-400 text-xs">LVL {selectedOffer.offeredItem.level}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{selectedOffer.offeredItem.name}</h3>

                    <div className="flex gap-4 text-xs">
                      {selectedOffer.offeredItem.baseDamage && (
                        <span className="text-amber-400 font-bold">
                          {selectedOffer.offeredItem.baseDamage} Base Damage
                        </span>
                      )}
                      {selectedOffer.offeredItem.baseDefense && (
                        <span className="text-sky-400 font-bold">
                          {selectedOffer.offeredItem.baseDefense} Base Defense
                        </span>
                      )}
                      <span className="text-purple-400 font-bold">
                        Market Value: 🪙 {selectedOffer.offeredItem.value}
                      </span>
                    </div>

                    {/* Affixes */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedOffer.offeredItem.affixes.map((a, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[11px] text-emerald-300"
                        >
                          {a.name} (+{a.value}
                          {a.isPercentage ? '%' : ''})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Demanded Payment */}
                  <div className="p-4 bg-slate-900/40 border border-slate-800 flex flex-col gap-2 font-mono">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-amber-400" />
                      Required Exchange Consideration:
                    </span>

                    <div className="flex items-center gap-4 text-xs mt-1">
                      <div className="flex items-center gap-1.5 text-amber-300">
                        <span>🪙</span>
                        <span>{selectedOffer.demandedGold} Gold (You have {gold})</span>
                      </div>
                      {selectedOffer.demandedMaterials.map((m, idx) => {
                        const playerHas = materials[m.materialId] || 0;
                        const hasEnough = playerHas >= m.amount;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-1.5 ${
                              hasEnough ? 'text-sky-300' : 'text-red-400 font-bold'
                            }`}
                          >
                            <span className="text-amber-400">•</span>
                            <span>
                              {m.amount} {m.materialId} (Have: {playerHas})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="my-auto text-center text-slate-600 font-mono text-xs">Select an offer.</div>
              )}

              {/* Action Button */}
              {selectedOffer && (
                <div className="mt-6 pt-4 border-t border-slate-800">
                  {(() => {
                    const check = canFulfillTrade(selectedOffer, gold, materials);
                    return (
                      <button
                        onClick={() => handleBuy(selectedOffer)}
                        disabled={!check.canAfford}
                        className={`w-full py-3 font-mono text-xs font-bold tracking-wider uppercase transition cursor-pointer shadow-lg ${
                          check.canAfford
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        {check.canAfford
                          ? 'EXECUTE FAIR EXCHANGE'
                          : `MISSING: ${check.missing.join(', ')}`}
                      </button>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Sell & Barter Bag Gear */}
        {activeTab === 'sell' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
            {/* Gear Selector */}
            <div className="w-full md:w-80 p-4 bg-slate-900/30 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col gap-2">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Bag Gear ({inventory.length})</span>
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[380px]">
                {inventory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedSellItem(item);
                      sounds.playUiClick();
                    }}
                    className={`p-2.5 border text-left font-mono transition cursor-pointer flex items-center justify-between ${
                      selectedSellItem?.id === item.id
                        ? 'border-amber-400 bg-slate-900 shadow-lg'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">{item.name}</div>
                      <span className="text-[10px] text-slate-400 uppercase">{item.rarity} {item.slot}</span>
                    </div>
                    <span className="text-amber-400 text-xs font-bold">🪙 {Math.round(item.value * 0.85)}</span>
                  </button>
                ))}
                {inventory.length === 0 && (
                  <div className="text-xs text-slate-600 font-mono py-8 text-center">No gear in bag to sell</div>
                )}
              </div>
            </div>

            {/* Sell Inspection */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              {selectedSellItem ? (
                <div className="flex flex-col gap-5 font-mono">
                  <div className="p-4 bg-slate-950 border border-slate-800">
                    <span className="text-xs uppercase text-amber-400 font-bold">
                      {selectedSellItem.rarity} {selectedSellItem.slot}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{selectedSellItem.name}</h3>
                    <p className="text-xs text-slate-400 mt-2">{selectedSellItem.description}</p>
                  </div>

                  <div className="p-4 bg-slate-900/40 border border-slate-800 flex flex-col gap-2">
                    <span className="text-xs text-slate-400 font-bold uppercase">Trade-In Compensation:</span>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-amber-400 font-bold">🪙 +{Math.round(selectedSellItem.value * 0.85)} Gold</span>
                      <span className="text-slate-300">
                        +{Math.max(3, Math.floor(selectedSellItem.level * 2))} Scrap Metal
                      </span>
                      {selectedSellItem.rarity === 'rare' && (
                        <span className="text-sky-400">+2 Mystic Essence</span>
                      )}
                      {(selectedSellItem.rarity === 'epic' || selectedSellItem.rarity === 'legendary') && (
                        <span className="text-purple-400">+1 Void Shard</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="my-auto text-center text-slate-600 font-mono text-xs">Select gear to sell.</div>
              )}

              {selectedSellItem && (
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button
                    onClick={handleSell}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-xs font-bold tracking-wider uppercase transition cursor-pointer shadow-lg"
                  >
                    SELL TO OUTPOST BAZAAR
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
