import { DungeonGrid, DungeonRoom } from './types.ts';

export function generateProceduralDungeon(floorLevel: number = 1, seed: number = Date.now()): DungeonGrid {
  // Simple seeded pseudo-random
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

  const width = 50;
  const height = 50;
  const tiles: number[][] = Array.from({ length: height }, () => Array(width).fill(0));

  const roomCount = 6 + Math.min(Math.floor(floorLevel / 2), 4); // 6 to 10 rooms
  const rooms: DungeonRoom[] = [];

  // Attempt room placement
  for (let i = 0; i < roomCount * 5 && rooms.length < roomCount; i++) {
    const rw = randInt(7, 11);
    const rh = randInt(7, 11);
    const rx = randInt(2, width - rw - 3);
    const ry = randInt(2, height - rh - 3);

    // Check overlap with existing rooms (buffer of 2)
    let overlaps = false;
    for (const r of rooms) {
      if (
        rx < r.x + r.width + 2 &&
        rx + rw + 2 > r.x &&
        ry < r.y + r.height + 2 &&
        ry + rh + 2 > r.y
      ) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      let roomType: DungeonRoom['type'] = 'normal';
      if (rooms.length === 0) roomType = 'spawn';
      else if (rooms.length === 1) roomType = 'treasure';
      else if (rooms.length === 2) roomType = 'shrine';

      rooms.push({
        id: rooms.length,
        x: rx,
        y: ry,
        width: rw,
        height: rh,
        type: roomType,
        connectedTo: [],
        visited: false,
      });

      // Carve room floor
      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) {
          tiles[y][x] = 1;
        }
      }
    }
  }

  // Set farthest room as boss room
  if (rooms.length > 2) {
    const spawn = rooms[0];
    let maxDist = -1;
    let bossIdx = rooms.length - 1;
    for (let i = 1; i < rooms.length; i++) {
      const r = rooms[i];
      const dist = Math.hypot(r.x + r.width / 2 - (spawn.x + spawn.width / 2), r.y + r.height / 2 - (spawn.y + spawn.height / 2));
      if (dist > maxDist) {
        maxDist = dist;
        bossIdx = i;
      }
    }
    rooms[bossIdx].type = 'boss';
  }

  // Connect rooms with corridors that are at least 2 TILES WIDE
  const connectRooms = (r1: DungeonRoom, r2: DungeonRoom) => {
    const startX = Math.floor(r1.x + r1.width / 2);
    const startY = Math.floor(r1.y + r1.height / 2);
    const endX = Math.floor(r2.x + r2.width / 2);
    const endY = Math.floor(r2.y + r2.height / 2);

    // Carve horizontal corridor (width = 2)
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    for (let x = minX; x <= maxX; x++) {
      for (let off = 0; off < 2; off++) {
        const y = startY + off;
        if (y >= 0 && y < height && x >= 0 && x < width) {
          if (tiles[y][x] === 0) tiles[y][x] = 2;
        }
      }
    }

    // Carve vertical corridor (width = 2)
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    for (let y = minY; y <= maxY; y++) {
      for (let off = 0; off < 2; off++) {
        const x = endX + off;
        if (y >= 0 && y < height && x >= 0 && x < width) {
          if (tiles[y][x] === 0) tiles[y][x] = 2;
        }
      }
    }

    r1.connectedTo.push(r2.id);
    r2.connectedTo.push(r1.id);
  };

  // Connect consecutively and add 1-2 cross connections for loops
  for (let i = 0; i < rooms.length - 1; i++) {
    connectRooms(rooms[i], rooms[i + 1]);
  }
  if (rooms.length > 3) {
    connectRooms(rooms[0], rooms[Math.floor(rooms.length / 2)]);
  }

  // Player spawn in center of spawn room
  const spawnRoom = rooms[0];
  const spawnPos = {
    x: Math.floor(spawnRoom.x + spawnRoom.width / 2),
    z: Math.floor(spawnRoom.y + spawnRoom.height / 2),
  };

  // Exit portal in boss room or last room
  const bossRoom = rooms.find((r) => r.type === 'boss') || rooms[rooms.length - 1];
  const exitPos = {
    x: Math.floor(bossRoom.x + bossRoom.width / 2),
    z: Math.floor(bossRoom.y + bossRoom.height / 2),
  };
  tiles[exitPos.z][exitPos.x] = 4; // exit portal marker

  // Enemy spawns & Chests
  const enemySpawns: DungeonGrid['enemySpawns'] = [];
  const chests: DungeonGrid['chests'] = [];
  const torches: DungeonGrid['torches'] = [];

  rooms.forEach((room) => {
    // Torches around room walls
    torches.push({ x: room.x + 1, z: room.y });
    torches.push({ x: room.x + room.width - 2, z: room.y + room.height - 1 });

    if (room.type === 'spawn') {
      // No enemies in spawn room! Completely safe initial area
      return;
    }

    if (room.type === 'boss') {
      // Place boss in center
      enemySpawns.push({
        x: room.x + room.width / 2,
        z: room.y + room.height / 2 - 1,
        type: 'boss',
      });
      // 2 elite guards
      enemySpawns.push({
        x: room.x + 2,
        z: room.y + 2,
        type: 'juggernaut',
      });
      enemySpawns.push({
        x: room.x + room.width - 3,
        z: room.y + 2,
        type: 'arcanist',
      });
      // 2 boss reward chests
      chests.push({ x: room.x + 2, z: room.y + room.height - 2, opened: false });
      chests.push({ x: room.x + room.width - 3, z: room.y + room.height - 2, opened: false });
      return;
    }

    if (room.type === 'treasure') {
      chests.push({ x: room.x + Math.floor(room.width / 2), z: room.y + Math.floor(room.height / 2), opened: false });
      // Minor ambush
      enemySpawns.push({ x: room.x + 2, z: room.y + 2, type: 'lurker' });
      enemySpawns.push({ x: room.x + room.width - 3, z: room.y + room.height - 3, type: 'lurker' });
      return;
    }

    // Normal encounter room
    const mobCount = randInt(2, 4);
    for (let m = 0; m < mobCount; m++) {
      const mobX = room.x + 2 + randInt(0, room.width - 5);
      const mobZ = room.y + 2 + randInt(0, room.height - 5);
      const roll = rand();
      const mobType = roll < 0.5 ? 'lurker' : roll < 0.8 ? 'arcanist' : 'juggernaut';
      enemySpawns.push({ x: mobX, z: mobZ, type: mobType });
    }

    if (rand() > 0.4) {
      chests.push({ x: room.x + 2, z: room.y + 2, opened: false });
    }
  });

  return {
    width,
    height,
    tiles,
    rooms,
    spawnPos,
    exitPos,
    enemySpawns,
    chests,
    torches,
  };
}

export function isWalkable(grid: DungeonGrid, x: number, z: number): boolean {
  const gx = Math.round(x);
  const gz = Math.round(z);
  if (gx < 0 || gx >= grid.width || gz < 0 || gz >= grid.height) return false;
  const tile = grid.tiles[gz][gx];
  return tile === 1 || tile === 2 || tile === 4; // floor, corridor, exit
}

export function verifyPathExists(grid: DungeonGrid): boolean {
  const start = grid.spawnPos;
  const target = grid.exitPos;
  const queue: [number, number][] = [[start.x, start.z]];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.z}`);

  while (queue.length > 0) {
    const [cx, cz] = queue.shift()!;
    if (cx === target.x && cz === target.z) {
      return true;
    }

    const neighbors = [
      [cx + 1, cz],
      [cx - 1, cz],
      [cx, cz + 1],
      [cx, cz - 1],
    ];

    for (const [nx, nz] of neighbors) {
      const key = `${nx},${nz}`;
      if (!visited.has(key) && isWalkable(grid, nx, nz)) {
        visited.add(key);
        queue.push([nx, nz]);
      }
    }
  }

  return false;
}
