
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type JoinGameInput, type Player } from '../schema';
import { randomUUID } from 'crypto';

export async function joinGame(input: JoinGameInput): Promise<Player> {
  try {
    // Generate unique player ID
    const playerId = randomUUID();
    
    // Set spawn positions based on team
    const spawnX = input.team === 'red' ? 100 : 700;
    const spawnY = 300;
    
    // Insert player record
    const result = await db.insert(playersTable)
      .values({
        id: playerId,
        name: input.player_name,
        x: spawnX,
        y: spawnY,
        velocity_x: 0,
        velocity_y: 0,
        team: input.team,
        is_online: true
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Player join failed:', error);
    throw error;
  }
}
