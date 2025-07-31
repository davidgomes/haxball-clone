
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameStateTable, ballTable } from '../db/schema';
import { initializeGame } from '../handlers/initialize_game';

describe('initializeGame', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create new game state and ball when none exist', async () => {
    const result = await initializeGame();

    // Verify game state
    expect(result.gameState.id).toBeDefined();
    expect(result.gameState.red_score).toEqual(0);
    expect(result.gameState.blue_score).toEqual(0);
    expect(result.gameState.match_time).toEqual(0);
    expect(result.gameState.is_active).toBe(true);
    expect(result.gameState.created_at).toBeInstanceOf(Date);
    expect(result.gameState.updated_at).toBeInstanceOf(Date);

    // Verify ball
    expect(result.ball.id).toBeDefined();
    expect(result.ball.x).toEqual(400);
    expect(result.ball.y).toEqual(300);
    expect(result.ball.velocity_x).toEqual(0);
    expect(result.ball.velocity_y).toEqual(0);
    expect(result.ball.updated_at).toBeInstanceOf(Date);
  });

  it('should save game state and ball to database', async () => {
    const result = await initializeGame();

    // Check game state in database
    const gameStates = await db.select()
      .from(gameStateTable)
      .execute();

    expect(gameStates).toHaveLength(1);
    expect(gameStates[0].id).toEqual(result.gameState.id);
    expect(gameStates[0].red_score).toEqual(0);
    expect(gameStates[0].blue_score).toEqual(0);
    expect(gameStates[0].match_time).toEqual(0);
    expect(gameStates[0].is_active).toBe(true);

    // Check ball in database
    const balls = await db.select()
      .from(ballTable)
      .execute();

    expect(balls).toHaveLength(1);
    expect(balls[0].id).toEqual(result.ball.id);
    expect(balls[0].x).toEqual(400);
    expect(balls[0].y).toEqual(300);
    expect(balls[0].velocity_x).toEqual(0);
    expect(balls[0].velocity_y).toEqual(0);
  });

  it('should reset existing game state and ball when they already exist', async () => {
    // Create initial game state with non-default values
    await db.insert(gameStateTable)
      .values({
        red_score: 5,
        blue_score: 3,
        match_time: 180,
        is_active: false
      })
      .execute();

    // Create initial ball with non-default values
    await db.insert(ballTable)
      .values({
        x: 100,
        y: 200,
        velocity_x: 10,
        velocity_y: -5
      })
      .execute();

    const result = await initializeGame();

    // Verify game state was reset
    expect(result.gameState.red_score).toEqual(0);
    expect(result.gameState.blue_score).toEqual(0);
    expect(result.gameState.match_time).toEqual(0);
    expect(result.gameState.is_active).toBe(true);

    // Verify ball was reset
    expect(result.ball.x).toEqual(400);
    expect(result.ball.y).toEqual(300);
    expect(result.ball.velocity_x).toEqual(0);
    expect(result.ball.velocity_y).toEqual(0);

    // Verify only one game state and ball exist
    const gameStates = await db.select()
      .from(gameStateTable)
      .execute();
    expect(gameStates).toHaveLength(1);

    const balls = await db.select()
      .from(ballTable)
      .execute();
    expect(balls).toHaveLength(1);
  });

  it('should handle multiple initialization calls correctly', async () => {
    // First initialization
    const result1 = await initializeGame();
    
    // Second initialization
    const result2 = await initializeGame();

    // Should use the same records but reset values
    expect(result1.gameState.id).toEqual(result2.gameState.id);
    expect(result1.ball.id).toEqual(result2.ball.id);

    // Values should still be reset
    expect(result2.gameState.red_score).toEqual(0);
    expect(result2.gameState.blue_score).toEqual(0);
    expect(result2.gameState.match_time).toEqual(0);
    expect(result2.gameState.is_active).toBe(true);

    expect(result2.ball.x).toEqual(400);
    expect(result2.ball.y).toEqual(300);
    expect(result2.ball.velocity_x).toEqual(0);
    expect(result2.ball.velocity_y).toEqual(0);

    // Should still have only one of each
    const gameStates = await db.select()
      .from(gameStateTable)
      .execute();
    expect(gameStates).toHaveLength(1);

    const balls = await db.select()
      .from(ballTable)
      .execute();
    expect(balls).toHaveLength(1);
  });
});
