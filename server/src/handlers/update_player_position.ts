
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type UpdatePlayerPositionInput, type Player } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePlayerPosition = async (input: UpdatePlayerPositionInput): Promise<Player> => {
  try {
    // Update player position and velocity
    const result = await db.update(playersTable)
      .set({
        x: input.x,
        y: input.y,
        velocity_x: input.velocity_x,
        velocity_y: input.velocity_y,
        updated_at: new Date()
      })
      .where(eq(playersTable.id, input.player_id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Player with id ${input.player_id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Player position update failed:', error);
    throw error;
  }
};
