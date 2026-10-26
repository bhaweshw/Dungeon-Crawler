import { Item, PlayerStats, SkillNode } from './types.ts';

export const SKILL_TREE_NODES: SkillNode[] = [
  // Vanguard Branch
  {
    id: 'vanguard_1_cleave',
    branch: 'vanguard',
    name: 'Cleave Strike',
    desc: 'Unlocks Cleave Strike (Slot 1): Sweeps a wide 200° arc, dealing 175% damage and staggering foes.',
    tier: 1,
    isPassive: false,
    activeSkillKey: 'cleave',
    icon: 'sword',
    stats: { damage: 5 },
  },
  {
    id: 'vanguard_2_toughness',
    branch: 'vanguard',
    name: 'Iron Carapace',
    desc: 'Passive: Hardens armor against incoming physical blows (+15 Defense, +60 Max Health).',
    tier: 2,
    requires: ['vanguard_1_cleave'],
    isPassive: true,
    icon: 'shield',
    stats: { defense: 15, health: 60 },
  },
  {
    id: 'vanguard_3_leech',
    branch: 'vanguard',
    name: 'Vampiric Thirst',
    desc: 'Passive: Melee strikes feast on enemy essence (+5% Life Leech on hit).',
    tier: 3,
    requires: ['vanguard_2_toughness'],
    isPassive: true,
    icon: 'heart',
    stats: { lifeLeech: 5 },
  },
  {
    id: 'vanguard_4_whirlwind',
    branch: 'vanguard',
    name: 'Whirlwind Tempest',
    desc: 'Unlocks Whirlwind (Slot 2): Spin with your blade for 2.5s, shredding all nearby enemies.',
    tier: 4,
    requires: ['vanguard_3_leech'],
    isPassive: false,
    activeSkillKey: 'whirlwind',
    icon: 'refresh-cw',
    stats: { damage: 15, attackSpeed: 10 },
  },
  {
    id: 'vanguard_5_colossus',
    branch: 'vanguard',
    name: 'Avatar of Might',
    desc: 'Ultimate Passive: Unlocks monumental resilience (+25% Total Damage, +120 Health, +25 Defense).',
    tier: 5,
    requires: ['vanguard_4_whirlwind'],
    isPassive: true,
    icon: 'zap',
    stats: { damage: 25, health: 120, defense: 25 },
  },

  // Shadowblade Branch
  {
    id: 'shadow_1_dash',
    branch: 'shadowblade',
    name: 'Shadow Dash',
    desc: 'Unlocks Shadow Dash (Slot 1): Phasing blink dash that strikes through enemies, ignoring unit collision.',
    tier: 1,
    isPassive: false,
    activeSkillKey: 'shadowDash',
    icon: 'wind',
    stats: { moveSpeed: 8 },
  },
  {
    id: 'shadow_2_crit',
    branch: 'shadowblade',
    name: 'Keen Edge',
    desc: 'Passive: Honed predatory instincts (+10% Critical Strike Chance, +35% Critical Damage).',
    tier: 2,
    requires: ['shadow_1_dash'],
    isPassive: true,
    icon: 'crosshair',
    stats: { critChance: 10, critDamage: 35 },
  },
  {
    id: 'shadow_3_agility',
    branch: 'shadowblade',
    name: 'Windstride Mastery',
    desc: 'Passive: Effortless fluid movement (+15% Movement Speed, +18% Attack Speed).',
    tier: 3,
    requires: ['shadow_2_crit'],
    isPassive: true,
    icon: 'feather',
    stats: { moveSpeed: 15, attackSpeed: 18 },
  },
  {
    id: 'shadow_4_flurry',
    branch: 'shadowblade',
    name: 'Blade Flurry',
    desc: 'Unlocks Blade Flurry (Slot 2): Executes 5 lightning-fast shadow cuts at 120% weapon damage.',
    tier: 4,
    requires: ['shadow_3_agility'],
    isPassive: false,
    activeSkillKey: 'bladeFlurry',
    icon: 'chevrons-right',
    stats: { critChance: 8, damage: 12 },
  },
  {
    id: 'shadow_5_assassin',
    branch: 'shadowblade',
    name: 'Deathmark Sovereign',
    desc: 'Ultimate Passive: All critical hits trigger explosive shadow ruptures (+15% Crit Chance, +65% Crit Damage).',
    tier: 5,
    requires: ['shadow_4_flurry'],
    isPassive: true,
    icon: 'skull',
    stats: { critChance: 15, critDamage: 65 },
  },

  // Elementalist Branch
  {
    id: 'elem_1_nova',
    branch: 'elementalist',
    name: 'Arcane Nova',
    desc: 'Unlocks Arcane Nova (Slot 1): Detonates a pulsing sphere of raw arcane force, knocking back enemies.',
    tier: 1,
    isPassive: false,
    activeSkillKey: 'arcaneNova',
    icon: 'sparkles',
    stats: { elementalVoid: 15 },
  },
  {
    id: 'elem_2_fire',
    branch: 'elementalist',
    name: 'Inferno Infusion',
    desc: 'Passive: Enchants weapon strikes with searing flame (+30 Fire Damage, burns target over 3s).',
    tier: 2,
    requires: ['elem_1_nova'],
    isPassive: true,
    icon: 'flame',
    stats: { elementalFire: 30 },
  },
  {
    id: 'elem_3_frost',
    branch: 'elementalist',
    name: 'Frostbite Rime',
    desc: 'Passive: Chills nearby attackers, slowing them by 30% (+25 Frost Damage, +12 Defense).',
    tier: 3,
    requires: ['elem_2_fire'],
    isPassive: true,
    icon: 'snowflake',
    stats: { elementalFrost: 25, defense: 12 },
  },
  {
    id: 'elem_4_meteor',
    branch: 'elementalist',
    name: 'Cataclysm Meteor',
    desc: 'Unlocks Meteor (Slot 2): Summons an apocalyptic falling star that shatters the ground in a 5m blast.',
    tier: 4,
    requires: ['elem_3_frost'],
    isPassive: false,
    activeSkillKey: 'meteor',
    icon: 'sun',
    stats: { elementalFire: 25, damage: 20 },
  },
  {
    id: 'elem_5_archmage',
    branch: 'elementalist',
    name: 'Abyssal Ascendant',
    desc: 'Ultimate Passive: Master of void and elemental realms (+50 Void Damage, +25% Elemental Damage, +80 Max Mana).',
    tier: 5,
    requires: ['elem_4_meteor'],
    isPassive: true,
    icon: 'moon',
    stats: { elementalVoid: 50, damage: 25 },
  },
];

