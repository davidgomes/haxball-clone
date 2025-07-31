
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameData, Player, JoinGameInput, UpdatePlayerPositionInput } from '../../server/src/schema';

function App() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [useStubData, setUseStubData] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const keysPressed = useRef<Set<string>>(new Set<string>());

  const [joinForm, setJoinForm] = useState<JoinGameInput>({
    player_name: '',
    team: 'red'
  });

  // Game constants
  const FIELD_WIDTH = 800;
  const FIELD_HEIGHT = 600;
  const PLAYER_RADIUS = 15;
  const BALL_RADIUS = 8;
  const PLAYER_SPEED = 200; // pixels per second

  // Stub data for demo purposes when backend is not available
  const createStubGameData = useCallback((): GameData => {
    const players: Player[] = [];
    if (currentPlayer) {
      players.push(currentPlayer);
      // Add some demo players
      if (currentPlayer.team === 'red') {
        players.push({
          id: 'demo-blue-1',
          name: 'Demo Blue Player',
          x: 650,
          y: 300,
          velocity_x: 0,
          velocity_y: 0,
          team: 'blue',
          is_online: true,
          created_at: new Date(),
          updated_at: new Date()
        });
      } else {
        players.push({
          id: 'demo-red-1',
          name: 'Demo Red Player',
          x: 150,
          y: 300,
          velocity_x: 0,
          velocity_y: 0,
          team: 'red',
          is_online: true,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    return {
      players,
      ball: {
        id: 1,
        x: 400,
        y: 300,
        velocity_x: 0,
        velocity_y: 0,
        updated_at: new Date()
      },
      game_state: {
        id: 1,
        red_score: 2,
        blue_score: 1,
        match_time: 185, // 3:05
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    };
  }, [currentPlayer]);

  // Load game data with fallback to stub data
  const loadGameData = useCallback(async () => {
    if (useStubData) {
      setGameData(createStubGameData());
      return;
    }

    try {
      const data = await trpc.getGameData.query(undefined);
      setGameData(data);
    } catch (error) {
      console.error('Failed to load game data, using stub data:', error);
      setUseStubData(true);
      setGameData(createStubGameData());
    }
  }, [useStubData, createStubGameData]);

  // Initialize game on mount
  useEffect(() => {
    const initGame = async () => {
      try {
        await trpc.initializeGame.mutate(undefined);
        await loadGameData();
      } catch (error) {
        console.error('Failed to initialize game, using stub mode:', error);
        setUseStubData(true);
        setGameData(createStubGameData());
      }
    };
    initGame();
  }, [loadGameData, createStubGameData]);

  // Real-time game loop
  useEffect(() => {
    if (!gameStarted || !currentPlayer) return;

    let lastTime = 0;
    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Handle player movement
      if (keysPressed.current.size > 0) {
        let directionX = 0;
        let directionY = 0;

        if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a')) directionX -= 1;
        if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d')) directionX += 1;
        if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w')) directionY -= 1;
        if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s')) directionY += 1;

        // Normalize diagonal movement
        if (directionX !== 0 && directionY !== 0) {
          directionX *= 0.707; // 1/sqrt(2)
          directionY *= 0.707;
        }

        if (directionX !== 0 || directionY !== 0) {
          const newVelocityX = directionX * PLAYER_SPEED;
          const newVelocityY = directionY * PLAYER_SPEED;
          const newX = Math.max(PLAYER_RADIUS, Math.min(FIELD_WIDTH - PLAYER_RADIUS, currentPlayer.x + newVelocityX * deltaTime));
          const newY = Math.max(PLAYER_RADIUS, Math.min(FIELD_HEIGHT - PLAYER_RADIUS, currentPlayer.y + newVelocityY * deltaTime));

          // Update player position (only try backend if not using stub data)
          if (!useStubData) {
            const updateData: UpdatePlayerPositionInput = {
              player_id: currentPlayer.id,
              x: newX,
              y: newY,
              velocity_x: newVelocityX,
              velocity_y: newVelocityY
            };
            trpc.updatePlayerPosition.mutate(updateData).catch(() => {
              console.log('Backend unavailable, continuing with local movement');
            });
          }

          // Update local state immediately for smooth movement
          setCurrentPlayer((prev: Player | null) => prev ? { ...prev, x: newX, y: newY, velocity_x: newVelocityX, velocity_y: newVelocityY } : null);
          
          // Update game data if using stub mode
          if (useStubData) {
            setGameData((prev: GameData | null) => {
              if (!prev) return prev;
              return {
                ...prev,
                players: prev.players.map((p: Player) => 
                  p.id === currentPlayer.id ? { ...p, x: newX, y: newY, velocity_x: newVelocityX, velocity_y: newVelocityY } : p
                )
              };
            });
          }
        }
      }

      // Reload game data periodically (only if not using stub data)
      if (!useStubData && Math.floor(currentTime / 100) % 5 === 0) { // Every 500ms
        loadGameData();
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameStarted, currentPlayer, loadGameData, useStubData]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
        keysPressed.current.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#22c55e'; // Green field
    ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

    // Draw field markings
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    
    // Center line
    ctx.beginPath();
    ctx.moveTo(FIELD_WIDTH / 2, 0);
    ctx.lineTo(FIELD_WIDTH / 2, FIELD_HEIGHT);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, 80, 0, 2 * Math.PI);
    ctx.stroke();

    // Goals
    const goalWidth = 120;
    const goalHeight = (FIELD_HEIGHT - goalWidth) / 2;
    
    // Left goal (red)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, goalHeight, 20, goalWidth);
    
    // Right goal (blue)
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(FIELD_WIDTH - 20, goalHeight, 20, goalWidth);

    // Draw players
    gameData.players.forEach((player: Player) => {
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = player.team === 'red' ? '#ef4444' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = player.id === currentPlayer?.id ? '#fbbf24' : '#ffffff';
      ctx.lineWidth = player.id === currentPlayer?.id ? 3 : 2;
      ctx.stroke();

      // Player name
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, player.x, player.y - PLAYER_RADIUS - 5);
    });

    // Draw ball
    ctx.beginPath();
    ctx.arc(gameData.ball.x, gameData.ball.y, BALL_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [gameData, currentPlayer]);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinForm.player_name.trim()) return;

    setIsLoading(true);
    try {
      if (!useStubData) {
        const player = await trpc.joinGame.mutate(joinForm);
        setCurrentPlayer(player);
      } else {
        // Create stub player
        const spawnX = joinForm.team === 'red' ? 100 : 700;
        const spawnY = 300;
        const stubPlayer: Player = {
          id: `player-${Date.now()}`,
          name: joinForm.player_name,
          x: spawnX,
          y: spawnY,
          velocity_x: 0,
          velocity_y: 0,
          team: joinForm.team,
          is_online: true,
          created_at: new Date(),
          updated_at: new Date()
        };
        setCurrentPlayer(stubPlayer);
      }
      
      setGameStarted(true);
      await loadGameData();
    } catch (error) {
      console.error('Failed to join game, using stub mode:', error);
      setUseStubData(true);
      
      // Create stub player
      const spawnX = joinForm.team === 'red' ? 100 : 700;
      const spawnY = 300;
      const stubPlayer: Player = {
        id: `player-${Date.now()}`,
        name: joinForm.player_name,
        x: spawnX,
        y: spawnY,
        velocity_x: 0,
        velocity_y: 0,
        team: joinForm.team,
        is_online: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      setCurrentPlayer(stubPlayer);
      setGameStarted(true);
      setGameData(createStubGameData());
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGame = async () => {
    if (!currentPlayer) return;

    try {
      if (!useStubData) {
        await trpc.leaveGame.mutate(currentPlayer.id);
      }
      setCurrentPlayer(null);
      setGameStarted(false);
      keysPressed.current.clear();
    } catch (error) {
      console.error('Failed to leave game:', error);
      // Still allow leaving in stub mode
      setCurrentPlayer(null);
      setGameStarted(false);
      keysPressed.current.clear();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 bg-white/90 backdrop-blur-sm shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">⚽ Haxball Arena</h1>
            <p className="text-gray-600">Join the ultimate online soccer experience!</p>
            {useStubData && (
              <div className="mt-2 p-2 bg-yellow-100 rounded-md">
                <p className="text-xs text-yellow-800">🔧 Demo Mode - Backend unavailable</p>
              </div>
            )}
          </div>

          <form onSubmit={handleJoinGame} className="space-y-4">
            <div>
              <Input
                placeholder="Enter your player name"
                value={joinForm.player_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setJoinForm((prev: JoinGameInput) => ({ ...prev, player_name: e.target.value }))
                }
                maxLength={20}
                required
                className="text-center font-medium"
              />
            </div>

            <div>
              <Select
                value={joinForm.team}
                onValueChange={(value: 'red' | 'blue') =>
                  setJoinForm((prev: JoinGameInput) => ({ ...prev, team: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">🔴 Red Team</SelectItem>
                  <SelectItem value="blue">🔵 Blue Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !joinForm.player_name.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isLoading ? 'Joining Game...' : '🚀 Join Game'}
            </Button>
          </form>

          {gameData && (
            <div className="mt-6 text-center space-y-2">
              <div className="flex justify-center gap-4">
                <Badge variant="destructive" className="text-sm">
                  🔴 Red: {gameData.game_state.red_score}
                </Badge>
                <Badge className="text-sm bg-blue-500">
                  🔵 Blue: {gameData.game_state.blue_score}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                👥 {gameData.players.length} player{gameData.players.length !== 1 ? 's' : ''} online
              </p>
              <p className="text-sm text-gray-600">
                ⏱️ Match time: {formatTime(gameData.game_state.match_time)}
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-green-500 to-green-600 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">⚽ Haxball Arena</h1>
            {currentPlayer && (
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                Playing as: {currentPlayer.name}
              </Badge>
            )}
            {useStubData && (
              <Badge variant="outline" className="bg-yellow-400/20 text-yellow-100 border-yellow-300/30">
                🔧 Demo Mode
              </Badge>
            )}
          </div>
          <Button 
            onClick={handleLeaveGame}
            variant="destructive"
            className="bg-red-500 hover:bg-red-600"
          >
            🚪 Leave Game
          </Button>
        </div>

        {/* Game Stats */}
        {gameData && (
          <Card className="mb-4 p-4 bg-white/90 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <div className="flex gap-6">
                <div className="text-center">
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    🔴 {gameData.game_state.red_score}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Red Team</p>
                </div>
                <div className="text-center">
                  <Badge className="text-lg px-4 py-2 bg-blue-500">
                    🔵 {gameData.game_state.blue_score}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Blue Team</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-800">
                  ⏱️ {formatTime(gameData.game_state.match_time)}
                </div>
                <p className="text-sm text-gray-600">Match Time</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-800">
                  👥 {gameData.players.length}
                </div>
                <p className="text-sm text-gray-600">Players Online</p>
              </div>
            </div>
          </Card>
        )}

        {/* Game Canvas */}
        <div className="flex justify-center">
          <Card className="p-4 bg-white/95 backdrop-blur-sm shadow-2xl">
            <canvas
              ref={canvasRef}
              width={FIELD_WIDTH}
              height={FIELD_HEIGHT}
              className="border-2 border-gray-300 rounded-lg"
            />
          </Card>
        </div>

        {/* Controls */}
        <Card className="mt-4 p-4 bg-white/90 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-2">🎮 Controls</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <Badge variant="outline" className="mb-1">↑ W</Badge>
              <p className="text-gray-600">Move Up</p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-1">↓ S</Badge>
              <p className="text-gray-600">Move Down</p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-1">← A</Badge>
              <p className="text-gray-600">Move Left</p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-1">→ D</Badge>
              <p className="text-gray-600">Move Right</p>
            </div>
          </div>
          {useStubData && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              💡 Your movement is fully functional in demo mode - try the controls above!
            </p>
          )}
        </Card>

        {/* Player List */}
        {gameData && gameData.players.length > 0 && (
          <Card className="mt-4 p-4 bg-white/90 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-3">👥 Players Online</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {gameData.players.map((player: Player) => (
                <div 
                  key={player.id} 
                  className={`flex items-center gap-2 p-2 rounded ${
                    player.id === currentPlayer?.id ? 'bg-yellow-100' : 'bg-gray-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${
                    player.team === 'red' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <span className="font-medium">{player.name}</span>
                  {player.id === currentPlayer?.id && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                  <div className="ml-auto text-xs text-gray-500">
                    {player.is_online ? '🟢 Online' : '🔴 Offline'}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
