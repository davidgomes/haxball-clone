
import { db } from '../db';
import { playersTable } from '../db/schema';
import { type Player } from '../schema';
import { eq } from 'drizzle-orm';

export const getPlayers = async (): Promise<Player[]> => {
  try {
    // Get all online players
    const results = await db.select()
      .from(playersTable)
      .where(eq(playersTable.is_online, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Get players failed:', error);
    throw error;
  }
};
