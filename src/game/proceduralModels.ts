import * as THREE from 'three';

// Shared material library to avoid excessive draw calls and memory leaks
export class DungeonMaterials {
  public floorMat: THREE.MeshStandardMaterial;
  public wallMat: THREE.MeshStandardMaterial;
  public corridorMat: THREE.MeshStandardMaterial;
  public pillarMat: THREE.MeshStandardMaterial;
  public chestMat: THREE.MeshStandardMaterial;
  public goldTrimMat: THREE.MeshStandardMaterial;
  public heroArmorMat: THREE.MeshStandardMaterial;
  public heroSkinMat: THREE.MeshStandardMaterial;
  public heroSteelMat: THREE.MeshStandardMaterial;
  public heroVisorMat: THREE.MeshStandardMaterial;
  public lurkerMat: THREE.MeshStandardMaterial;
  public arcanistMat: THREE.MeshStandardMaterial;
  public juggernautMat: THREE.MeshStandardMaterial;
  public bossMat: THREE.MeshStandardMaterial;
  public torchMat: THREE.MeshStandardMaterial;
  public flameMat: THREE.MeshBasicMaterial;
  public portalMat: THREE.MeshStandardMaterial;
  public telegraphMat: THREE.MeshBasicMaterial;
  public shadowDiscMat: THREE.MeshBasicMaterial;

  constructor() {
    // Procedural stone noise canvas for bump
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 128;
    bumpCanvas.height = 128;
    const bctx = bumpCanvas.getContext('2d')!;
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 400; i++) {
      const v = Math.floor(Math.random() * 80 + 70);
      bctx.fillStyle = `rgb(${v},${v},${v})`;
      bctx.fillRect(Math.random() * 128, Math.random() * 128, 3, 3);
    }
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(2, 2);

    this.floorMat = new THREE.MeshStandardMaterial({
      color: 0x242730,
      roughness: 0.85,
      metalness: 0.1,
      bumpMap: bumpTex,
      bumpScale: 0.04,
    });

    this.corridorMat = new THREE.MeshStandardMaterial({
      color: 0x1e2029,
      roughness: 0.9,
      metalness: 0.05,
      bumpMap: bumpTex,
      bumpScale: 0.03,
    });

    this.wallMat = new THREE.MeshStandardMaterial({
      color: 0x161820,
      roughness: 0.8,
      metalness: 0.2,
      bumpMap: bumpTex,
      bumpScale: 0.08,
    });

    this.pillarMat = new THREE.MeshStandardMaterial({
      color: 0x282c37,
      roughness: 0.7,
      metalness: 0.25,
    });

    this.chestMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e18,
      roughness: 0.6,
      metalness: 0.15,
    });

    this.goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85,
    });

    // Player Hero Materials
    this.heroArmorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.45,
      metalness: 0.6,
    });

    this.heroSkinMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.1,
    });

    this.heroSteelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.18,
      metalness: 0.92,
    });

    this.heroVisorMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2,
      roughness: 0.1,
      metalness: 0.2,
    });

    // Enemy Materials
    this.lurkerMat = new THREE.MeshStandardMaterial({
      color: 0x6b21a8,
      roughness: 0.5,
      metalness: 0.4,
    });

    this.arcanistMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.35,
      metalness: 0.3,
    });

    this.juggernautMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.75,
      metalness: 0.7,
    });

    this.bossMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.3,
      metalness: 0.8,
    });

    this.torchMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.7,
      metalness: 0.5,
    });

    this.flameMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
    });

    this.portalMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x6366f1,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.85,
    });

    this.telegraphMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });

    this.shadowDiscMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
  }
}

/**
 * Procedural Hero Character
 * Assembled from 8 distinct parts across 3 silhouette scales:
 * 1. Primary: Armored torso & legs
 * 2. Secondary: Helmet, pauldrons, weapon blade
 * 3. Accent: Glowing visor slit, weapon crossguard, runic pommel
 */