export function canUnlockSkill(nodeId: string, unlockedNodeIds: Set<string>, availablePoints: number): { allowed: boolean; reason?: string } {
  if (unlockedNodeIds.has(nodeId)) {
    return { allowed: false, reason: 'Skill already unlocked' };
  }
  if (availablePoints < 1) {
    return { allowed: false, reason: 'No skill points available' };
  }
  const node = SKILL_TREE_NODES.find((n) => n.id === nodeId);
  if (!node) {
    return { allowed: false, reason: 'Skill does not exist' };
  }
  if (node.requires && node.requires.length > 0) {
    for (const req of node.requires) {
      if (!unlockedNodeIds.has(req)) {
        const reqNode = SKILL_TREE_NODES.find((n) => n.id === req);
        return { allowed: false, reason: `Requires ${reqNode ? reqNode.name : req}` };
      }
    }
  }
  return { allowed: true };
}

export function calculateEffectivePlayerStats(
  baseLevel: number,
  unlockedNodeIds: Set<string>,
  equippedItems: Partial<Record<string, Item>>,
  currentHp?: number,
  currentMana?: number,
  gold: number = 100,
  xp: number = 0,
  skillPoints: number = 0
): PlayerStats {
  const baseHp = 100 + (baseLevel - 1) * 20;
  const baseMana = 60 + (baseLevel - 1) * 10;
  const baseDamage = 10 + (baseLevel - 1) * 3;
  const baseDefense = 4 + (baseLevel - 1) * 2;
  const baseCrit = 0.05; // 5%
  const baseCritMult = 1.5; // 150%

  let addedHp = 0;
  let addedMana = 0;
  let addedDamage = 0;
  let addedDefense = 0;
  let addedCritChance = 0;
  let addedCritMult = 0;
  let addedAttackSpeed = 0;
  let addedMoveSpeed = 0;
  let lifeLeech = 0;
  let elementalFire = 0;
  let elementalFrost = 0;
  let elementalVoid = 0;

  // Add Skill Tree Bonuses
  unlockedNodeIds.forEach((nodeId) => {
    const node = SKILL_TREE_NODES.find((n) => n.id === nodeId);
    if (!node) return;
    if (node.stats.health) addedHp += node.stats.health;
    if (node.stats.defense) addedDefense += node.stats.defense;
    if (node.stats.damage) addedDamage += node.stats.damage;
    if (node.stats.critChance) addedCritChance += node.stats.critChance / 100;
    if (node.stats.critDamage) addedCritMult += node.stats.critDamage / 100;
    if (node.stats.attackSpeed) addedAttackSpeed += node.stats.attackSpeed / 100;
    if (node.stats.moveSpeed) addedMoveSpeed += node.stats.moveSpeed / 100;
    if (node.stats.lifeLeech) lifeLeech += node.stats.lifeLeech;
    if (node.stats.elementalFire) elementalFire += node.stats.elementalFire;
    if (node.stats.elementalFrost) elementalFrost += node.stats.elementalFrost;
    if (node.stats.elementalVoid) elementalVoid += node.stats.elementalVoid;
  });

  // Add Equipped Item Stats
  Object.values(equippedItems).forEach((item) => {
    if (!item) return;
    if (item.baseDamage) addedDamage += item.baseDamage;
    if (item.baseDefense) addedDefense += item.baseDefense;

    item.affixes.forEach((affix) => {
      switch (affix.type) {
        case 'damage':
          addedDamage += affix.value;
          break;
        case 'defense':
          addedDefense += affix.value;
          break;
        case 'health':
          addedHp += affix.value;
          break;
        case 'critChance':
          addedCritChance += affix.value / 100;
          break;
        case 'critDamage':
          addedCritMult += affix.value / 100;
          break;
        case 'attackSpeed':
          addedAttackSpeed += affix.value / 100;
          break;
        case 'moveSpeed':
          addedMoveSpeed += affix.value / 100;
          break;
        case 'lifeLeech':
          lifeLeech += affix.value;
          break;
        case 'elementalFire':
          elementalFire += affix.value;
          break;
        case 'elementalFrost':
          elementalFrost += affix.value;
          break;
        case 'elementalVoid':
          elementalVoid += affix.value;
          break;
      }
    });
  });

  const maxHp = Math.round(baseHp + addedHp);
  const maxMana = Math.round(baseMana + addedMana);
  const totalDamage = Math.round(baseDamage + addedDamage);
  const totalDefense = Math.round(baseDefense + addedDefense);
  const critChance = Math.min(0.85, baseCrit + addedCritChance);
  const critMultiplier = baseCritMult + addedCritMult;
  const attackSpeed = 1.0 + addedAttackSpeed;
  const moveSpeed = 6.0 * (1.0 + addedMoveSpeed);

  const xpNeeded = baseLevel * 100;

  return {
    maxHp,
    hp: currentHp !== undefined ? Math.min(currentHp, maxHp) : maxHp,
    maxMana,
    mana: currentMana !== undefined ? Math.min(currentMana, maxMana) : maxMana,
    stamina: 100,
    maxStamina: 100,
    damage: totalDamage,
    defense: totalDefense,
    critChance,
    critMultiplier,
    attackSpeed,
    moveSpeed,
    lifeLeech,
    elementalFire,
    elementalFrost,
    elementalVoid,
    level: baseLevel,
    xp,
    xpNeeded,
    skillPoints,
    gold,
  };
}
