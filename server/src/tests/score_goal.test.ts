
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { gameStateTable, ballTable } from '../db/schema';
import { type ScoreGoalInput } from '../schema';
import { scoreGoal } from '../handlers/score_goal';
import { eq } from 'drizzle-orm';

describe('scoreGoal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create initial game state and score for red team', async () => {
    const input: ScoreGoalInput = { team: 'red' };
    
    const result = await scoreGoal(input);

    expect(result.red_score).toEqual(1);
    expect(result.blue_score).toEqual(0);
    expect(result.match_time).toEqual(0);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create initial game state and score for blue team', async () => {
    const input: ScoreGoalInput = { team: 'blue' };
    
    const result = await scoreGoal(input);

    expect(result.red_score).toEqual(0);
    expect(result.blue_score).toEqual(1);
    expect(result.match_time).toEqual(0);
    expect(result.is_active).toEqual(true);
  });

  it('should increment existing red team score', async () => {
    // Create initial game state
    await db.insert(gameStateTable)
      .values({
        red_score: 2,
        blue_score: 1,
        match_time: 300,
        is_active: true
      })
      .execute();

    const input: ScoreGoalInput = { team: 'red' };
    const result = await scoreGoal(input);

    expect(result.red_score).toEqual(3);
    expect(result.blue_score).toEqual(1);
    expect(result.match_time).toEqual(300); // Should preserve match time
    expect(result.is_active).toEqual(true);
  });

  it('should increment existing blue team score', async () => {
    // Create initial game state
    await db.insert(gameStateTable)
      .values({
        red_score: 1,
        blue_score: 3,
        match_time: 450,
        is_active: true
      })
      .execute();

    const input: ScoreGoalInput = { team: 'blue' };
    const result = await scoreGoal(input);

    expect(result.red_score).toEqual(1);
    expect(result.blue_score).toEqual(4);
    expect(result.match_time).toEqual(450);
  });

  it('should reset ball position to center', async () => {
    // Create ball with non-center position
    await db.insert(ballTable)
      .values({
        x: 100,
        y: 200,
        velocity_x: 5,
        velocity_y: -3
      })
      .execute();

    const input: ScoreGoalInput = { team: 'red' };
    await scoreGoal(input);

    // Check ball was reset
    const balls = await db.select()
      .from(ballTable)
      .execute();

    expect(balls).toHaveLength(1);
    const ball = balls[0];
    expect(ball.x).toEqual(400); // Center X
    expect(ball.y).toEqual(300); // Center Y
    expect(ball.velocity_x).toEqual(0);
    expect(ball.velocity_y).toEqual(0);
    expect(ball.updated_at).toBeInstanceOf(Date);
  });

  it('should update game state in database', async () => {
    const input: ScoreGoalInput = { team: 'red' };
    const result = await scoreGoal(input);

    // Verify data was persisted
    const gameStates = await db.select()
      .from(gameStateTable)
      .where(eq(gameStateTable.id, result.id))
      .execute();

    expect(gameStates).toHaveLength(1);
    const savedState = gameStates[0];
    expect(savedState.red_score).toEqual(1);
    expect(savedState.blue_score).toEqual(0);
    expect(savedState.is_active).toEqual(true);
  });

  it('should handle multiple consecutive goals', async () => {
    // Score for red team
    await scoreGoal({ team: 'red' });
    
    // Score for blue team
    await scoreGoal({ team: 'blue' });
    
    // Score for red team again
    const finalResult = await scoreGoal({ team: 'red' });

    expect(finalResult.red_score).toEqual(2);
    expect(finalResult.blue_score).toEqual(1);
  });
});