export function createHeroModel(materials: DungeonMaterials): {
  group: THREE.Group;
  weaponMesh: THREE.Group;
  weaponGlow: THREE.Mesh;
  swingTrail: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = 'Hero';

  // Soft contact shadow disc grounded at y = 0.015
  const shadowGeo = new THREE.CircleGeometry(0.55, 16);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMesh = new THREE.Mesh(shadowGeo, materials.shadowDiscMat);
  shadowMesh.position.y = 0.015;
  group.add(shadowMesh);

  // Legs / Greaves
  const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.6, 8);
  const leftLeg = new THREE.Mesh(legGeo, materials.heroSkinMat);
  leftLeg.position.set(-0.2, 0.3, 0);
  const rightLeg = new THREE.Mesh(legGeo, materials.heroSkinMat);
  rightLeg.position.set(0.2, 0.3, 0);
  group.add(leftLeg, rightLeg);

  // Torso / Plate Curass
  const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.35);
  const torso = new THREE.Mesh(torsoGeo, materials.heroArmorMat);
  torso.position.set(0, 0.85, 0);
  group.add(torso);

  // Pauldrons (Shoulder armor)
  const pauldronGeo = new THREE.BoxGeometry(0.22, 0.16, 0.28);
  const leftPauldron = new THREE.Mesh(pauldronGeo, materials.heroSteelMat);
  leftPauldron.position.set(-0.35, 1.15, 0);
  const rightPauldron = new THREE.Mesh(pauldronGeo, materials.heroSteelMat);
  rightPauldron.position.set(0.35, 1.15, 0);
  group.add(leftPauldron, rightPauldron);

  // Helmet / Head
  const headGeo = new THREE.BoxGeometry(0.32, 0.34, 0.32);
  const head = new THREE.Mesh(headGeo, materials.heroArmorMat);
  head.position.set(0, 1.35, 0);
  group.add(head);

  // Glowing Visor Accent (Cyan / Arcane)
  const visorGeo = new THREE.BoxGeometry(0.24, 0.06, 0.06);
  const visor = new THREE.Mesh(visorGeo, materials.heroVisorMat);
  visor.position.set(0, 1.36, 0.16);
  group.add(visor);

  // Weapon: Runic Sword / Blade Group attached to right arm
  const weapon = new THREE.Group();
  weapon.position.set(0.42, 0.85, 0.15);

  // Grip / Hilt
  const hiltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
  const hilt = new THREE.Mesh(hiltGeo, materials.heroSkinMat);
  hilt.position.y = -0.1;
  weapon.add(hilt);

  // Crossguard
  const guardGeo = new THREE.BoxGeometry(0.32, 0.06, 0.08);
  const guard = new THREE.Mesh(guardGeo, materials.goldTrimMat);
  guard.position.y = 0.06;
  weapon.add(guard);

  // Blade
  const bladeGeo = new THREE.BoxGeometry(0.12, 0.95, 0.04);
  const blade = new THREE.Mesh(bladeGeo, materials.heroSteelMat);
  blade.position.y = 0.55;
  weapon.add(blade);

  // Elemental Runic Core (Glows based on socketed rune)
  const gemGeo = new THREE.BoxGeometry(0.05, 0.35, 0.06);
  const gemMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const gemGlow = new THREE.Mesh(gemGeo, gemMat);
  gemGlow.position.set(0, 0.35, 0);
  weapon.add(gemGlow);

  group.add(weapon);

  // Attack Slash Trail Arc (Initially hidden)
  const trailGeo = new THREE.RingGeometry(0.8, 1.4, 16, 1, 0, Math.PI * 0.8);
  trailGeo.rotateX(-Math.PI / 2);
  const trailMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const swingTrail = new THREE.Mesh(trailGeo, trailMat);
  swingTrail.position.set(0, 0.75, 0.3);
  group.add(swingTrail);

  return { group, weaponMesh: weapon, weaponGlow: gemGlow, swingTrail };
}

/**
 * Procedural Enemy Models
 */
