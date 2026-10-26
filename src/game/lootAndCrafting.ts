import { Affix, CraftingMaterial, GemRune, Item, ItemSlot, Rarity, WeaponType } from './types.ts';

export const GEM_RUNES: Record<string, GemRune> = {
  ruby: {
    id: 'ruby',
    name: 'Ruby of Hellfire',
    element: 'fire',
    bonusDesc: '+35 Fire Burn Damage & Flaming Edge',
    color: '#ef4444',
    statBonus: { id: 'gem_fire', name: 'Infernal Flame', type: 'elementalFire', value: 35, isPercentage: false },
  },
  sapphire: {
    id: 'sapphire',
    name: 'Sapphire of Glaciers',
    element: 'frost',
    bonusDesc: '+30 Frost Chill Damage & Slows Enemies',
    color: '#38bdf8',
    statBonus: { id: 'gem_frost', name: 'Glacial Chill', type: 'elementalFrost', value: 30, isPercentage: false },
  },
  amethyst: {
    id: 'amethyst',
    name: 'Amethyst of the Void',
    element: 'void',
    bonusDesc: '+40 Void Corruption & 5% Life Leech',
    color: '#a855f7',
    statBonus: { id: 'gem_void', name: 'Abyssal Siphon', type: 'elementalVoid', value: 40, isPercentage: false },
  },
  topaz: {
    id: 'topaz',
    name: 'Topaz of Thunder',
    element: 'lightning',
    bonusDesc: '+25% Attack Speed & Shock Trails',
    color: '#eab308',
    statBonus: { id: 'gem_topaz', name: 'Static Surge', type: 'attackSpeed', value: 25, isPercentage: true },
  },
};

const AFFIX_POOL: { type: Affix['type']; name: string; isPercentage: boolean; min: number; max: number }[] = [
  { type: 'damage', name: 'Brutal Edge', isPercentage: false, min: 5, max: 15 },
  { type: 'damage', name: 'Slayer\'s Power', isPercentage: true, min: 10, max: 30 },
  { type: 'critChance', name: 'Deadeye Focus', isPercentage: true, min: 4, max: 12 },
  { type: 'critDamage', name: 'Executioner\'s Might', isPercentage: true, min: 15, max: 45 },
  { type: 'health', name: 'Titan\'s Vigor', isPercentage: false, min: 25, max: 80 },
  { type: 'defense', name: 'Iron Bastion', isPercentage: false, min: 6, max: 18 },
  { type: 'attackSpeed', name: 'Windstride Flurry', isPercentage: true, min: 8, max: 20 },
  { type: 'moveSpeed', name: 'Fleetfoot Agility', isPercentage: true, min: 6, max: 14 },
  { type: 'elementalFire', name: 'Molten Core', isPercentage: false, min: 12, max: 28 },
  { type: 'elementalFrost', name: 'Permafrost Rime', isPercentage: false, min: 10, max: 24 },
  { type: 'elementalVoid', name: 'Void Tendrils', isPercentage: false, min: 14, max: 32 },
  { type: 'lifeLeech', name: 'Vampiric Thirst', isPercentage: true, min: 2, max: 6 },
];

const WEAPON_NAMES: Record<WeaponType, string[]> = {
  sword: ['Iron Longsword', 'Runic Broadsword', 'Abyssal Greatblade', 'Vanguard Edge', 'Sunshard Blade'],
  axe: ['Battle Axe', 'War Cleaver', 'Executioner Hatchet', 'Dread Greataxe', 'Runeforged Chopper'],
  staff: ['Oak Scepter', 'Arcane Staff', 'Void Catalyst', 'Frostweave Spire', 'Astral Conduit'],
  daggers: ['Twin Stilettos', 'Shadow Daggers', 'Venom Fangs', 'Quickblades', 'Nightfall Kriss'],
  bow: ['Recurve Bow', 'War Longbow', 'Composite Crossbow', 'Shadowstring', 'Gale Piercer'],
};

