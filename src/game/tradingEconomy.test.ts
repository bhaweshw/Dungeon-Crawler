import test from 'node:test';
import assert from 'node:assert/strict';
import { canFulfillTrade, evaluateTradeFairness, generateBazaarOffers } from './tradingEconomy.ts';
import { generateLootItem } from './lootAndCrafting.ts';

test('trading economy evaluates fair exchange ratio', () => {
  const item = generateLootItem(2, 'rare');
  item.value = 100;

  const fairEval = evaluateTradeFairness(item, 50, [{ materialId: 'scrapMetal', amount: 6 }]); // 50 + 6*8 = 98 -> ratio ~ 0.98
  assert.equal(fairEval.verdict, 'fair');

  const steepEval = evaluateTradeFairness(item, 100, [{ materialId: 'mysticEssence', amount: 5 }]); // 100 + 5*25 = 225 -> ratio > 2
  assert.equal(steepEval.verdict, 'demanding');
});

test('bazaar offers generation and affordability check', () => {
  const offers = generateBazaarOffers(1);
  assert.equal(offers.length, 4);

  const offer = offers[0];
  const canAffordWithNothing = canFulfillTrade(offer, 0, { scrapMetal: 0, mysticEssence: 0, voidShard: 0, runicIngot: 0 });
  assert.equal(canAffordWithNothing.canAfford, false);

  const canAffordWithWealth = canFulfillTrade(offer, 99999, { scrapMetal: 999, mysticEssence: 999, voidShard: 999, runicIngot: 999 });
  assert.equal(canAffordWithWealth.canAfford, true);
});