export function createEnemyModel(type: 'lurker' | 'arcanist' | 'juggernaut' | 'boss', materials: DungeonMaterials): {
  group: THREE.Group;
  telegraphMesh?: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.name = `Enemy_${type}`;

  // Contact shadow
  const radius = type === 'boss' ? 1.2 : type === 'juggernaut' ? 0.8 : 0.45;
  const shadowGeo = new THREE.CircleGeometry(radius, 16);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMesh = new THREE.Mesh(shadowGeo, materials.shadowDiscMat);
  shadowMesh.position.y = 0.015;
  group.add(shadowMesh);

  let telegraphMesh: THREE.Mesh | undefined;

  if (type === 'lurker') {
    // Quadruped scuttler: Carapace, 4 legs, glowing eyes
    const bodyGeo = new THREE.DodecahedronGeometry(0.38);
    const body = new THREE.Mesh(bodyGeo, materials.lurkerMat);
    body.position.y = 0.4;
    group.add(body);

    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.14, 0.45, 0.3);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.14, 0.45, 0.3);
    group.add(eyeL, eyeR);

    // Legs
    for (let i = 0; i < 4; i++) {
      const legGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.45, 6);
      const leg = new THREE.Mesh(legGeo, materials.lurkerMat);
      const side = i % 2 === 0 ? 1 : -1;
      const front = i < 2 ? 0.2 : -0.2;
      leg.position.set(side * 0.35, 0.2, front);
      leg.rotation.z = side * 0.4;
      group.add(leg);
    }
  } else if (type === 'arcanist') {
    // Floating robed skeleton mage with hovering staff
    const robeGeo = new THREE.ConeGeometry(0.35, 1.1, 8);
    const robe = new THREE.Mesh(robeGeo, materials.arcanistMat);
    robe.position.y = 0.85;
    group.add(robe);

    const skullGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const skull = new THREE.Mesh(skullGeo, materials.heroSteelMat);
    skull.position.y = 1.45;
    group.add(skull);

    // Hovering Staff
    const staffGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8);
    const staff = new THREE.Mesh(staffGeo, materials.wallMat);
    staff.position.set(0.45, 0.9, 0.1);
    const crystalGeo = new THREE.OctahedronGeometry(0.14);
    const crystalMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(0.45, 1.6, 0.1);
    group.add(staff, crystal);

    // Telegraph Ground Ring
    const teleGeo = new THREE.RingGeometry(0.8, 1.2, 24);
    teleGeo.rotateX(-Math.PI / 2);
    telegraphMesh = new THREE.Mesh(teleGeo, materials.telegraphMat);
    telegraphMesh.position.y = 0.02;
    telegraphMesh.visible = false;
  } else if (type === 'juggernaut') {
    // Massive iron brute with spiked shoulders & hammer
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.0, 0.5);
    const body = new THREE.Mesh(bodyGeo, materials.juggernautMat);
    body.position.y = 1.0;
    group.add(body);

    const headGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    const head = new THREE.Mesh(headGeo, materials.wallMat);
    head.position.y = 1.6;
    group.add(head);

    const spikeGeo = new THREE.ConeGeometry(0.12, 0.35, 6);
    const spikeL = new THREE.Mesh(spikeGeo, materials.goldTrimMat);
    spikeL.position.set(-0.48, 1.5, 0);
    spikeL.rotation.z = 0.6;
    const spikeR = new THREE.Mesh(spikeGeo, materials.goldTrimMat);
    spikeR.position.set(0.48, 1.5, 0);
    spikeR.rotation.z = -0.6;
    group.add(spikeL, spikeR);

    // Charge telegraph lane
    const teleLaneGeo = new THREE.PlaneGeometry(1.6, 6.0);
    teleLaneGeo.rotateX(-Math.PI / 2);
    telegraphMesh = new THREE.Mesh(teleLaneGeo, materials.telegraphMat);
    telegraphMesh.position.set(0, 0.02, 3.0);
    telegraphMesh.visible = false;
    group.add(telegraphMesh);
  } else if (type === 'boss') {
    // Abyssal Warden - Giant crowned demon
    const bodyGeo = new THREE.BoxGeometry(1.3, 1.6, 0.8);
    const body = new THREE.Mesh(bodyGeo, materials.bossMat);
    body.position.y = 1.6;
    group.add(body);

    const headGeo = new THREE.BoxGeometry(0.6, 0.65, 0.6);
    const head = new THREE.Mesh(headGeo, materials.wallMat);
    head.position.y = 2.65;
    group.add(head);

    // Demon horns
    const hornGeo = new THREE.ConeGeometry(0.14, 0.8, 8);
    const hornL = new THREE.Mesh(hornGeo, materials.goldTrimMat);
    hornL.position.set(-0.35, 3.1, 0.1);
    hornL.rotation.z = 0.5;
    const hornR = new THREE.Mesh(hornGeo, materials.goldTrimMat);
    hornR.position.set(0.35, 3.1, 0.1);
    hornR.rotation.z = -0.5;
    group.add(hornL, hornR);

    // Giant cleaver
    const cleaverGeo = new THREE.BoxGeometry(0.2, 2.2, 0.55);
    const cleaver = new THREE.Mesh(cleaverGeo, materials.heroSteelMat);
    cleaver.position.set(1.1, 1.7, 0.3);
    group.add(cleaver);

    // AoE Telegraph Ring
    const teleGeo = new THREE.RingGeometry(2.0, 3.8, 32);
    teleGeo.rotateX(-Math.PI / 2);
    telegraphMesh = new THREE.Mesh(teleGeo, materials.telegraphMat);
    telegraphMesh.position.y = 0.02;
    telegraphMesh.visible = false;
    group.add(telegraphMesh);
  }

  return { group, telegraphMesh };
}

