
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type JoinGameInput } from '../schema';
import { joinGame } from '../handlers/join_game';
import { eq } from 'drizzle-orm';

// Test inputs
const redTeamInput: JoinGameInput = {
  player_name: 'RedPlayer',
  team: 'red'
};

const blueTeamInput: JoinGameInput = {
  player_name: 'BluePlayer',
  team: 'blue'
};

describe('joinGame', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a red team player', async () => {
    const result = await joinGame(redTeamInput);

    // Basic field validation
    expect(result.name).toEqual('RedPlayer');
    expect(result.team).toEqual('red');
    expect(result.x).toEqual(100); // Red team spawn position
    expect(result.y).toEqual(300);
    expect(result.velocity_x).toEqual(0);
    expect(result.velocity_y).toEqual(0);
    expect(result.is_online).toEqual(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('string');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a blue team player', async () => {
    const result = await joinGame(blueTeamInput);

    // Basic field validation
    expect(result.name).toEqual('BluePlayer');
    expect(result.team).toEqual('blue');
    expect(result.x).toEqual(700); // Blue team spawn position
    expect(result.y).toEqual(300);
    expect(result.velocity_x).toEqual(0);
    expect(result.velocity_y).toEqual(0);
    expect(result.is_online).toEqual(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('string');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save player to database', async () => {
    const result = await joinGame(redTeamInput);

    // Query database to verify persistence
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.id, result.id))
      .execute();

    expect(players).toHaveLength(1);
    expect(players[0].name).toEqual('RedPlayer');
    expect(players[0].team).toEqual('red');
    expect(players[0].x).toEqual(100);
    expect(players[0].y).toEqual(300);
    expect(players[0].is_online).toEqual(true);
    expect(players[0].created_at).toBeInstanceOf(Date);
    expect(players[0].updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique player IDs', async () => {
    const player1 = await joinGame(redTeamInput);
    const player2 = await joinGame(blueTeamInput);

    expect(player1.id).not.toEqual(player2.id);
    expect(typeof player1.id).toEqual('string');
    expect(typeof player2.id).toEqual('string');
    expect(player1.id.length).toBeGreaterThan(0);
    expect(player2.id.length).toBeGreaterThan(0);
  });

  it('should handle multiple players on same team', async () => {
    const player1 = await joinGame(redTeamInput);
    const player2 = await joinGame({ ...redTeamInput, player_name: 'RedPlayer2' });

    // Both should have same spawn position but different IDs
    expect(player1.x).toEqual(100);
    expect(player2.x).toEqual(100);
    expect(player1.team).toEqual('red');
    expect(player2.team).toEqual('red');
    expect(player1.id).not.toEqual(player2.id);

    // Verify both are in database
    const players = await db.select()
      .from(playersTable)
      .execute();

    expect(players).toHaveLength(2);
    expect(players.every(p => p.team === 'red')).toBe(true);
    expect(players.every(p => p.x === 100)).toBe(true);
  });

  it('should set correct spawn positions for different teams', async () => {
    const redPlayer = await joinGame(redTeamInput);
    const bluePlayer = await joinGame(blueTeamInput);

    // Red team spawns at x=100
    expect(redPlayer.x).toEqual(100);
    expect(redPlayer.y).toEqual(300);

    // Blue team spawns at x=700
    expect(bluePlayer.x).toEqual(700);
    expect(bluePlayer.y).toEqual(300);

    // Both should have zero initial velocity
    expect(redPlayer.velocity_x).toEqual(0);
    expect(redPlayer.velocity_y).toEqual(0);
    expect(bluePlayer.velocity_x).toEqual(0);
    expect(bluePlayer.velocity_y).toEqual(0);
  });
});
