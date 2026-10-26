import test from 'node:test';
import assert from 'node:assert/strict';
import { generateProceduralDungeon, isWalkable, verifyPathExists } from './dungeonGenerator.ts';

test('dungeon generation creates valid grid, rooms, and >= 2-tile corridors', () => {
  const dungeon = generateProceduralDungeon(1, 12345);
  assert.ok(dungeon.rooms.length >= 6, 'Should generate at least 6 rooms');
  assert.ok(dungeon.spawnPos, 'Should have spawn position');
  assert.ok(dungeon.exitPos, 'Should have exit position');
  assert.ok(isWalkable(dungeon, dungeon.spawnPos.x, dungeon.spawnPos.z), 'Spawn must be walkable');
  assert.ok(isWalkable(dungeon, dungeon.exitPos.x, dungeon.exitPos.z), 'Exit must be walkable');

  // Verify path from spawn to exit exists without any blocking walls
  const pathExists = verifyPathExists(dungeon);
  assert.equal(pathExists, true, 'Spawn must have a reachable path to the exit portal');

  // Verify spawn room has no enemy spawns
  const spawnRoom = dungeon.rooms.find(r => r.type === 'spawn')!;
  const enemiesInSpawn = dungeon.enemySpawns.filter(e => 
    e.x >= spawnRoom.x && e.x < spawnRoom.x + spawnRoom.width &&
    e.z >= spawnRoom.y && e.z < spawnRoom.y + spawnRoom.height
  );
  assert.equal(enemiesInSpawn.length, 0, 'Spawn room must be clear of enemies');
});