/**
 * Procedural Treasure Chest Model
 */
export function createChestModel(materials: DungeonMaterials): {
  group: THREE.Group;
  lid: THREE.Group;
} {
  const group = new THREE.Group();
  group.name = 'Chest';

  // Base box
  const baseGeo = new THREE.BoxGeometry(0.8, 0.45, 0.55);
  const base = new THREE.Mesh(baseGeo, materials.chestMat);
  base.position.y = 0.225;
  group.add(base);

  // Gold Bands
  const trimGeo = new THREE.BoxGeometry(0.82, 0.47, 0.1);
  const trim1 = new THREE.Mesh(trimGeo, materials.goldTrimMat);
  trim1.position.set(0, 0.225, -0.18);
  const trim2 = new THREE.Mesh(trimGeo, materials.goldTrimMat);
  trim2.position.set(0, 0.225, 0.18);
  group.add(trim1, trim2);

  // Lid pivot group
  const lid = new THREE.Group();
  lid.position.set(0, 0.45, -0.275); // hinge at back edge

  const lidGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.8, 12, 1, false, 0, Math.PI);
  lidGeo.rotateZ(Math.PI / 2);
  const lidMesh = new THREE.Mesh(lidGeo, materials.chestMat);
  lidMesh.position.set(0, 0, 0.275);
  lid.add(lidMesh);

  // Latch
  const latchGeo = new THREE.BoxGeometry(0.1, 0.14, 0.06);
  const latch = new THREE.Mesh(latchGeo, materials.goldTrimMat);
  latch.position.set(0, 0, 0.56);
  lid.add(latch);

  group.add(lid);
  return { group, lid };
}

/**
 * Procedural Portal Gateway
 */
export function createPortalModel(materials: DungeonMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'ExitPortal';

  // Archway stone frame
  const postGeo = new THREE.BoxGeometry(0.35, 2.8, 0.35);
  const postL = new THREE.Mesh(postGeo, materials.pillarMat);
  postL.position.set(-1.1, 1.4, 0);
  const postR = new THREE.Mesh(postGeo, materials.pillarMat);
  postR.position.set(1.1, 1.4, 0);

  const topGeo = new THREE.BoxGeometry(2.6, 0.4, 0.4);
  const top = new THREE.Mesh(topGeo, materials.pillarMat);
  top.position.set(0, 2.9, 0);

  group.add(postL, postR, top);

  // Swirling Vortex Core
  const ringGeo = new THREE.TorusGeometry(0.9, 0.12, 12, 24);
  const ring = new THREE.Mesh(ringGeo, materials.portalMat);
  ring.position.y = 1.4;
  ring.name = 'portalRing';
  group.add(ring);

  // Inner energy plane
  const planeGeo = new THREE.PlaneGeometry(1.6, 2.2);
  const plane = new THREE.Mesh(planeGeo, materials.portalMat);
  plane.position.y = 1.4;
  group.add(plane);

  return group;
}
