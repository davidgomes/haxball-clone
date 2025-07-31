
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { leaveGame } from '../handlers/leave_game';
import { eq } from 'drizzle-orm';

describe('leaveGame', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark player as offline', async () => {
    // Create test player
    const testPlayer = await db.insert(playersTable)
      .values({
        id: 'test-player-123',
        name: 'Test Player',
        x: 100,
        y: 200,
        velocity_x: 0,
        velocity_y: 0,
        team: 'red',
        is_online: true
      })
      .returning()
      .execute();

    // Leave game
    const result = await leaveGame('test-player-123');

    // Should return success
    expect(result.success).toBe(true);

    // Verify player is marked as offline in database
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, 'test-player-123'))
      .execute();

    expect(players).toHaveLength(1);
    expect(players[0].is_online).toBe(false);
    expect(players[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return false for non-existent player', async () => {
    const result = await leaveGame('non-existent-player');

    expect(result.success).toBe(false);
  });

  it('should handle already offline player', async () => {
    // Create offline player
    await db.insert(playersTable)
      .values({
        id: 'offline-player-456',
        name: 'Offline Player',
        x: 50,
        y: 100,
        velocity_x: 0,
        velocity_y: 0,
        team: 'blue',
        is_online: false
      })
      .execute();

    // Attempt to leave game
    const result = await leaveGame('offline-player-456');

    // Should still return success (player exists)
    expect(result.success).toBe(true);

    // Verify player remains offline
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, 'offline-player-456'))
      .execute();

    expect(players).toHaveLength(1);
    expect(players[0].is_online).toBe(false);
  });

  it('should update timestamp when leaving game', async () => {
    // Create test player
    const originalTime = new Date('2023-01-01T00:00:00Z');
    await db.insert(playersTable)
      .values({
        id: 'timestamp-player-789',
        name: 'Timestamp Player',
        x: 0,
        y: 0,
        velocity_x: 0,
        velocity_y: 0,
        team: 'red',
        is_online: true,
        created_at: originalTime,
        updated_at: originalTime
      })
      .execute();

    // Leave game
    await leaveGame('timestamp-player-789');

    // Verify updated_at was changed
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, 'timestamp-player-789'))
      .execute();

    expect(players).toHaveLength(1);
    expect(players[0].updated_at).toBeInstanceOf(Date);
    expect(players[0].updated_at.getTime()).toBeGreaterThan(originalTime.getTime());
  });
});
