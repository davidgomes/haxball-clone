
import { serial, text, pgTable, timestamp, real, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Enum for team colors
export const teamEnum = pgEnum('team', ['red', 'blue']);

export const playersTable = pgTable('players', {
  id: text('id').primaryKey(), // UUID as string
  name: text('name').notNull(),
  x: real('x').notNull().default(0),
  y: real('y').notNull().default(0),
  velocity_x: real('velocity_x').notNull().default(0),
  velocity_y: real('velocity_y').notNull().default(0),
  team: teamEnum('team').notNull(),
  is_online: boolean('is_online').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const ballTable = pgTable('ball', {
  id: serial('id').primaryKey(),
  x: real('x').notNull().default(400), // Center of field
  y: real('y').notNull().default(300),
  velocity_x: real('velocity_x').notNull().default(0),
  velocity_y: real('velocity_y').notNull().default(0),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const gameStateTable = pgTable('game_state', {
  id: serial('id').primaryKey(),
  red_score: integer('red_score').notNull().default(0),
  blue_score: integer('blue_score').notNull().default(0),
  match_time: integer('match_time').notNull().default(0), // seconds
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Player = typeof playersTable.$inferSelect;
export type NewPlayer = typeof playersTable.$inferInsert;
export type Ball = typeof ballTable.$inferSelect;
export type NewBall = typeof ballTable.$inferInsert;
export type GameState = typeof gameStateTable.$inferSelect;
export type NewGameState = typeof gameStateTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  players: playersTable, 
  ball: ballTable, 
  game_state: gameStateTable 
};