const ARMOR_NAMES: Record<ItemSlot, string[]> = {
  weapon: [],
  shield: ['Round Targe', 'Kite Shield', 'Tower Bulwark', 'Aegis of Radiance'],
  helmet: ['Iron Sallet', 'Greathelm', 'Shadow Hood', 'Arcane Circlet', 'Warden Crown'],
  armor: ['Chain Hauberk', 'Plate Carapace', 'Rogue Tunic', 'Mystic Robes', 'Dread Cuirass'],
  boots: ['Leather Boots', 'Steel Greaves', 'Shadow Striders', 'Hermes Tread'],
  relic: ['Bone Talisman', 'Soul Stone', 'Obsidian Signet', 'Phoenix Feather', 'Void Core'],
};

export function generateLootItem(floorLevel: number = 1, forceRarity?: Rarity): Item {
  const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  let rarity: Rarity = forceRarity || 'common';

  if (!forceRarity) {
    const roll = Math.random() * 100;
    const bonus = floorLevel * 3;
    if (roll < 45 - bonus) rarity = 'common';
    else if (roll < 75 - bonus * 0.5) rarity = 'uncommon';
    else if (roll < 92) rarity = 'rare';
    else if (roll < 98) rarity = 'epic';
    else rarity = 'legendary';
  }

  const slots: ItemSlot[] = ['weapon', 'shield', 'helmet', 'armor', 'boots', 'relic'];
  const slot = slots[Math.floor(Math.random() * slots.length)];

  const affixCountMap: Record<Rarity, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
  };

  const affixCount = affixCountMap[rarity];
  const shuffledAffixes = [...AFFIX_POOL].sort(() => Math.random() - 0.5);
  const affixes: Affix[] = [];

  for (let i = 0; i < affixCount; i++) {
    const template = shuffledAffixes[i];
    const scale = 1 + floorLevel * 0.15;
    const value = Math.round((template.min + Math.random() * (template.max - template.min)) * scale);
    affixes.push({
      id: `${template.type}_${i}`,
      name: template.name,
      type: template.type,
      value,
      isPercentage: template.isPercentage,
    });
  }

  let weaponType: WeaponType | undefined;
  let baseDamage: number | undefined;
  let baseDefense: number | undefined;
  let name = '';

  if (slot === 'weapon') {
    const types: WeaponType[] = ['sword', 'axe', 'staff', 'daggers', 'bow'];
    weaponType = types[Math.floor(Math.random() * types.length)];
    const names = WEAPON_NAMES[weaponType];
    name = names[Math.floor(Math.random() * names.length)];
    baseDamage = Math.round((14 + floorLevel * 4 + (weaponType === 'axe' ? 5 : weaponType === 'daggers' ? -3 : 0)) * (1 + (affixCount - 1) * 0.1));
  } else {
    const names = ARMOR_NAMES[slot];
    name = names[Math.floor(Math.random() * names.length)];
    baseDefense = Math.round(5 + floorLevel * 2 + (slot === 'armor' ? 6 : slot === 'shield' ? 5 : 0));
  }

  const prefixTitles: Record<Rarity, string[]> = {
    common: ['Worn', 'Sturdy', 'Dull'],
    uncommon: ['Reinforced', 'Sharpened', 'Tempered'],
    rare: ['Gleaming', 'Runic', 'Ancestral'],
    epic: ['Abyssal', 'Dragonforged', 'Celestial'],
    legendary: ['Godslayer\'s', 'Voidborn', 'Mythic Sovereign'],
  };
  const prefix = prefixTitles[rarity][Math.floor(Math.random() * prefixTitles[rarity].length)];
  const fullName = `${prefix} ${name}`;

  const socketTotal = rarity === 'legendary' ? 1 : rarity === 'epic' && Math.random() > 0.4 ? 1 : 0;
  const value = calculateItemValue(rarity, floorLevel, affixes.length);

  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: fullName,
    slot,
    weaponType,
    rarity,
    level: floorLevel,
    baseDamage,
    baseDefense,
    affixes,
    sockets: {
      total: socketTotal,
      gemId: undefined,
    },
    upgradeLevel: 0,
    value,
    description: `A ${rarity} level ${floorLevel} ${slot} forged for dungeon survival.`,
    icon: slot === 'weapon' ? (weaponType || 'sword') : slot,
  };
}

