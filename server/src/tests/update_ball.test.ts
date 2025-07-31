
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ballTable } from '../db/schema';
import { type UpdateBallInput } from '../schema';
import { updateBall } from '../handlers/update_ball';
import { eq } from 'drizzle-orm';

const testInput: UpdateBallInput = {
  x: 250.5,
  y: 180.75,
  velocity_x: 15.2,
  velocity_y: -8.7
};

describe('updateBall', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a ball when none exists', async () => {
    const result = await updateBall(testInput);

    expect(result.x).toEqual(250.5);
    expect(result.y).toEqual(180.75);
    expect(result.velocity_x).toEqual(15.2);
    expect(result.velocity_y).toEqual(-8.7);
    expect(result.id).toBeDefined();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update existing ball', async () => {
    // First create a ball
    await db.insert(ballTable)
      .values({
        x: 100,
        y: 100,
        velocity_x: 5,
        velocity_y: 5
      })
      .execute();

    // Update the ball
    const result = await updateBall(testInput);

    expect(result.x).toEqual(250.5);
    expect(result.y).toEqual(180.75);
    expect(result.velocity_x).toEqual(15.2);
    expect(result.velocity_y).toEqual(-8.7);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save ball data to database', async () => {
    const result = await updateBall(testInput);

    const balls = await db.select()
      .from(ballTable)
      .where(eq(ballTable.id, result.id))
      .execute();

    expect(balls).toHaveLength(1);
    expect(balls[0].x).toEqual(250.5);
    expect(balls[0].y).toEqual(180.75);
    expect(balls[0].velocity_x).toEqual(15.2);
    expect(balls[0].velocity_y).toEqual(-8.7);
    expect(balls[0].updated_at).toBeInstanceOf(Date);
  });

  it('should only maintain one ball record', async () => {
    // Create initial ball
    await updateBall(testInput);
    
    // Update ball again
    const updatedInput: UpdateBallInput = {
      x: 400,
      y: 300,
      velocity_x: 0,
      velocity_y: 0
    };
    
    await updateBall(updatedInput);

    // Verify only one ball exists
    const balls = await db.select()
      .from(ballTable)
      .execute();

    expect(balls).toHaveLength(1);
    expect(balls[0].x).toEqual(400);
    expect(balls[0].y).toEqual(300);
    expect(balls[0].velocity_x).toEqual(0);
    expect(balls[0].velocity_y).toEqual(0);
  });

  it('should handle zero velocities', async () => {
    const zeroVelocityInput: UpdateBallInput = {
      x: 400,
      y: 300,
      velocity_x: 0,
      velocity_y: 0
    };

    const result = await updateBall(zeroVelocityInput);

    expect(result.velocity_x).toEqual(0);
    expect(result.velocity_y).toEqual(0);
    expect(result.x).toEqual(400);
    expect(result.y).toEqual(300);
  });

  it('should handle negative velocities', async () => {
    const negativeVelocityInput: UpdateBallInput = {
      x: 200,
      y: 150,
      velocity_x: -10.5,
      velocity_y: -15.3
    };

    const result = await updateBall(negativeVelocityInput);

    expect(result.velocity_x).toEqual(-10.5);
    expect(result.velocity_y).toEqual(-15.3);
    expect(result.x).toEqual(200);
    expect(result.y).toEqual(150);
  });
});
