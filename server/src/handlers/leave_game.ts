
import { db } from '../db';
import { playersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function leaveGame(playerId: string): Promise<{ success: boolean }> {
  try {
    // Update player's online status to false
    const result = await db.update(playersTable)
      .set({ 
        is_online: false,
        updated_at: new Date()
      })
      .where(eq(playersTable.id, playerId))
      .returning()
      .execute();

    // Return success if a player was updated
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Leave game failed:', error);
    throw error;
  }
}
