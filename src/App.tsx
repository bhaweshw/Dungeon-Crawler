/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TitleScreen } from './components/TitleScreen.tsx';
import { GameHud } from './components/GameHud.tsx';
import { SkillTreeModal } from './components/SkillTreeModal.tsx';
import { InventoryModal } from './components/InventoryModal.tsx';
import { CraftingForgeModal } from './components/CraftingForgeModal.tsx';
import { TradingBazaarModal } from './components/TradingBazaarModal.tsx';
import { StatusModal } from './components/StatusModals.tsx';
import { DungeonSceneManager } from './game/dungeonScene.ts';
import { calculateEffectivePlayerStats } from './game/skillTree.ts';
import { generateLootItem } from './game/lootAndCrafting.ts';
import { generateBazaarOffers } from './game/tradingEconomy.ts';
import { sounds } from './game/soundEffects.ts';
import { CraftingMaterial, Item, ItemSlot, PlayerStats, TradeOffer } from './game/types.ts';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<DungeonSceneManager | null>(null);

  // Game state machine: 'title' | 'playing' | 'paused' | 'gameover'
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>('title');
  const [endGameType, setEndGameType] = useState<'defeat' | 'victory'>('defeat');
  const [floorLevel, setFloorLevel] = useState<number>(1);
  const [hudMessage, setHudMessage] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Active sub-modals in playing state
  const [activeModal, setActiveModal] = useState<'none' | 'inventory' | 'skills' | 'forge' | 'bazaar'>('none');

  // Player Progression State
  const [unlockedSkills, setUnlockedSkills] = useState<Set<string>>(new Set());
  const [equippedGear, setEquippedGear] = useState<Partial<Record<ItemSlot, Item>>>(() => {
    const starterSword = generateLootItem(1, 'uncommon');
    starterSword.slot = 'weapon';
    starterSword.name = 'Runic Broadsword';
    starterSword.baseDamage = 24;

    const starterShield = generateLootItem(1, 'common');
    starterShield.slot = 'shield';
    starterShield.name = 'Iron Bulwark';
    starterShield.baseDefense = 12;

    return {
      weapon: starterSword,
      shield: starterShield,
    };
  });

  const [inventory, setInventory] = useState<Item[]>(() => {
    const item1 = generateLootItem(1, 'rare');
    const item2 = generateLootItem(1, 'uncommon');
    const item3 = generateLootItem(1, 'common');
    return [item1, item2, item3];
  });

  const [materials, setMaterials] = useState<Record<CraftingMaterial['id'], number>>({
    scrapMetal: 35,
    mysticEssence: 12,
    voidShard: 2,
    runicIngot: 1,
  });

  const [bazaarOffers, setBazaarOffers] = useState<TradeOffer[]>(() => generateBazaarOffers(1));

  // Dynamic Player Stats computed from level, skills, and gear
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() =>
    calculateEffectivePlayerStats(1, new Set(), {
      weapon: generateLootItem(1, 'uncommon'),
      shield: generateLootItem(1, 'common'),
    }, 120, 70, 150, 0, 1)
  );

  const notifyMessage = useCallback((msg: string) => {
    setHudMessage(msg);
    setTimeout(() => {
      setHudMessage((prev) => (prev === msg ? '' : prev));
    }, 3000);
  }, []);

  // Sync effective stats whenever equipment or unlocked skills change
  useEffect(() => {
    setPlayerStats((prev) => {
      const updated = calculateEffectivePlayerStats(
        prev.level,
        unlockedSkills,
        equippedGear,
        prev.hp,
        prev.mana,
        prev.gold,
        prev.xp,
        prev.skillPoints
      );
      if (sceneManagerRef.current) {
        sceneManagerRef.current.playerStats = updated;
      }
      return updated;
    });
  }, [unlockedSkills, equippedGear]);

  // Mirror dataset state on document.body
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Initialize 3D Dungeon Scene
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const manager = new DungeonSceneManager(canvasMountRef.current, playerStats, {
      onStatsUpdate: (newStats) => {
        setPlayerStats({ ...newStats });
      },
      onLootPickup: (item) => {
        setInventory((prev) => (prev.length < 24 ? [...prev, item] : prev));
      },
      onMaterialPickup: (matId, amount) => {
        setMaterials((prev) => ({ ...prev, [matId]: (prev[matId] || 0) + amount }));
      },
      onGoldPickup: (gold) => {
        setPlayerStats((prev) => ({ ...prev, gold: prev.gold + gold }));
      },
      onMessage: (msg) => {
        notifyMessage(msg);
      },
      onVictory: (floor) => {
        setFloorLevel(floor);
        setEndGameType('victory');
        setGameState('gameover');
      },
      onDefeat: (floor) => {
        setFloorLevel(floor);
        setEndGameType('defeat');
        setGameState('gameover');
      },
      onLevelUp: (lvl) => {
        notifyMessage(`Level Up! Hero reached Level ${lvl} (+1 Skill Point)`);
      },
    });

    sceneManagerRef.current = manager;
    manager.start();

    // Check ?autostart=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setGameState('playing');
    }

    return () => {
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, [notifyMessage]);

  // Keyboard Event Routing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const code = e.code;
      const key = e.key.toLowerCase();

      // Mute Toggle
      if (key === 'm') {
        e.preventDefault();
        sounds.muted = !sounds.muted;
        setIsMuted(sounds.muted);
        return;
      }

      // Title Screen Start
      if (gameState === 'title' && (code === 'Enter' || code === 'Space')) {
        e.preventDefault();
        handleStartGame();
        return;
      }

      // Pause toggle
      if (key === 'escape' || key === 'p') {
        e.preventDefault();
        if (activeModal !== 'none') {
          setActiveModal('none');
          return;
        }
        if (gameState === 'playing') {
          setGameState('paused');
          if (sceneManagerRef.current) sceneManagerRef.current.isRunning = false;
        } else if (gameState === 'paused') {
          setGameState('playing');
          if (sceneManagerRef.current) sceneManagerRef.current.start();
        }
        return;
      }

      if (gameState !== 'playing' || activeModal !== 'none') return;

      // Modal Shortcuts
      if (key === 'i' || code === 'Tab') {
        e.preventDefault();
        setActiveModal('inventory');
        sounds.playUiClick();
        return;
      }
      if (key === 'k') {
        e.preventDefault();
        setActiveModal('skills');
        sounds.playUiClick();
        return;
      }
      if (key === 'f') {
        e.preventDefault();
        setActiveModal('forge');
        sounds.playUiClick();
        return;
      }
      if (key === 'b') {
        e.preventDefault();
        setActiveModal('bazaar');
        sounds.playUiClick();
        return;
      }

      // Gameplay verbs
      if (code === 'Space') {
        e.preventDefault();
        sceneManagerRef.current?.triggerDodge();
        return;
      }
      if (key === 'j') {
        e.preventDefault();
        sceneManagerRef.current?.triggerAttack();
        return;
      }
      if (code === 'Digit1') {
        e.preventDefault();
        sceneManagerRef.current?.triggerSkill(1);
        return;
      }
      if (code === 'Digit2') {
        e.preventDefault();
        sceneManagerRef.current?.triggerSkill(2);
        return;
      }
      if (code === 'Digit3') {
        e.preventDefault();
        sceneManagerRef.current?.triggerSkill(3);
        return;
      }
      if (key === 'e') {
        e.preventDefault();
        sceneManagerRef.current?.triggerInteract();
        return;
      }

      // Movement keys tracking
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        sceneManagerRef.current?.keysHeld.add(code);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      sceneManagerRef.current?.keysHeld.delete(e.code);
    };

    const handleBlur = () => {
      sceneManagerRef.current?.keysHeld.clear();
      if (sceneManagerRef.current) {
        sceneManagerRef.current.touchJoystick = { x: 0, y: 0 };
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleBlur);
    };
  }, [gameState, activeModal]);

  // Click attack in canvas
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (gameState === 'playing' && activeModal === 'none') {
      sceneManagerRef.current?.triggerAttack();
    }
  };

  const handleStartGame = () => {
    setGameState('playing');
    sounds.playLevelUp();
    if (sceneManagerRef.current && !sceneManagerRef.current.isRunning) {
      sceneManagerRef.current.start();
    }
    notifyMessage('Entered Floor 1. Defeat crypt enemies and reach the exit portal!');
  };

  const handleResumeGame = () => {
    setGameState('playing');
    if (sceneManagerRef.current) {
      sceneManagerRef.current.start();
    }
  };

  const handleRestartRun = () => {
    setFloorLevel(1);
    setGameState('playing');
    setEndGameType('defeat');
    setPlayerStats((prev) => ({
      ...prev,
      hp: prev.maxHp,
      mana: prev.maxMana,
      stamina: prev.maxStamina,
    }));
    if (sceneManagerRef.current) {
      sceneManagerRef.current.floorLevel = 1;
      sceneManagerRef.current.buildDungeonWorld();
      sceneManagerRef.current.start();
    }
    notifyMessage('Restarted expedition on Floor 1.');
  };

  const handleNextFloor = () => {
    setGameState('playing');
    sceneManagerRef.current?.nextFloor();
    if (sceneManagerRef.current && !sceneManagerRef.current.isRunning) {
      sceneManagerRef.current.start();
    }
  };

  const handleReturnToTitle = () => {
    setGameState('title');
    setActiveModal('none');
  };

  // Skill Unlocking Handler
  const handleUnlockSkill = (nodeId: string) => {
    setUnlockedSkills((prev) => {
      const next = new Set(prev);
      next.add(nodeId);
      return next;
    });
    setPlayerStats((prev) => ({
      ...prev,
      skillPoints: Math.max(0, prev.skillPoints - 1),
    }));
    notifyMessage('Talent unlocked! Combat attributes permanently empowered.');
  };

  // Equipment Handlers
  const handleEquipItem = (item: Item) => {
    const currentEquipped = equippedGear[item.slot];
    setEquippedGear((prev) => ({ ...prev, [item.slot]: item }));
    setInventory((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      return currentEquipped ? [...filtered, currentEquipped] : filtered;
    });
    sounds.playUiClick();
    notifyMessage(`Equipped ${item.name}`);
  };

  const handleUnequipItem = (slot: ItemSlot) => {
    const item = equippedGear[slot];
    if (!item) return;
    if (inventory.length >= 24) {
      notifyMessage('Inventory bag is full!');
      return;
    }
    setEquippedGear((prev) => {
      const copy = { ...prev };
      delete copy[slot];
      return copy;
    });
    setInventory((prev) => [...prev, item]);
    sounds.playUiClick();
  };

  const handleDropItem = (item: Item) => {
    setInventory((prev) => prev.filter((i) => i.id !== item.id));
    notifyMessage(`Dropped ${item.name}`);
  };

  // Trading Bazaar Handlers
  const handleAcceptTrade = (offer: TradeOffer) => {
    setPlayerStats((prev) => ({ ...prev, gold: prev.gold - offer.demandedGold }));
    setMaterials((prev) => {
      const updated = { ...prev };
      offer.demandedMaterials.forEach((m) => {
        updated[m.materialId] = Math.max(0, (updated[m.materialId] || 0) - m.amount);
      });
      return updated;
    });
    setInventory((prev) => (prev.length < 24 ? [...prev, offer.offeredItem] : prev));
    setBazaarOffers((prev) => prev.filter((o) => o.id !== offer.id));
    notifyMessage(`Acquired [${offer.offeredItem.rarity.toUpperCase()}] ${offer.offeredItem.name} via Caravan Exchange!`);
  };

  const handleSellPlayerItem = (
    item: Item,
    payoutGold: number,
    payoutMaterials: { id: CraftingMaterial['id']; amount: number }[]
  ) => {
    setInventory((prev) => prev.filter((i) => i.id !== item.id));
    setPlayerStats((prev) => ({ ...prev, gold: prev.gold + payoutGold }));
    setMaterials((prev) => {
      const updated = { ...prev };
      payoutMaterials.forEach((m) => {
        updated[m.id] = (updated[m.id] || 0) + m.amount;
      });
      return updated;
    });
    notifyMessage(`Sold ${item.name} for +${payoutGold} Gold & Materials`);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Isolated WebGL Mount for stable 60fps Three.js simulation */}
      <div
        ref={canvasMountRef}
        onClick={handleCanvasClick}
        data-testid="threejs-canvas"
        className="absolute inset-0 w-full h-full cursor-crosshair z-0"
      />

      {/* Screen 1: Title Screen */}
      {gameState === 'title' && <TitleScreen onStart={handleStartGame} />}

      {/* Screen 2: Playing HUD & Low-Occlusion Controls */}
      {gameState === 'playing' && (
        <GameHud
          stats={playerStats}
          materials={materials}
          floorLevel={floorLevel}
          message={hudMessage}
          isMuted={isMuted}
          onToggleMute={() => {
            sounds.muted = !sounds.muted;
            setIsMuted(sounds.muted);
          }}
          onPause={() => {
            setGameState('paused');
            if (sceneManagerRef.current) sceneManagerRef.current.isRunning = false;
          }}
          onOpenInventory={() => {
            setActiveModal('inventory');
            sounds.playUiClick();
          }}
          onOpenSkillTree={() => {
            setActiveModal('skills');
            sounds.playUiClick();
          }}
          onOpenForge={() => {
            setActiveModal('forge');
            sounds.playUiClick();
          }}
          onOpenBazaar={() => {
            setActiveModal('bazaar');
            sounds.playUiClick();
          }}
          onTriggerAttack={() => sceneManagerRef.current?.triggerAttack()}
          onTriggerDodge={() => sceneManagerRef.current?.triggerDodge()}
          onTriggerSkill={(slot) => sceneManagerRef.current?.triggerSkill(slot)}
          onTriggerInteract={() => sceneManagerRef.current?.triggerInteract()}
          onTouchJoystickMove={(x, y) => {
            if (sceneManagerRef.current) {
              sceneManagerRef.current.touchJoystick = { x, y };
            }
          }}
        />
      )}

      {/* Playing Sub-Modal: Skill Tree */}
      {gameState === 'playing' && activeModal === 'skills' && (
        <SkillTreeModal
          unlockedNodeIds={unlockedSkills}
          skillPoints={playerStats.skillPoints}
          onUnlockSkill={handleUnlockSkill}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Playing Sub-Modal: Armory & Inventory */}
      {gameState === 'playing' && activeModal === 'inventory' && (
        <InventoryModal
          inventory={inventory}
          equipped={equippedGear}
          stats={playerStats}
          onEquipItem={handleEquipItem}
          onUnequipItem={handleUnequipItem}
          onDropItem={handleDropItem}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Playing Sub-Modal: Crafting Forge */}
      {gameState === 'playing' && activeModal === 'forge' && (
        <CraftingForgeModal
          inventory={inventory}
          materials={materials}
          gold={playerStats.gold}
          onUpdateInventory={setInventory}
          onUpdateMaterials={(newMats, newGold) => {
            setMaterials(newMats);
            setPlayerStats((prev) => ({ ...prev, gold: newGold }));
          }}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Playing Sub-Modal: Trading Bazaar */}
      {gameState === 'playing' && activeModal === 'bazaar' && (
        <TradingBazaarModal
          offers={bazaarOffers}
          inventory={inventory}
          materials={materials}
          gold={playerStats.gold}
          onAcceptTrade={handleAcceptTrade}
          onSellPlayerItem={handleSellPlayerItem}
          onRefreshOffers={() => setBazaarOffers(generateBazaarOffers(floorLevel))}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* Status Screen: Pause Modal */}
      {gameState === 'paused' && (
        <StatusModal
          type="pause"
          floorLevel={floorLevel}
          stats={playerStats}
          onResume={handleResumeGame}
          onRestart={handleRestartRun}
          onTitle={handleReturnToTitle}
        />
      )}

      {/* Status Screen: Defeat or Victory */}
      {gameState === 'gameover' && (
        <StatusModal
          type={endGameType}
          floorLevel={floorLevel}
          stats={playerStats}
          onRestart={handleRestartRun}
          onNextFloor={handleNextFloor}
          onTitle={handleReturnToTitle}
        />
      )}
    </div>
  );
}
