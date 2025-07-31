
import { db } from '../db';
import { playersTable, ballTable, gameStateTable } from '../db/schema';
import { type GameData } from '../schema';
import { eq } from 'drizzle-orm';

export const getGameData = async (): Promise<GameData> => {
  try {
    // Get all online players
    const players = await db.select()
      .from(playersTable)
      .where(eq(playersTable.is_online, true))
      .execute();

    // Get the current ball state (assuming there's only one ball)
    const ballResults = await db.select()
      .from(ballTable)
      .limit(1)
      .execute();

    // Get the current game state (assuming there's only one active game)
    const gameStateResults = await db.select()
      .from(gameStateTable)
      .where(eq(gameStateTable.is_active, true))
      .limit(1)
      .execute();

    // Handle case where no ball exists - create default ball
    const ball = ballResults.length > 0 ? ballResults[0] : {
      id: 1,
      x: 400,
      y: 300,
      velocity_x: 0,
      velocity_y: 0,
      updated_at: new Date()
    };

    // Handle case where no game state exists - create default game state
    const gameState = gameStateResults.length > 0 ? gameStateResults[0] : {
      id: 1,
      red_score: 0,
      blue_score: 0,
      match_time: 0,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    return {
      players: players,
      ball: ball,
      game_state: gameState
    };
  } catch (error) {
    console.error('Failed to get game data:', error);
    throw error;
  }
};
