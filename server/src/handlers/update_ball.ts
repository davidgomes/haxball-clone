
import { db } from '../db';
import { ballTable } from '../db/schema';
import { type UpdateBallInput, type Ball } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBall = async (input: UpdateBallInput): Promise<Ball> => {
  try {
    // First, get the current ball record (there should only be one)
    const existingBalls = await db.select()
      .from(ballTable)
      .limit(1)
      .execute();

    let ballId: number;
    
    if (existingBalls.length === 0) {
      // No ball exists, create one
      const result = await db.insert(ballTable)
        .values({
          x: input.x,
          y: input.y,
          velocity_x: input.velocity_x,
          velocity_y: input.velocity_y,
          updated_at: new Date()
        })
        .returning()
        .execute();
      
      return result[0];
    } else {
      // Update existing ball
      ballId = existingBalls[0].id;
      
      const result = await db.update(ballTable)
        .set({
          x: input.x,
          y: input.y,
          velocity_x: input.velocity_x,
          velocity_y: input.velocity_y,
          updated_at: new Date()
        })
        .where(eq(ballTable.id, ballId))
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('Ball update failed:', error);
    throw error;
  }
};
