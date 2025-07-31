
import { db } from '../db';
import { gameStateTable, ballTable } from '../db/schema';
import { type ScoreGoalInput, type GameState } from '../schema';
import { eq } from 'drizzle-orm';

export const scoreGoal = async (input: ScoreGoalInput): Promise<GameState> => {
  try {
    // Get current game state
    const currentGameStates = await db.select()
      .from(gameStateTable)
      .orderBy(gameStateTable.id)
      .limit(1)
      .execute();

    let gameState;
    
    if (currentGameStates.length === 0) {
      // Create initial game state if none exists
      const newGameStateResult = await db.insert(gameStateTable)
        .values({
          red_score: input.team === 'red' ? 1 : 0,
          blue_score: input.team === 'blue' ? 1 : 0,
          match_time: 0,
          is_active: true
        })
        .returning()
        .execute();
      
      gameState = newGameStateResult[0];
    } else {
      // Update existing game state
      const current = currentGameStates[0];
      const updateResult = await db.update(gameStateTable)
        .set({
          red_score: input.team === 'red' ? current.red_score + 1 : current.red_score,
          blue_score: input.team === 'blue' ? current.blue_score + 1 : current.blue_score,
          updated_at: new Date()
        })
        .where(eq(gameStateTable.id, current.id))
        .returning()
        .execute();
      
      gameState = updateResult[0];
    }

    // Reset ball position to center
    await db.update(ballTable)
      .set({
        x: 400, // Center of field
        y: 300,
        velocity_x: 0,
        velocity_y: 0,
        updated_at: new Date()
      })
      .execute();

    return gameState;
  } catch (error) {
    console.error('Score goal failed:', error);
    throw error;
  }
};
