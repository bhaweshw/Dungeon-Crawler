import * as THREE from 'three';

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  z: number;
  life: number;
  maxLife: number;
  color: string;
  isCrit: boolean;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
}

export class ParticlePool {
  private count: number;
  private particles: Particle[];
  private mesh: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private color = new THREE.Color();

  constructor(scene: THREE.Scene, capacity: number = 250) {
    this.count = capacity;
    this.particles = Array.from({ length: capacity }, () => ({
      active: false,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 1,
      size: 0.1,
      r: 1,
      g: 1,
      b: 1,
    }));

    const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, capacity);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;

    // Initialize all instances off-screen
    for (let i = 0; i < capacity; i++) {
      this.dummy.position.set(0, -999, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      this.mesh.setColorAt(i, this.color.setHex(0xffffff));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

    scene.add(this.mesh);
  }

  burst(x: number, y: number, z: number, count: number, colorHex: number, speed: number = 2.5) {
    this.color.setHex(colorHex);
    let spawned = 0;
    for (let i = 0; i < this.count && spawned < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        p.z = z;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const s = speed * (0.5 + Math.random() * 0.7);
        p.vx = Math.sin(phi) * Math.cos(theta) * s;
        p.vy = Math.cos(phi) * s + 1.2;
        p.vz = Math.sin(phi) * Math.sin(theta) * s;
        p.life = 0;
        p.maxLife = 0.35 + Math.random() * 0.3;
        p.size = 0.08 + Math.random() * 0.08;
        p.r = this.color.r;
        p.g = this.color.g;
        p.b = this.color.b;
        spawned++;
      }
    }
  }

  update(dt: number) {
    let needsMatrixUpdate = false;
    let needsColorUpdate = false;

    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          this.dummy.position.set(0, -999, 0);
          this.dummy.updateMatrix();
          this.mesh.setMatrixAt(i, this.dummy.matrix);
          needsMatrixUpdate = true;
        } else {
          p.vy -= 9.8 * dt; // gravity
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;

          if (p.y < 0.05) {
            p.y = 0.05;
            p.vy *= -0.3;
          }

          const progress = p.life / p.maxLife;
          const scale = p.size * (1 - progress);

          this.dummy.position.set(p.x, p.y, p.z);
          this.dummy.scale.set(scale, scale, scale);
          this.dummy.rotation.x += dt * 3;
          this.dummy.rotation.y += dt * 4;
          this.dummy.updateMatrix();

          this.mesh.setMatrixAt(i, this.dummy.matrix);
          this.color.setRGB(p.r, p.g, p.b);
          this.mesh.setColorAt(i, this.color);

          needsMatrixUpdate = true;
          needsColorUpdate = true;
        }
      }
    }

    if (needsMatrixUpdate) this.mesh.instanceMatrix.needsUpdate = true;
    if (needsColorUpdate && this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  dispose() {
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((m) => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
  }
}
