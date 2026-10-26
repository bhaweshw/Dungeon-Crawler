import test from 'node:test';
import assert from 'node:assert/strict';
import { canUnlockSkill, calculateEffectivePlayerStats } from './skillTree.ts';
import { generateLootItem } from './lootAndCrafting.ts';

test('skill tree prerequisites enforce branch progression', () => {
  const unlocked = new Set<string>();

  // Cannot unlock tier 2 without tier 1
  const t2Attempt = canUnlockSkill('vanguard_2_toughness', unlocked, 2);
  assert.equal(t2Attempt.allowed, false);

  // Can unlock tier 1
  const t1Attempt = canUnlockSkill('vanguard_1_cleave', unlocked, 1);
  assert.equal(t1Attempt.allowed, true);

  unlocked.add('vanguard_1_cleave');

  // Now tier 2 is allowed
  const t2Allowed = canUnlockSkill('vanguard_2_toughness', unlocked, 1);
  assert.equal(t2Allowed.allowed, true);
});

test('player stats calculate correctly with items and skills', () => {
  const unlocked = new Set<string>(['vanguard_1_cleave', 'vanguard_2_toughness']);
  const weapon = generateLootItem(1, 'rare');
  weapon.slot = 'weapon';
  weapon.baseDamage = 25;

  const stats = calculateEffectivePlayerStats(1, unlocked, { weapon });
  assert.ok(stats.maxHp > 100, 'Health boosted by toughness');
  assert.ok(stats.damage > 25, 'Damage includes weapon and skill');
  assert.ok(stats.defense > 15, 'Defense includes toughness');
});
