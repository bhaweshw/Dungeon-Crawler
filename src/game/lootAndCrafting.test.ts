import test from 'node:test';
import assert from 'node:assert/strict';
import { applyModularUpgrade, generateLootItem, getUpgradeCost, salvageItem, socketGemIntoItem } from './lootAndCrafting.ts';

test('loot generation generates proper rarity and affixes', () => {
  const commonItem = generateLootItem(1, 'common');
  assert.equal(commonItem.rarity, 'common');
  assert.equal(commonItem.affixes.length, 1);

  const legendaryItem = generateLootItem(3, 'legendary');
  assert.equal(legendaryItem.rarity, 'legendary');
  assert.equal(legendaryItem.affixes.length, 5);
  assert.ok(legendaryItem.sockets.total >= 1);
  assert.ok(legendaryItem.value > commonItem.value);
});

test('modular upgrade increases item damage and defense', () => {
  const sword = generateLootItem(1, 'uncommon');
  sword.slot = 'weapon';
  sword.baseDamage = 20;
  sword.upgradeLevel = 0;

  const cost = getUpgradeCost(sword);
  assert.equal(cost.canUpgrade, true);
  assert.ok(cost.scrapMetal > 0);

  const upgraded = applyModularUpgrade(sword);
  assert.equal(upgraded.upgradeLevel, 1);
  assert.ok((upgraded.baseDamage || 0) > 20);
});

test('salvage returns materials scaled by item rarity', () => {
  const common = generateLootItem(1, 'common');
  const epic = generateLootItem(1, 'epic');

  const commonSal = salvageItem(common);
  const epicSal = salvageItem(epic);

  assert.ok(commonSal.materials.scrapMetal > 0);
  assert.equal(commonSal.materials.voidShard, 0);

  assert.ok(epicSal.materials.scrapMetal > commonSal.materials.scrapMetal);
  assert.ok(epicSal.materials.voidShard > 0);
});

test('socketing gems into items appends elemental affixes', () => {
  const item = generateLootItem(2, 'legendary');
  item.sockets.total = 1;
  item.sockets.gemId = undefined;
  const initialAffixCount = item.affixes.length;

  const socketed = socketGemIntoItem(item, 'ruby');
  assert.ok(socketed !== null);
  assert.equal(socketed!.sockets.gemId, 'ruby');
  assert.equal(socketed!.affixes.length, initialAffixCount + 1);
  const fireAffix = socketed!.affixes.find(a => a.type === 'elementalFire');
  assert.ok(fireAffix !== undefined);
});
