import * as THREE from 'three';
import { generateProceduralDungeon, isWalkable } from './dungeonGenerator.ts';
import { generateLootItem } from './lootAndCrafting.ts';
import {
  createChestModel,
  createEnemyModel,
  createHeroModel,
  createPortalModel,
  DungeonMaterials,
} from './proceduralModels.ts';
import { ParticlePool } from './combatAndParticles.ts';
import { sounds } from './soundEffects.ts';
import { CraftingMaterial, DungeonGrid, Item, PlayerStats, Rarity } from './types.ts';

export interface SceneCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onLootPickup: (item: Item) => void;
  onMaterialPickup: (matId: CraftingMaterial['id'], amount: number) => void;
  onGoldPickup: (gold: number) => void;
  onMessage: (msg: string) => void;
  onVictory: (floor: number) => void;
  onDefeat: (floor: number) => void;
  onLevelUp: (newLevel: number) => void;
}

interface EnemyInstance {
  id: number;
  type: 'lurker' | 'arcanist' | 'juggernaut' | 'boss';
  x: number;
  z: number;
  vx: number;
  vz: number;
  rotation: number;
  hp: number;
  maxHp: number;
  state: 'idle' | 'chase' | 'telegraph' | 'attack' | 'dead';
  stateTimer: number;
  attackCooldown: number;
  group: THREE.Group;
  telegraphMesh?: THREE.Mesh;
  targetPos: { x: number; z: number };
}

interface ChestInstance {
  id: number;
  x: number;
  z: number;
  opened: boolean;
  group: THREE.Group;
  lid: THREE.Group;
}

interface LootDropInstance {
  id: number;
  x: number;
  z: number;
  item?: Item;
  material?: { id: CraftingMaterial['id']; amount: number };
  gold?: number;
  mesh: THREE.Group;
}

export class DungeonSceneManager {
  private mountEl: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private materials: DungeonMaterials;
  private particles: ParticlePool;
  private isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private callbacks: SceneCallbacks;

  // Dungeon state
  public floorLevel: number = 1;
  private grid: DungeonGrid;
  private dungeonMeshes: THREE.Object3D[] = [];

  // Hero player
  private heroGroup: THREE.Group;
  private heroWeapon: THREE.Group;
  private heroWeaponGlow: THREE.Mesh;
  private heroSwingTrail: THREE.Mesh;
  public playerX: number = 0;
  public playerZ: number = 0;
  private playerVx: number = 0;
  private playerVz: number = 0;
  private playerRot: number = 0;
  private playerAttackTimer: number = 0;
  private playerDodgeTimer: number = 0;
  private playerIsDodging: boolean = false;
  private playerActiveSkill: string | null = null;
  private playerSkillTimer: number = 0;

  // Camera damping
  private camDistance: number = 6.8;
  private camHeight: number = 5.2;
  private camYaw: number = 0;
  private camShake: number = 0;

  // Hitstop
  private hitstopTimer: number = 0;

  // Enemies & Props
  private enemies: EnemyInstance[] = [];
  private chests: ChestInstance[] = [];
  private lootDrops: LootDropInstance[] = [];
  private portalMesh: THREE.Group | null = null;

  // Stats
  public playerStats: PlayerStats;

  // Input states
  public keysHeld = new Set<string>();
  public touchJoystick = { x: 0, y: 0 };
  public touchAimDrag = { dx: 0, dy: 0 };
  public isRunning: boolean = false;

  constructor(mountEl: HTMLElement, initialStats: PlayerStats, callbacks: SceneCallbacks) {
    this.mountEl = mountEl;
    this.playerStats = { ...initialStats };
    this.callbacks = callbacks;

    // Detect Software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mountEl.appendChild(this.renderer.domElement);

    // Scene & Fog (Horizon continuity)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10);
    this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.045);

    // Camera
    this.camera = new THREE.PerspectiveCamera(55, mountEl.clientWidth / mountEl.clientHeight, 0.1, 80);

