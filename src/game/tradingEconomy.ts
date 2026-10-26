import { generateLootItem } from './lootAndCrafting.ts';
import { CraftingMaterial, Item, Rarity, TradeOffer } from './types.ts';

const MATERIAL_BASE_VALUES: Record<CraftingMaterial['id'], number> = {
  scrapMetal: 8,
  mysticEssence: 25,
  voidShard: 80,
  runicIngot: 250,
};

const TRADERS = [
  { name: 'Kaelen the Blacksmith', title: 'Wandering Weaponsmith' },
  { name: 'Sylvia of the Veil', title: 'Arcane Collector' },
  { name: 'Torvald Greybeard', title: 'Dungeon Scavenger' },
  { name: 'Morwenna Shadowstep', title: 'Smuggler of Relics' },
  { name: 'Brother Ignis', title: 'Priest of the Ember' },
];

export function calculateTradeValue(
  item: Item,
  goldAmount: number = 0,
  materials: { materialId: CraftingMaterial['id']; amount: number }[] = []
): number {
  let total = item.value + goldAmount;
  materials.forEach((m) => {
    const unitVal = MATERIAL_BASE_VALUES[m.materialId] || 10;
    total += unitVal * m.amount;
  });
  return total;
}

export function evaluateTradeFairness(offeredItem: Item, demandedGold: number, demandedMaterials: { materialId: CraftingMaterial['id']; amount: number }[]): {
  ratio: number;
  verdict: 'generous' | 'fair' | 'demanding';
  label: string;
} {
  const itemValue = offeredItem.value;
  let demandValue = demandedGold;
  demandedMaterials.forEach((m) => {
    demandValue += (MATERIAL_BASE_VALUES[m.materialId] || 10) * m.amount;
  });

  const ratio = demandValue / Math.max(1, itemValue);

  if (ratio <= 0.88) {
    return { ratio, verdict: 'generous', label: 'Bargain (Favor Player)' };
  } else if (ratio <= 1.12) {
    return { ratio, verdict: 'fair', label: 'Fair Exchange' };
  } else {
    return { ratio, verdict: 'demanding', label: 'Premium / Steep' };
  }
}

export function generateBazaarOffers(playerLevel: number = 1): TradeOffer[] {
  const offers: TradeOffer[] = [];
  const count = 4;

  const targetRarities: Rarity[] = ['uncommon', 'rare', 'rare', 'epic'];

  for (let i = 0; i < count; i++) {
    const trader = TRADERS[i % TRADERS.length];
    const rarity = targetRarities[i];
    const item = generateLootItem(playerLevel, rarity);

    // Calculate fair gold + materials demand
    const targetValue = Math.round(item.value * (0.9 + Math.random() * 0.2)); // 90% to 110% fair value
    const goldPortion = Math.round(targetValue * 0.5);
    const matRemainder = targetValue - goldPortion;

    const materials: { materialId: CraftingMaterial['id']; amount: number }[] = [];
    if (matRemainder > 0) {
      if (rarity === 'epic' || rarity === 'legendary') {
        materials.push({ materialId: 'voidShard', amount: Math.max(1, Math.floor(matRemainder / 80)) });
        materials.push({ materialId: 'mysticEssence', amount: 3 });
      } else if (rarity === 'rare') {
        materials.push({ materialId: 'mysticEssence', amount: Math.max(2, Math.floor(matRemainder / 25)) });
      } else {
        materials.push({ materialId: 'scrapMetal', amount: Math.max(5, Math.floor(matRemainder / 8)) });
      }
    }

    const evalResult = evaluateTradeFairness(item, goldPortion, materials);

    offers.push({
      id: `offer_${Date.now()}_${i}`,
      traderName: trader.name,
      traderTitle: trader.title,
      offeredItem: item,
      demandedGold: goldPortion,
      demandedMaterials: materials,
      fairnessRating: evalResult.ratio,
      expiresInSeconds: 300,
    });
  }

  return offers;
}

export function canFulfillTrade(
  offer: TradeOffer,
  playerGold: number,
  playerMaterials: Record<CraftingMaterial['id'], number>
): { canAfford: boolean; missing: string[] } {
  const missing: string[] = [];
  if (playerGold < offer.demandedGold) {
    missing.push(`${offer.demandedGold - playerGold} Gold`);
  }
  offer.demandedMaterials.forEach((m) => {
    const current = playerMaterials[m.materialId] || 0;
    if (current < m.amount) {
      missing.push(`${m.amount - current} ${m.materialId}`);
    }
  });

  return {
    canAfford: missing.length === 0,
    missing,
  };
}
