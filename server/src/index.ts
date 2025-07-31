
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import { 
  joinGameInputSchema, 
  updatePlayerPositionInputSchema, 
  updateBallInputSchema, 
  scoreGoalInputSchema 
} from './schema';

// Import handlers
import { joinGame } from './handlers/join_game';
import { leaveGame } from './handlers/leave_game';
import { getGameData } from './handlers/get_game_data';
import { updatePlayerPosition } from './handlers/update_player_position';
import { updateBall } from './handlers/update_ball';
import { scoreGoal } from './handlers/score_goal';
import { getPlayers } from './handlers/get_players';
import { initializeGame } from './handlers/initialize_game';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Game initialization
  initializeGame: publicProcedure
    .mutation(() => initializeGame()),
    
  // Player management
  joinGame: publicProcedure
    .input(joinGameInputSchema)
    .mutation(({ input }) => joinGame(input)),
    
  leaveGame: publicProcedure
    .input(z.string())
    .mutation(({ input }) => leaveGame(input)),
    
  getPlayers: publicProcedure
    .query(() => getPlayers()),
    
  // Game state
  getGameData: publicProcedure
    .query(() => getGameData()),
    
  // Real-time updates
  updatePlayerPosition: publicProcedure
    .input(updatePlayerPositionInputSchema)
    .mutation(({ input }) => updatePlayerPosition(input)),
    
  updateBall: publicProcedure
    .input(updateBallInputSchema)
    .mutation(({ input }) => updateBall(input)),
    
  // Scoring
  scoreGoal: publicProcedure
    .input(scoreGoalInputSchema)
    .mutation(({ input }) => scoreGoal(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  
  // Initialize game state on server start
  await initializeGame();
  
  server.listen(port);
  console.log(`Haxball-like game server listening at port: ${port}`);
}

start();
