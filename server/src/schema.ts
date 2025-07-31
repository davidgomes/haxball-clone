
import { z } from 'zod';

// Player schema
export const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  velocity_x: z.number(),
  velocity_y: z.number(),
  team: z.enum(['red', 'blue']),
  is_online: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Player = z.infer<typeof playerSchema>;

// Ball schema
export const ballSchema = z.object({
  id: z.number(),
  x: z.number(),
  y: z.number(),
  velocity_x: z.number(),
  velocity_y: z.number(),
  updated_at: z.coerce.date()
});

export type Ball = z.infer<typeof ballSchema>;

// Game state schema
export const gameStateSchema = z.object({
  id: z.number(),
  red_score: z.number().int(),
  blue_score: z.number().int(),
  match_time: z.number().int(), // seconds since game start
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type GameState = z.infer<typeof gameStateSchema>;

// Input schemas
export const joinGameInputSchema = z.object({
  player_name: z.string().min(1).max(20),
  team: z.enum(['red', 'blue'])
});

export type JoinGameInput = z.infer<typeof joinGameInputSchema>;

export const playerMoveInputSchema = z.object({
  player_id: z.string(),
  direction_x: z.number().min(-1).max(1), // normalized direction
  direction_y: z.number().min(-1).max(1)
});

export type PlayerMoveInput = z.infer<typeof playerMoveInputSchema>;

export const updatePlayerPositionInputSchema = z.object({
  player_id: z.string(),
  x: z.number(),
  y: z.number(),
  velocity_x: z.number(),
  velocity_y: z.number()
});

export type UpdatePlayerPositionInput = z.infer<typeof updatePlayerPositionInputSchema>;

export const updateBallInputSchema = z.object({
  x: z.number(),
  y: z.number(),
  velocity_x: z.number(),
  velocity_y: z.number()
});

export type UpdateBallInput = z.infer<typeof updateBallInputSchema>;

export const scoreGoalInputSchema = z.object({
  team: z.enum(['red', 'blue'])
});

export type ScoreGoalInput = z.infer<typeof scoreGoalInputSchema>;

// Complete game data for real-time updates
export const gameDataSchema = z.object({
  players: z.array(playerSchema),
  ball: ballSchema,
  game_state: gameStateSchema
});

export type GameData = z.infer<typeof gameDataSchema>;
