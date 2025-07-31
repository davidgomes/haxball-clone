
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { getPlayers } from '../handlers/get_players';

describe('getPlayers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no players exist', async () => {
    const result = await getPlayers();
    expect(result).toEqual([]);
  });

  it('should return all online players', async () => {
    // Create test players
    await db.insert(playersTable).values([
      {
        id: 'player1',
        name: 'Player One',
        x: 100,
        y: 150,
        velocity_x: 0,
        velocity_y: 0,
        team: 'red',
        is_online: true
      },
      {
        id: 'player2',
        name: 'Player Two',
        x: 700,
        y: 450,
        velocity_x: 5,
        velocity_y: -3,
        team: 'blue',
        is_online: true
      }
    ]).execute();

    const result = await getPlayers();

    expect(result).toHaveLength(2);
    
    // Check first player
    const player1 = result.find(p => p.id === 'player1');
    expect(player1).toBeDefined();
    expect(player1!.name).toEqual('Player One');
    expect(player1!.x).toEqual(100);
    expect(player1!.y).toEqual(150);
    expect(player1!.team).toEqual('red');
    expect(player1!.is_online).toBe(true);
    expect(player1!.created_at).toBeInstanceOf(Date);
    expect(player1!.updated_at).toBeInstanceOf(Date);

    // Check second player
    const player2 = result.find(p => p.id === 'player2');
    expect(player2).toBeDefined();
    expect(player2!.name).toEqual('Player Two');
    expect(player2!.velocity_x).toEqual(5);
    expect(player2!.velocity_y).toEqual(-3);
    expect(player2!.team).toEqual('blue');
  });

  it('should only return online players', async () => {
    // Create mix of online and offline players
    await db.insert(playersTable).values([
      {
        id: 'online1',
        name: 'Online Player',
        x: 200,
        y: 250,
        velocity_x: 0,
        velocity_y: 0,
        team: 'red',
        is_online: true
      },
      {
        id: 'offline1',
        name: 'Offline Player',
        x: 300,
        y: 350,
        velocity_x: 0,
        velocity_y: 0,
        team: 'blue',
        is_online: false
      },
      {
        id: 'online2',
        name: 'Another Online Player',
        x: 400,
        y: 450,
        velocity_x: 2,
        velocity_y: 1,
        team: 'blue',
        is_online: true
      }
    ]).execute();

    const result = await getPlayers();

    expect(result).toHaveLength(2);
    
    // Verify only online players are returned
    const playerIds = result.map(p => p.id);
    expect(playerIds).toContain('online1');
    expect(playerIds).toContain('online2');
    expect(playerIds).not.toContain('offline1');

    // Verify all returned players are online
    result.forEach(player => {
      expect(player.is_online).toBe(true);
    });
  });

  it('should return players with correct data types', async () => {
    // Create test player with specific data types
    await db.insert(playersTable).values({
      id: 'type-test',
      name: 'Type Test Player',
      x: 123.45,
      y: 678.90,
      velocity_x: -2.5,
      velocity_y: 3.7,
      team: 'red',
      is_online: true
    }).execute();

    const result = await getPlayers();

    expect(result).toHaveLength(1);
    const player = result[0];
    
    // Verify data types
    expect(typeof player.id).toBe('string');
    expect(typeof player.name).toBe('string');
    expect(typeof player.x).toBe('number');
    expect(typeof player.y).toBe('number');
    expect(typeof player.velocity_x).toBe('number');
    expect(typeof player.velocity_y).toBe('number');
    expect(typeof player.is_online).toBe('boolean');
    expect(player.created_at).toBeInstanceOf(Date);
    expect(player.updated_at).toBeInstanceOf(Date);
    
    // Verify specific values
    expect(player.x).toEqual(123.45);
    expect(player.y).toEqual(678.90);
    expect(player.velocity_x).toEqual(-2.5);
    expect(player.velocity_y).toEqual(3.7);
  });
});