export function calculateItemValue(rarity: Rarity, level: number, affixCount: number): number {
  const baseMultiplier: Record<Rarity, number> = {
    common: 15,
    uncommon: 40,
    rare: 90,
    epic: 200,
    legendary: 500,
  };
  return Math.round(baseMultiplier[rarity] * (1 + level * 0.2) + affixCount * 12);
}

export function calculateItemPowerScore(item: Item): number {
  let score = (item.baseDamage || 0) * 2 + (item.baseDefense || 0) * 2.5;
  item.affixes.forEach((a) => {
    score += a.value * (a.isPercentage ? 1.5 : 0.8);
  });
  score += item.upgradeLevel * 25;
  if (item.sockets.gemId) score += 40;
  return Math.round(score);
}

export function salvageItem(item: Item): { materials: Record<CraftingMaterial['id'], number>; gold: number } {
  const mats: Record<CraftingMaterial['id'], number> = {
    scrapMetal: 0,
    mysticEssence: 0,
    voidShard: 0,
    runicIngot: 0,
  };

  switch (item.rarity) {
    case 'common':
      mats.scrapMetal = 4 + item.level;
      break;
    case 'uncommon':
      mats.scrapMetal = 8 + item.level * 2;
      mats.mysticEssence = 2;
      break;
    case 'rare':
      mats.scrapMetal = 15 + item.level * 2;
      mats.mysticEssence = 5 + item.level;
      break;
    case 'epic':
      mats.scrapMetal = 25 + item.level * 3;
      mats.mysticEssence = 10 + item.level * 2;
      mats.voidShard = 2;
      break;
    case 'legendary':
      mats.scrapMetal = 40 + item.level * 4;
      mats.mysticEssence = 20 + item.level * 3;
      mats.voidShard = 5;
      mats.runicIngot = 1;
      break;
  }

  // Bonus materials if upgraded
  if (item.upgradeLevel > 0) {
    mats.scrapMetal += item.upgradeLevel * 5;
    mats.mysticEssence += item.upgradeLevel * 2;
  }

  const gold = Math.round(item.value * 0.35);
  return { materials: mats, gold };
}

export function getUpgradeCost(item: Item): { scrapMetal: number; mysticEssence: number; gold: number; canUpgrade: boolean } {
  if (item.upgradeLevel >= 10) {
    return { scrapMetal: 0, mysticEssence: 0, gold: 0, canUpgrade: false };
  }
  const nextLevel = item.upgradeLevel + 1;
  return {
    scrapMetal: nextLevel * 6,
    mysticEssence: Math.max(1, Math.floor(nextLevel * 1.5)),
    gold: nextLevel * 25,
    canUpgrade: true,
  };
}

export function applyModularUpgrade(item: Item): Item {
  if (item.upgradeLevel >= 10) return item;
  const updated = JSON.parse(JSON.stringify(item)) as Item;
  updated.upgradeLevel += 1;
  if (updated.baseDamage) {
    updated.baseDamage = Math.round(updated.baseDamage * 1.15 + 2);
  }
  if (updated.baseDefense) {
    updated.baseDefense = Math.round(updated.baseDefense * 1.15 + 1);
  }
  updated.value = Math.round(updated.value * 1.25);
  return updated;
}

export function socketGemIntoItem(item: Item, gemId: string): Item | null {
  if (item.sockets.total <= 0 || item.sockets.gemId) return null;
  const gem = GEM_RUNES[gemId];
  if (!gem) return null;

  const updated = JSON.parse(JSON.stringify(item)) as Item;
  updated.sockets.gemId = gemId;
  updated.affixes.push(gem.statBonus);
  updated.value += 75;
  return updated;
}

export function rerollItemAffix(item: Item, affixIndex: number): Item | null {
  if (affixIndex < 0 || affixIndex >= item.affixes.length) return null;
  const updated = JSON.parse(JSON.stringify(item)) as Item;
  const template = AFFIX_POOL[Math.floor(Math.random() * AFFIX_POOL.length)];
  const scale = 1 + item.level * 0.15;
  const value = Math.round((template.min + Math.random() * (template.max - template.min)) * scale);

  updated.affixes[affixIndex] = {
    id: `${template.type}_${Date.now()}`,
    name: template.name,
    type: template.type,
    value,
    isPercentage: template.isPercentage,
  };
  return updated;
}
