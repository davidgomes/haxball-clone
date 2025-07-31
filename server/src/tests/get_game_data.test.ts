
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { playersTable, ballTable, gameStateTable } from '../db/schema';
import { getGameData } from '../handlers/get_game_data';

describe('getGameData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty players array when no players exist', async () => {
    const result = await getGameData();

    expect(result.players).toEqual([]);
    expect(result.ball).toBeDefined();
    expect(result.game_state).toBeDefined();
  });

  it('should return only online players', async () => {
    // Create test players - one online, one offline
    await db.insert(playersTable).values([
      {
        id: 'player1',
        name: 'Online Player',
        x: 100,
        y: 200,
        velocity_x: 5,
        velocity_y: -3,
        team: 'red',
        is_online: true
      },
      {
        id: 'player2',
        name: 'Offline Player',
        x: 300,
        y: 400,
        velocity_x: 0,
        velocity_y: 0,
        team: 'blue',
        is_online: false
      }
    ]).execute();

    const result = await getGameData();

    expect(result.players).toHaveLength(1);
    expect(result.players[0].name).toEqual('Online Player');
    expect(result.players[0].is_online).toBe(true);
    expect(result.players[0].x).toEqual(100);
    expect(result.players[0].y).toEqual(200);
    expect(result.players[0].team).toEqual('red');
  });

  it('should return actual ball data when ball exists', async () => {
    // Create test ball
    await db.insert(ballTable).values({
      x: 250,
      y: 150,
      velocity_x: 10,
      velocity_y: -5
    }).execute();

    const result = await getGameData();

    expect(result.ball.x).toEqual(250);
    expect(result.ball.y).toEqual(150);
    expect(result.ball.velocity_x).toEqual(10);
    expect(result.ball.velocity_y).toEqual(-5);
    expect(result.ball.updated_at).toBeInstanceOf(Date);
  });

  it('should return default ball when no ball exists', async () => {
    const result = await getGameData();

    expect(result.ball.id).toEqual(1);
    expect(result.ball.x).toEqual(400);
    expect(result.ball.y).toEqual(300);
    expect(result.ball.velocity_x).toEqual(0);
    expect(result.ball.velocity_y).toEqual(0);
    expect(result.ball.updated_at).toBeInstanceOf(Date);
  });

  it('should return actual game state when active game exists', async () => {
    // Create test game state
    await db.insert(gameStateTable).values({
      red_score: 3,
      blue_score: 1,
      match_time: 450,
      is_active: true
    }).execute();

    const result = await getGameData();

    expect(result.game_state.red_score).toEqual(3);
    expect(result.game_state.blue_score).toEqual(1);
    expect(result.game_state.match_time).toEqual(450);
    expect(result.game_state.is_active).toBe(true);
    expect(result.game_state.created_at).toBeInstanceOf(Date);
    expect(result.game_state.updated_at).toBeInstanceOf(Date);
  });

  it('should return default game state when no active game exists', async () => {
    const result = await getGameData();

    expect(result.game_state.id).toEqual(1);
    expect(result.game_state.red_score).toEqual(0);
    expect(result.game_state.blue_score).toEqual(0);
    expect(result.game_state.match_time).toEqual(0);
    expect(result.game_state.is_active).toBe(true);
    expect(result.game_state.created_at).toBeInstanceOf(Date);
    expect(result.game_state.updated_at).toBeInstanceOf(Date);
  });

  it('should return complete game data with all components', async () => {
    // Create complete test data
    await db.insert(playersTable).values([
      {
        id: 'red1',
        name: 'Red Player 1',
        x: 50,
        y: 150,
        velocity_x: 2,
        velocity_y: 1,
        team: 'red',
        is_online: true
      },
      {
        id: 'blue1',
        name: 'Blue Player 1',
        x: 750,
        y: 150,
        velocity_x: -3,
        velocity_y: 2,
        team: 'blue',
        is_online: true
      }
    ]).execute();

    await db.insert(ballTable).values({
      x: 400,
      y: 300,
      velocity_x: 8,
      velocity_y: -4
    }).execute();

    await db.insert(gameStateTable).values({
      red_score: 2,
      blue_score: 2,
      match_time: 600,
      is_active: true
    }).execute();

    const result = await getGameData();

    // Verify all components are present
    expect(result.players).toHaveLength(2);
    expect(result.players.map(p => p.team)).toEqual(['red', 'blue']);
    expect(result.ball.x).toEqual(400);
    expect(result.ball.velocity_x).toEqual(8);
    expect(result.game_state.red_score).toEqual(2);
    expect(result.game_state.blue_score).toEqual(2);
    expect(result.game_state.match_time).toEqual(600);
  });
});