    // Lighting: Warm Key + Cool Fill + Subtle Hero Aura
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 1.2);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    keyLight.position.set(15, 25, 10);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 60;
      keyLight.shadow.camera.left = -16;
      keyLight.shadow.camera.right = 16;
      keyLight.shadow.camera.top = 16;
      keyLight.shadow.camera.bottom = -16;
      keyLight.shadow.bias = -0.0005;
    }
    this.scene.add(keyLight);

    // Subtle hero proximity light (no shadows, max 1)
    const heroProximityLight = new THREE.PointLight(0x38bdf8, 1.3, 9);
    heroProximityLight.position.set(0, 1.8, 0);

    this.materials = new DungeonMaterials();
    this.particles = new ParticlePool(this.scene, 250);

    // Build Hero
    const hero = createHeroModel(this.materials);
    this.heroGroup = hero.group;
    this.heroWeapon = hero.weaponMesh;
    this.heroWeaponGlow = hero.weaponGlow;
    this.heroSwingTrail = hero.swingTrail;
    this.heroGroup.add(heroProximityLight);
    this.scene.add(this.heroGroup);

    // Build initial dungeon
    this.grid = generateProceduralDungeon(this.floorLevel);
    this.buildDungeonWorld();

    // Resize listener
    window.addEventListener('resize', this.onResize);
  }

  public start() {
    this.isRunning = true;
    let lastTime = performance.now();

    const tick = (now: number) => {
      if (!this.isRunning) return;
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(() => {
          this.animFrameId = requestAnimationFrame(tick);
        });
      } else {
        this.animFrameId = requestAnimationFrame(tick);
      }
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (gl && gl.fenceSync) {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          window.setTimeout(poll, 6);
        } else {
          gl.deleteSync(sync);
          window.setTimeout(cb, 50);
        }
      };
      window.setTimeout(poll, 6);
    } else {
      window.setTimeout(cb, 50);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.particles.dispose();
    this.renderer.dispose();
    if (this.mountEl.contains(this.renderer.domElement)) {
      this.mountEl.removeChild(this.renderer.domElement);
    }
  }

  private onResize = () => {
    if (!this.mountEl) return;
    const w = this.mountEl.clientWidth;
    const h = this.mountEl.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  /**
   * Procedural Dungeon Geometry Builder with Asset Culling
   */
  public buildDungeonWorld() {
    // Clear old meshes
    this.dungeonMeshes.forEach((m) => this.scene.remove(m));
    this.dungeonMeshes = [];
    this.enemies.forEach((e) => this.scene.remove(e.group));
    this.enemies = [];
    this.chests.forEach((c) => this.scene.remove(c.group));
    this.chests = [];
    this.lootDrops.forEach((l) => this.scene.remove(l.mesh));
    this.lootDrops = [];
    if (this.portalMesh) {
      this.scene.remove(this.portalMesh);
      this.portalMesh = null;
    }

    const { width, height, tiles, spawnPos, exitPos, enemySpawns, chests } = this.grid;

    // Spawn player in center of spawn room
    this.playerX = spawnPos.x;
    this.playerZ = spawnPos.z;
    this.heroGroup.position.set(this.playerX, 0, this.playerZ);

    // Batched Floor & Wall Geometries using shared materials
    const floorGeo = new THREE.PlaneGeometry(1, 1);
    floorGeo.rotateX(-Math.PI / 2);
    const wallGeo = new THREE.BoxGeometry(1, 2.6, 1);

    // Count floor and wall tiles
    let floorCount = 0;
    let wallCount = 0;

    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        if (tiles[z][x] > 0) floorCount++;
        else {
          // Check if adjacent to floor
          let hasAdjFloor = false;
          for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const nz = z + dz;
              if (nx >= 0 && nx < width && nz >= 0 && nz < height && tiles[nz][nx] > 0) {
                hasAdjFloor = true;
                break;
              }
            }
            if (hasAdjFloor) break;
          }
          if (hasAdjFloor) wallCount++;
        }
      }
    }

    const floorMesh = new THREE.InstancedMesh(floorGeo, this.materials.floorMat, floorCount);
    const wallMesh = new THREE.InstancedMesh(wallGeo, this.materials.wallMat, wallCount);
    floorMesh.receiveShadow = !this.isSoftwareGl;
    wallMesh.castShadow = !this.isSoftwareGl;
    wallMesh.receiveShadow = !this.isSoftwareGl;

    const dummy = new THREE.Object3D();
    let fIdx = 0;
    let wIdx = 0;

    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        if (tiles[z][x] > 0) {
          dummy.position.set(x, 0, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1.002, 1, 1.002);
          dummy.updateMatrix();
          floorMesh.setMatrixAt(fIdx++, dummy.matrix);
        } else {
          let hasAdjFloor = false;
          for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const nz = z + dz;
              if (nx >= 0 && nx < width && nz >= 0 && nz < height && tiles[nz][nx] > 0) {
                hasAdjFloor = true;
                break;
              }
            }
            if (hasAdjFloor) break;
          }
          if (hasAdjFloor) {
            dummy.position.set(x, 1.3, z);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            wallMesh.setMatrixAt(wIdx++, dummy.matrix);
          }
        }
      }
    }

    floorMesh.instanceMatrix.needsUpdate = true;
    wallMesh.instanceMatrix.needsUpdate = true;
    floorMesh.computeBoundingSphere();
    wallMesh.computeBoundingSphere();

    this.scene.add(floorMesh);
    this.scene.add(wallMesh);
    this.dungeonMeshes.push(floorMesh, wallMesh);

    // Wall Sconces & Torches (Cap active lights to 4-5)
    this.grid.torches.slice(0, 6).forEach((t) => {
      const torchGroup = new THREE.Group();
      torchGroup.position.set(t.x, 1.6, t.z);

      const handleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4);
      const handle = new THREE.Mesh(handleGeo, this.materials.torchMat);
      handle.position.y = 0.1;
      const flameGeo = new THREE.SphereGeometry(0.1, 6, 6);
      const flame = new THREE.Mesh(flameGeo, this.materials.flameMat);
      flame.position.y = 0.35;
      torchGroup.add(handle, flame);

      if (!this.isSoftwareGl) {
        const torchLight = new THREE.PointLight(0xf97316, 0.9, 7);
        torchLight.position.set(0, 0.4, 0);
        torchGroup.add(torchLight);
      }

      this.scene.add(torchGroup);
      this.dungeonMeshes.push(torchGroup);
    });

    // Exit Portal
    this.portalMesh = createPortalModel(this.materials);
    this.portalMesh.position.set(exitPos.x, 0, exitPos.z);
    this.scene.add(this.portalMesh);

    // Chests
    chests.forEach((c, idx) => {
      const chest = createChestModel(this.materials);
      chest.group.position.set(c.x, 0, c.z);
      this.scene.add(chest.group);
      this.chests.push({
        id: idx,
        x: c.x,
        z: c.z,
        opened: false,
        group: chest.group,
        lid: chest.lid,
      });
    });

    // Enemies
    enemySpawns.forEach((e, idx) => {
      const enemyModel = createEnemyModel(e.type, this.materials);
      enemyModel.group.position.set(e.x, 0, e.z);
      this.scene.add(enemyModel.group);

      const hpMap = { lurker: 45, arcanist: 65, juggernaut: 140, boss: 380 };
      const maxHp = Math.round(hpMap[e.type] * (1 + (this.floorLevel - 1) * 0.35));

      this.enemies.push({
        id: idx,
        type: e.type,
        x: e.x,
        z: e.z,
        vx: 0,
        vz: 0,
        rotation: 0,
        hp: maxHp,
        maxHp,
        state: 'idle',
        stateTimer: 0,
        attackCooldown: 1.0 + Math.random() * 1.5,
        group: enemyModel.group,
        telegraphMesh: enemyModel.telegraphMesh,
        targetPos: { x: e.x, z: e.z },
      });
    });
  }

  public nextFloor() {
    this.floorLevel++;
    this.grid = generateProceduralDungeon(this.floorLevel);
    this.buildDungeonWorld();
    sounds.playLevelUp();
    this.callbacks.onMessage(`Entered Dungeon Depths: Floor ${this.floorLevel}`);
  }

  /**
   * Action Triggers from Player (Keyboard or Touch)
   */
  public triggerAttack() {
    if (this.playerAttackTimer > 0 || this.playerIsDodging) return;
    this.playerAttackTimer = 0.32;
    sounds.playSwing(1.0 + (Math.random() - 0.5) * 0.1);

    // Show weapon trail
    this.heroSwingTrail.visible = true;
    (this.heroSwingTrail.material as THREE.MeshBasicMaterial).opacity = 0.85;

    // Melee Hitbox detection in 2.2m arc in front of player
    setTimeout(() => {
      this.checkPlayerAttackHit(1.0, 2.2, 140);
    }, 90);
  }

  public triggerDodge() {
    if (this.playerIsDodging || this.playerStats.stamina < 20) return;
    this.playerStats.stamina -= 20;
    this.callbacks.onStatsUpdate(this.playerStats);
    this.playerIsDodging = true;
    this.playerDodgeTimer = 0.38;
    sounds.playDodge();

    // Dodge impulse in direction of current velocity or facing
    const angle = this.playerRot;
    this.playerVx = Math.sin(angle) * 11.5;
    this.playerVz = Math.cos(angle) * 11.5;
  }

  public triggerSkill(slot: 1 | 2 | 3) {
    if (this.playerSkillTimer > 0) return;

    if (slot === 1) {
      // Cleave Strike / Shadow Dash / Arcane Nova
      if (this.playerStats.mana < 25) {
        this.callbacks.onMessage('Not enough mana!');
        return;
      }
      this.playerStats.mana -= 25;
      this.callbacks.onStatsUpdate(this.playerStats);
      this.playerSkillTimer = 0.5;
      this.playerActiveSkill = 'cleave';
      sounds.playSpell('cleave');
      this.particles.burst(this.playerX, 1.0, this.playerZ, 16, 0x38bdf8, 3.5);
      this.checkPlayerAttackHit(2.0, 3.0, 240);
      this.camShake = Math.max(this.camShake, 0.4);
    } else if (slot === 2) {
      // Whirlwind / Blade Flurry / Meteor
      if (this.playerStats.mana < 35) {
        this.callbacks.onMessage('Not enough mana!');
        return;
      }
      this.playerStats.mana -= 35;
      this.callbacks.onStatsUpdate(this.playerStats);
      this.playerSkillTimer = 1.0;
      this.playerActiveSkill = 'whirlwind';
      sounds.playSpell('whirlwind');
      this.particles.burst(this.playerX, 0.8, this.playerZ, 24, 0xf97316, 4.0);
      this.checkPlayerAttackHit(1.6, 3.5, 360);
      this.camShake = Math.max(this.camShake, 0.6);
    } else if (slot === 3) {
      // Potion / Quick Buff
      if (this.playerStats.hp < this.playerStats.maxHp) {
        this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + 50);
        this.playerStats.mana = Math.min(this.playerStats.maxMana, this.playerStats.mana + 30);
        this.callbacks.onStatsUpdate(this.playerStats);
        sounds.playLevelUp();
        this.particles.burst(this.playerX, 1.2, this.playerZ, 14, 0x22c55e, 2.0);
        this.callbacks.onMessage('Consumable used (+50 HP, +30 Mana)');
      }
    }
  }

  public triggerInteract() {
    // 1. Check loot drops nearby
    for (let i = this.lootDrops.length - 1; i >= 0; i--) {
      const drop = this.lootDrops[i];
      const dist = Math.hypot(drop.x - this.playerX, drop.z - this.playerZ);
      if (dist < 2.0) {
        this.collectLootDrop(drop);
        return;
      }
    }

    // 2. Check chests nearby
    for (const chest of this.chests) {
      if (!chest.opened) {
        const dist = Math.hypot(chest.x - this.playerX, chest.z - this.playerZ);
        if (dist < 2.2) {
          chest.opened = true;
          sounds.playChestOpen();
          // Open lid animation
          chest.lid.rotation.x = -Math.PI * 0.45;
          // Spawn loot items
          this.spawnChestLoot(chest.x, chest.z);
          this.callbacks.onMessage('Opened Ancient Treasure Chest!');
          return;
        }
      }
    }

    // 3. Check exit portal
    const exitDist = Math.hypot(this.grid.exitPos.x - this.playerX, this.grid.exitPos.z - this.playerZ);
    if (exitDist < 2.2) {
      // Check if boss alive
      const bossAlive = this.enemies.some((e) => e.type === 'boss' && e.hp > 0);
      if (bossAlive) {
        this.callbacks.onMessage('Defeat the Abyssal Warden before descending deeper!');
      } else {
        this.nextFloor();
      }
    }
  }

  private checkPlayerAttackHit(damageMult: number, range: number, arcAngleDeg: number) {
    const forwardX = Math.sin(this.playerRot);
    const forwardZ = Math.cos(this.playerRot);
    const radArc = (arcAngleDeg * Math.PI) / 180 / 2;

    this.enemies.forEach((e) => {
      if (e.hp <= 0) return;
      const dx = e.x - this.playerX;
      const dz = e.z - this.playerZ;
      const dist = Math.hypot(dx, dz);
      if (dist <= range) {
        const dot = (dx * forwardX + dz * forwardZ) / dist;
        const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
        if (angle <= radArc || dist < 1.0) {
          // Critical hit roll
          const isCrit = Math.random() < this.playerStats.critChance;
          const critMod = isCrit ? this.playerStats.critMultiplier : 1.0;
          const rawDmg = Math.round(this.playerStats.damage * damageMult * critMod);
          const elementalTotal = this.playerStats.elementalFire + this.playerStats.elementalFrost + this.playerStats.elementalVoid;
          const finalDmg = Math.max(1, rawDmg + elementalTotal);

          e.hp -= finalDmg;
          sounds.playHit(isCrit);

          // Hitstop on heavy hits or crits
          if (isCrit || finalDmg > 60) {
            this.hitstopTimer = 0.06;
            this.camShake = Math.max(this.camShake, 0.5);
          }

          // Sparks / Blood particle burst
          this.particles.burst(e.x, 0.8, e.z, isCrit ? 18 : 8, isCrit ? 0xfacc15 : 0xef4444, 3.2);

          // Life Leech
          if (this.playerStats.lifeLeech > 0) {
            const healed = Math.round((finalDmg * this.playerStats.lifeLeech) / 100);
            if (healed > 0) {
              this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + healed);
              this.callbacks.onStatsUpdate(this.playerStats);
            }
          }

          // Knockback
          e.x += (dx / dist) * 0.45;
          e.z += (dz / dist) * 0.45;

          if (e.hp <= 0) {
            this.handleEnemyDefeat(e);
          }
        }
      }
    });
  }

  private handleEnemyDefeat(e: EnemyInstance) {
    e.state = 'dead';
    this.particles.burst(e.x, 1.0, e.z, 28, 0x8b5cf6, 4.0);
    sounds.playHit(true);

    // Fade out mesh
    e.group.position.y = -0.5;
    setTimeout(() => {
      this.scene.remove(e.group);
    }, 400);

    // Gain XP
    const xpGain = e.type === 'boss' ? 120 : e.type === 'juggernaut' ? 45 : 20;
    this.playerStats.xp += xpGain;
    if (this.playerStats.xp >= this.playerStats.xpNeeded) {
      this.playerStats.xp -= this.playerStats.xpNeeded;
      this.playerStats.level++;
      this.playerStats.skillPoints++;
      this.playerStats.maxHp += 20;
      this.playerStats.hp = this.playerStats.maxHp;
      this.playerStats.damage += 4;
      this.playerStats.xpNeeded = this.playerStats.level * 100;
      sounds.playLevelUp();
      this.callbacks.onLevelUp(this.playerStats.level);
    }
    this.callbacks.onStatsUpdate(this.playerStats);

    // Roll Loot Drop
    this.spawnEnemyLoot(e.x, e.z, e.type);
  }

  private spawnEnemyLoot(x: number, z: number, mobType: EnemyInstance['type']) {
    const isBoss = mobType === 'boss';
    const isElite = mobType === 'juggernaut' || mobType === 'arcanist';

    // Materials
    const dropScrap = Math.floor(Math.random() * 4) + (isBoss ? 8 : 2);
    this.createWorldLootDrop(x - 0.3, z, undefined, { id: 'scrapMetal', amount: dropScrap });

    if (isBoss || (isElite && Math.random() > 0.4)) {
      this.createWorldLootDrop(x + 0.3, z, undefined, { id: 'mysticEssence', amount: isBoss ? 4 : 1 });
    }

    if (isBoss) {
      this.createWorldLootDrop(x, z + 0.3, undefined, { id: 'voidShard', amount: 2 });
    }

    // Equipment Drop
    const itemRoll = Math.random();
    if (isBoss || (isElite && itemRoll > 0.4) || itemRoll > 0.7) {
      const targetRarity: Rarity = isBoss
        ? Math.random() > 0.5
          ? 'legendary'
          : 'epic'
        : isElite
        ? Math.random() > 0.6
          ? 'epic'
          : 'rare'
        : Math.random() > 0.7
        ? 'uncommon'
        : 'common';
      const item = generateLootItem(this.floorLevel, targetRarity);
      this.createWorldLootDrop(x, z - 0.4, item);
      sounds.playLootDrop(item.rarity);
    }

    // Gold
    const goldAmount = Math.round((10 + Math.random() * 20) * (isBoss ? 5 : 1));
    this.createWorldLootDrop(x, z, undefined, undefined, goldAmount);
  }

  private spawnChestLoot(x: number, z: number) {
    // 2 equipment drops + materials + gold
    const item1 = generateLootItem(this.floorLevel, Math.random() > 0.4 ? 'rare' : 'epic');
    const item2 = generateLootItem(this.floorLevel, 'uncommon');
    this.createWorldLootDrop(x - 0.6, z, item1);
    this.createWorldLootDrop(x + 0.6, z, item2);

    this.createWorldLootDrop(x, z + 0.5, undefined, { id: 'scrapMetal', amount: 8 });
    this.createWorldLootDrop(x, z - 0.5, undefined, { id: 'mysticEssence', amount: 3 });
    this.createWorldLootDrop(x + 0.3, z + 0.3, undefined, undefined, 45);

    sounds.playLootDrop('epic');
  }

  private createWorldLootDrop(
    x: number,
    z: number,
    item?: Item,
    material?: { id: CraftingMaterial['id']; amount: number },
    gold?: number
  ) {
    const group = new THREE.Group();
    group.position.set(x, 0.3, z);

    let colorHex = 0xffffff;
    if (item) {
      const colorMap: Record<Rarity, number> = {
        common: 0x94a3b8,
        uncommon: 0x22c55e,
        rare: 0x38bdf8,
        epic: 0xa855f7,
        legendary: 0xf59e0b,
      };
      colorHex = colorMap[item.rarity];
    } else if (material) {
      colorHex = material.id === 'scrapMetal' ? 0x94a3b8 : material.id === 'mysticEssence' ? 0x38bdf8 : material.id === 'voidShard' ? 0xa855f7 : 0xf59e0b;
    } else if (gold) {
      colorHex = 0xeab308;
    }

    // Floating rotating crystal
    const geo = new THREE.OctahedronGeometry(0.18);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    // Vertical light beam column
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.65,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 0.9;
    group.add(beam);

    this.scene.add(group);
    this.lootDrops.push({
      id: Date.now() + Math.random(),
      x,
      z,
      item,
      material,
      gold,
      mesh: group,
    });
  }

  private collectLootDrop(drop: LootDropInstance) {
    const idx = this.lootDrops.indexOf(drop);
    if (idx !== -1) {
      this.lootDrops.splice(idx, 1);
      this.scene.remove(drop.mesh);
      this.particles.burst(drop.x, 0.5, drop.z, 10, 0xfacc15, 2.0);

      if (drop.item) {
        this.callbacks.onLootPickup(drop.item);
        this.callbacks.onMessage(`Acquired [${drop.item.rarity.toUpperCase()}] ${drop.item.name}!`);
      } else if (drop.material) {
        this.callbacks.onMaterialPickup(drop.material.id, drop.material.amount);
        this.callbacks.onMessage(`Gathered +${drop.material.amount} ${drop.material.id}`);
      } else if (drop.gold) {
        this.playerStats.gold += drop.gold;
        this.callbacks.onGoldPickup(drop.gold);
        this.callbacks.onStatsUpdate(this.playerStats);
        this.callbacks.onMessage(`Picked up +${drop.gold} Gold`);
      }
      sounds.playUiClick();
    }
  }

  /**
   * Main Simulation Step with Clamped dt and Sim Hitstop
   */
  private update(dt: number) {
    // Animate portal vortex
    if (this.portalMesh) {
      const ring = this.portalMesh.getObjectByName('portalRing');
      if (ring) ring.rotation.z += dt * 1.5;
    }

    // Animate loot drops (bob and rotate)
    const time = performance.now() * 0.003;
    this.lootDrops.forEach((drop) => {
      drop.mesh.rotation.y += dt * 2.0;
      drop.mesh.position.y = 0.25 + Math.sin(time + drop.id) * 0.08;
    });

    // Update particles (runs regardless of hitstop for visual smoothness)
    this.particles.update(dt);

    // Hitstop freeze
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Player cooldowns & timers
    if (this.playerAttackTimer > 0) {
      this.playerAttackTimer -= dt;
      if (this.playerAttackTimer <= 0) {
        this.heroSwingTrail.visible = false;
      }
    }
    if (this.playerDodgeTimer > 0) {
      this.playerDodgeTimer -= dt;
      if (this.playerDodgeTimer <= 0) {
        this.playerIsDodging = false;
      }
    }
    if (this.playerSkillTimer > 0) {
      this.playerSkillTimer -= dt;
      if (this.playerSkillTimer <= 0) {
        this.playerActiveSkill = null;
      }
    }

    // Stamina regeneration
    if (this.playerStats.stamina < this.playerStats.maxStamina) {
      this.playerStats.stamina = Math.min(this.playerStats.maxStamina, this.playerStats.stamina + 25 * dt);
    }

    // 1. Player Input & Movement (Screen-relative alignment)
    let inputX = 0;
    let inputZ = 0;

    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) inputZ += 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) inputZ -= 1;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) inputX += 1; // Screen Left
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) inputX -= 1; // Screen Right

    // Add touch joystick input (inverted to match screen perspective)
    if (this.touchJoystick.x !== 0 || this.touchJoystick.y !== 0) {
      inputX -= this.touchJoystick.x;
      inputZ += this.touchJoystick.y;
    }

    const inputLen = Math.hypot(inputX, inputZ);
    if (!this.playerIsDodging) {
      if (inputLen > 0.1) {
        const normX = inputX / Math.max(1, inputLen);
        const normZ = inputZ / Math.max(1, inputLen);
        const speed = this.playerStats.moveSpeed;

        this.playerVx = THREE.MathUtils.damp(this.playerVx, normX * speed, 12, dt);
        this.playerVz = THREE.MathUtils.damp(this.playerVz, normZ * speed, 12, dt);

        this.playerRot = Math.atan2(this.playerVx, this.playerVz);
      } else {
        this.playerVx = THREE.MathUtils.damp(this.playerVx, 0, 15, dt);
        this.playerVz = THREE.MathUtils.damp(this.playerVz, 0, 15, dt);
      }
    }

    // Collision detection with dungeon grid
    const nextX = this.playerX + this.playerVx * dt;
    const nextZ = this.playerZ + this.playerVz * dt;

    if (isWalkable(this.grid, nextX, this.playerZ)) {
      this.playerX = nextX;
    } else {
      this.playerVx = 0;
    }

    if (isWalkable(this.grid, this.playerX, nextZ)) {
      this.playerZ = nextZ;
    } else {
      this.playerVz = 0;
    }

    this.heroGroup.position.set(this.playerX, 0, this.playerZ);
    this.heroGroup.rotation.y = this.playerRot;

    // Weapon attack swing animation
    if (this.playerAttackTimer > 0) {
      const swingProgress = 1 - this.playerAttackTimer / 0.32;
      this.heroWeapon.rotation.x = -Math.sin(swingProgress * Math.PI) * 1.5;
    } else if (this.playerActiveSkill === 'whirlwind') {
      this.heroGroup.rotation.y += dt * 18.0;
    } else {
      this.heroWeapon.rotation.x = THREE.MathUtils.damp(this.heroWeapon.rotation.x, 0, 10, dt);
    }

    // 2. Camera Follow with Wall Pull-In & Exponential Damping
    const targetCamX = this.playerX - Math.sin(this.camYaw) * this.camDistance;
    const targetCamZ = this.playerZ - Math.cos(this.camYaw) * this.camDistance;
    const targetCamY = this.camHeight;

    // Camera shake decay
    let shakeOffsetX = 0;
    let shakeOffsetZ = 0;
    if (this.camShake > 0.01) {
      this.camShake = THREE.MathUtils.damp(this.camShake, 0, 8, dt);
      const intensity = this.camShake * this.camShake * 0.4;
      shakeOffsetX = (Math.random() - 0.5) * intensity;
      shakeOffsetZ = (Math.random() - 0.5) * intensity;
    }

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX + shakeOffsetX, 8, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 8, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ + shakeOffsetZ, 8, dt);

    const lookTargetX = this.playerX;
    const lookTargetY = 1.1;
    const lookTargetZ = this.playerZ;
    this.camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);

    // 3. Enemy AI & Movement (Distance Culled)
    this.updateEnemies(dt);
  }

  private updateEnemies(dt: number) {
    const CULL_DISTANCE = 32.0;

    this.enemies.forEach((e) => {
      if (e.hp <= 0) return;

      const distToPlayer = Math.hypot(this.playerX - e.x, this.playerZ - e.z);
      if (distToPlayer > CULL_DISTANCE) {
        // Skip updating off-screen distant enemies for 60fps performance
        return;
      }

      e.attackCooldown -= dt;

      // Behavior state machine
      if (e.state === 'idle') {
        if (distToPlayer < 9.0) {
          e.state = 'chase';
        }
      } else if (e.state === 'chase') {
        const dx = this.playerX - e.x;
        const dz = this.playerZ - e.z;
        const dist = Math.hypot(dx, dz);

        e.rotation = Math.atan2(dx, dz);
        e.group.rotation.y = e.rotation;

        const attackRange = e.type === 'arcanist' ? 5.5 : e.type === 'boss' ? 2.8 : 1.6;

        if (dist <= attackRange && e.attackCooldown <= 0) {
          // Enter telegraphed attack
          e.state = 'telegraph';
          e.stateTimer = e.type === 'boss' ? 0.75 : e.type === 'juggernaut' ? 0.65 : 0.45;
          if (e.telegraphMesh) e.telegraphMesh.visible = true;
          sounds.playSwing(0.6);
        } else {
          // Move towards player
          const speed = e.type === 'lurker' ? 3.8 : e.type === 'juggernaut' ? 2.0 : 2.5;
          const moveX = (dx / dist) * speed * dt;
          const moveZ = (dz / dist) * speed * dt;

          if (isWalkable(this.grid, e.x + moveX, e.z)) e.x += moveX;
          if (isWalkable(this.grid, e.x, e.z + moveZ)) e.z += moveZ;

          e.group.position.set(e.x, 0, e.z);
        }
      } else if (e.state === 'telegraph') {
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) {
          // Execute attack
          e.state = 'attack';
          if (e.telegraphMesh) e.telegraphMesh.visible = false;
          this.executeEnemyAttack(e);
          e.attackCooldown = 1.6 + Math.random() * 0.8;
          e.state = 'chase';
        }
      }
    });
  }

  private executeEnemyAttack(e: EnemyInstance) {
    const dist = Math.hypot(this.playerX - e.x, this.playerZ - e.z);
    const range = e.type === 'arcanist' ? 6.0 : e.type === 'boss' ? 3.2 : 2.0;

    if (dist <= range && !this.playerIsDodging) {
      // Player takes damage
      const baseMobDmg = e.type === 'boss' ? 32 : e.type === 'juggernaut' ? 24 : 14;
      const reduction = this.playerStats.defense * 0.4;
      const finalDmg = Math.max(2, Math.round(baseMobDmg - reduction));

      this.playerStats.hp = Math.max(0, this.playerStats.hp - finalDmg);
      sounds.playHit(false);
      this.particles.burst(this.playerX, 0.9, this.playerZ, 12, 0xef4444, 2.5);
      this.camShake = Math.max(this.camShake, 0.4);
      this.callbacks.onStatsUpdate(this.playerStats);

      if (this.playerStats.hp <= 0) {
        this.callbacks.onDefeat(this.floorLevel);
      }
    }
  }
}
