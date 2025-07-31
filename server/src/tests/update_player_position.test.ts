
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type UpdatePlayerPositionInput } from '../schema';
import { updatePlayerPosition } from '../handlers/update_player_position';
import { eq } from 'drizzle-orm';

describe('updatePlayerPosition', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update player position and velocity', async () => {
    // Create a test player first
    const player = await db.insert(playersTable)
      .values({
        id: 'test-player-123',
        name: 'Test Player',
        x: 100,
        y: 200,
        velocity_x: 0,
        velocity_y: 0,
        team: 'red'
      })
      .returning()
      .execute();

    const input: UpdatePlayerPositionInput = {
      player_id: 'test-player-123',
      x: 150,
      y: 250,
      velocity_x: 5.5,
      velocity_y: -3.2
    };

    const result = await updatePlayerPosition(input);

    // Verify returned data
    expect(result.id).toBe('test-player-123');
    expect(result.name).toBe('Test Player');
    expect(result.x).toBe(150);
    expect(result.y).toBe(250);
    expect(result.velocity_x).toBe(5.5);
    expect(result.velocity_y).toBe(-3.2);
    expect(result.team).toBe('red');
    expect(result.is_online).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(player[0].updated_at.getTime());
  });

  it('should save updated position to database', async () => {
    // Create a test player first
    await db.insert(playersTable)
      .values({
        id: 'test-player-456',
        name: 'Database Test Player',
        x: 0,
        y: 0,
        velocity_x: 0,
        velocity_y: 0,
        team: 'blue'
      })
      .execute();

    const input: UpdatePlayerPositionInput = {
      player_id: 'test-player-456',
      x: 300.75,
      y: 150.25,
      velocity_x: -2.8,
      velocity_y: 4.1
    };

    await updatePlayerPosition(input);

    // Verify database was updated
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, 'test-player-456'))
      .execute();

    expect(players).toHaveLength(1);
    const player = players[0];
    expect(player.x).toBe(300.75);
    expect(player.y).toBe(150.25);
    expect(player.velocity_x).toBe(-2.8);
    expect(player.velocity_y).toBe(4.1);
    expect(player.updated_at).toBeInstanceOf(Date);
  });

  it('should handle negative coordinates and velocities', async () => {
    // Create a test player first
    await db.insert(playersTable)
      .values({
        id: 'test-player-789',
        name: 'Negative Test Player',
        x: 0,
        y: 0,
        velocity_x: 0,
        velocity_y: 0,
        team: 'red'
      })
      .execute();

    const input: UpdatePlayerPositionInput = {
      player_id: 'test-player-789',
      x: -50.5,
      y: -100.25,
      velocity_x: -10.7,
      velocity_y: -5.3
    };

    const result = await updatePlayerPosition(input);

    expect(result.x).toBe(-50.5);
    expect(result.y).toBe(-100.25);
    expect(result.velocity_x).toBe(-10.7);
    expect(result.velocity_y).toBe(-5.3);
  });

  it('should throw error for non-existent player', async () => {
    const input: UpdatePlayerPositionInput = {
      player_id: 'non-existent-player',
      x: 100,
      y: 200,
      velocity_x: 1,
      velocity_y: 1
    };

    await expect(updatePlayerPosition(input)).rejects.toThrow(/Player with id non-existent-player not found/i);
  });

  it('should preserve other player fields when updating position', async () => {
    // Create a test player with specific values
    await db.insert(playersTable)
      .values({
        id: 'preserve-test-player',
        name: 'Preserve Test',
        x: 0,
        y: 0,
        velocity_x: 0,
        velocity_y: 0,
        team: 'blue',
        is_online: false
      })
      .execute();

    const input: UpdatePlayerPositionInput = {
      player_id: 'preserve-test-player',
      x: 75,
      y: 125,
      velocity_x: 2.5,
      velocity_y: -1.5
    };

    const result = await updatePlayerPosition(input);

    // Verify position fields were updated
    expect(result.x).toBe(75);
    expect(result.y).toBe(125);
    expect(result.velocity_x).toBe(2.5);
    expect(result.velocity_y).toBe(-1.5);

    // Verify other fields were preserved
    expect(result.name).toBe('Preserve Test');
    expect(result.team).toBe('blue');
    expect(result.is_online).toBe(false);
    expect(result.id).toBe('preserve-test-player');
  });
});
