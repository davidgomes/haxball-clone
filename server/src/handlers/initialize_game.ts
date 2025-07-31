
import { db } from '../db';
import { gameStateTable, ballTable } from '../db/schema';
import { type GameState, type Ball } from '../schema';
import { eq } from 'drizzle-orm';

export async function initializeGame(): Promise<{ gameState: GameState; ball: Ball }> {
  try {
    // Check if game state already exists
    const existingGameState = await db.select()
      .from(gameStateTable)
      .limit(1)
      .execute();

    let gameState: GameState;
    
    if (existingGameState.length === 0) {
      // Create new game state
      const gameStateResult = await db.insert(gameStateTable)
        .values({
          red_score: 0,
          blue_score: 0,
          match_time: 0,
          is_active: true
        })
        .returning()
        .execute();
      
      gameState = gameStateResult[0];
    } else {
      // Reset existing game state
      const gameStateResult = await db.update(gameStateTable)
        .set({
          red_score: 0,
          blue_score: 0,
          match_time: 0,
          is_active: true,
          updated_at: new Date()
        })
        .where(eq(gameStateTable.id, existingGameState[0].id))
        .returning()
        .execute();
      
      gameState = gameStateResult[0];
    }

    // Check if ball already exists
    const existingBall = await db.select()
      .from(ballTable)
      .limit(1)
      .execute();

    let ball: Ball;
    
    if (existingBall.length === 0) {
      // Create new ball
      const ballResult = await db.insert(ballTable)
        .values({
          x: 400, // Center of field
          y: 300,
          velocity_x: 0,
          velocity_y: 0
        })
        .returning()
        .execute();
      
      ball = ballResult[0];
    } else {
      // Reset existing ball to center
      const ballResult = await db.update(ballTable)
        .set({
          x: 400,
          y: 300,
          velocity_x: 0,
          velocity_y: 0,
          updated_at: new Date()
        })
        .where(eq(ballTable.id, existingBall[0].id))
        .returning()
        .execute();
      
      ball = ballResult[0];
    }

    return { gameState, ball };
  } catch (error) {
    console.error('Game initialization failed:', error);
    throw error;
  }
}
