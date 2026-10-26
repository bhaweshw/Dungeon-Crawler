export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ItemSlot = 'weapon' | 'shield' | 'helmet' | 'armor' | 'boots' | 'relic';

export type WeaponType = 'sword' | 'daggers' | 'staff' | 'axe' | 'bow';

export interface Affix {
  id: string;
  name: string;
  type: 'damage' | 'critChance' | 'critDamage' | 'health' | 'defense' | 'attackSpeed' | 'moveSpeed' | 'elementalFire' | 'elementalFrost' | 'elementalVoid' | 'lifeLeech';
  value: number; // e.g. +15% or +25 flat
  isPercentage: boolean;
}

export interface Item {
  id: string;
  name: string;
  slot: ItemSlot;
  weaponType?: WeaponType;
  rarity: Rarity;
  level: number;
  baseDamage?: number;
  baseDefense?: number;
  affixes: Affix[];
  sockets: {
    total: number;
    gemId?: string; // e.g. 'ruby', 'sapphire', 'amethyst', 'topaz'
  };
  upgradeLevel: number; // 0 to 10
  value: number; // gold/shard value
  description: string;
  icon: string;
}

export interface CraftingMaterial {
  id: 'scrapMetal' | 'mysticEssence' | 'voidShard' | 'runicIngot';
  name: string;
  count: number;
  rarity: Rarity;
  description: string;
  icon: string;
}

export interface GemRune {
  id: string;
  name: string;
  element: 'fire' | 'frost' | 'void' | 'lightning';
  bonusDesc: string;
  color: string;
  statBonus: Affix;
}

export interface SkillNode {
  id: string;
  branch: 'vanguard' | 'shadowblade' | 'elementalist';
  name: string;
  desc: string;
  tier: number; // 1 to 5
  requires?: string[];
  isPassive: boolean;
  activeSkillKey?: string;
  icon: string;
  stats: Partial<Record<Affix['type'], number>>;
}

export interface PlayerStats {
  maxHp: number;
  hp: number;
  maxMana: number;
  mana: number;
  stamina: number;
  maxStamina: number;
  damage: number;
  defense: number;
  critChance: number; // 0.05 to 0.75
  critMultiplier: number; // 1.5 to 3.0
  attackSpeed: number; // 1.0 = normal
  moveSpeed: number;
  lifeLeech: number;
  elementalFire: number;
  elementalFrost: number;
  elementalVoid: number;
  level: number;
  xp: number;
  xpNeeded: number;
  skillPoints: number;
  gold: number;
}

export interface TradeOffer {
  id: string;
  traderName: string;
  traderTitle: string;
  offeredItem: Item;
  demandedGold: number;
  demandedMaterials: { materialId: CraftingMaterial['id']; amount: number }[];
  fairnessRating: number; // 0.8 to 1.2
  expiresInSeconds: number;
}

export interface DungeonRoom {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spawn' | 'normal' | 'shrine' | 'treasure' | 'boss';
  connectedTo: number[];
  visited: boolean;
}

export interface DungeonGrid {
  width: number;
  height: number;
  tiles: number[][]; // 0: void/wall, 1: floor, 2: door/corridor, 3: chest, 4: exitPortal, 5: shrine
  rooms: DungeonRoom[];
  spawnPos: { x: number; z: number };
  exitPos: { x: number; z: number };
  enemySpawns: { x: number; z: number; type: 'lurker' | 'arcanist' | 'juggernaut' | 'boss' }[];
  chests: { x: number; z: number; opened: boolean }[];
  torches: { x: number; z: number }[];
}
