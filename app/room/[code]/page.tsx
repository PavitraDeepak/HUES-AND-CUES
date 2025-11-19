'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/useSocket';
import GameBoard from '@/components/GameBoard';
import RoundResultsModal from '@/components/RoundResultsModal';
import GameOverModal from '@/components/GameOverModal';

interface Player {
  id: string;
  name: string;
  ready: boolean;
  score: number;
}

interface RoomState {
  code: string;
  hostId: string;
  players: Player[];
  settings: {
    maxPlayers: number;
    rounds: number;
    isPrivate: boolean;
  };
  hasActiveGame: boolean;
}

interface GameState {
  currentRound: number;
  roundsTotal: number;
  currentPhase: number;
  cardColors: string[];
  clue?: string;
  guessDeadline?: number;
}

interface ChatMessage {
  type: 'player' | 'system';
  playerName?: string;
  message: string;
  timestamp: Date;
}

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { socket, isConnected } = useSocket();

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [clueGiverName, setClueGiverName] = useState<string>('');
  const [hasGuessed, setHasGuessed] = useState(false);
  const [myGuessIndex, setMyGuessIndex] = useState<number | undefined>();
  const [targetColor, setTargetColor] = useState<string | undefined>();
  const [targetIndex, setTargetIndex] = useState<number | undefined>();
  
  // Round results modal
  const [showResults, setShowResults] = useState(false);
  const [roundResults, setRoundResults] = useState<any>(null);
  
  // Game over modal
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverData, setGameOverData] = useState<any>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Join room on mount
  useEffect(() => {
    if (!socket || !isConnected || !userId) return;

    // Check if user just created this room (skip join as they're already in)
    const justCreated = localStorage.getItem('justCreated');
    if (justCreated === 'true') {
      localStorage.removeItem('justCreated');
      
      // Just request the room state since we're already in the room
      socket.emit('get_room_state', { code }, (response: any) => {
        if (response.success) {
          setRoomState(response.roomState);
          if (response.gameState) {
            setGameState(response.gameState);
            setClueGiverName(response.clueGiver);
          }
        } else {
          console.error('Failed to get room state:', response.error);
          alert(response.error);
          router.push('/');
        }
      });
      return;
    }

    const name = localStorage.getItem('playerName') || 'Player';
    
    // Small delay to ensure socket is fully ready
    const timer = setTimeout(() => {
      socket.emit('join_room', { code, name, userId }, (response: any) => {
        if (!response.success) {
          console.error('Failed to join room:', response.error);
          alert(response.error);
          router.push('/');
        }
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      // Don't leave room on unmount, only on explicit leave
    };
  }, [socket, isConnected, code, userId, router]);

  useEffect(() => {
    if (!socket) return;

    // Room state updates
    socket.on('room_state', (state: RoomState) => {
      setRoomState(state);
    });

    // Chat messages
    socket.on('chat_message', (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    });

    // Game started
    socket.on('game_started', (data: { gameState: GameState; clueGiver: string }) => {
      setGameState(data.gameState);
      setClueGiverName(data.clueGiver);
      setHasGuessed(false);
      setMyGuessIndex(undefined);
      setTargetColor(undefined);
      setTargetIndex(undefined);
      setShowResults(false);
    });

    // Target revealed (only for clue giver)
    socket.on('target_revealed', (data: { targetIndex: number; targetColor: string }) => {
      setTargetIndex(data.targetIndex);
      setTargetColor(data.targetColor);
    });

    // Clue given
    socket.on('clue_given', (data: { clue: string; phase: number; clueGiver: string; deadline: number }) => {
      setGameState((prev) =>
        prev ? { ...prev, clue: data.clue, guessDeadline: data.deadline } : null
      );
      setClueGiverName(data.clueGiver);
    });

    // Guess placed
    socket.on('guess_placed', (data: { playerName: string; totalGuesses: number; expectedGuesses: number }) => {
      // Optional: show notification
    });

    // Round results
    socket.on('round_results', (data: any) => {
      setRoundResults(data);
      setShowResults(true);
      setHasGuessed(false);
      setMyGuessIndex(undefined);
    });

    // Phase changed
    socket.on('phase_changed', (data: { round: number; phase: number; clueGiver: string; clueGiverId: string }) => {
      setGameState((prev) =>
        prev ? { ...prev, currentPhase: data.phase, clue: undefined, guessDeadline: undefined } : null
      );
      setClueGiverName(data.clueGiver);
      setHasGuessed(false);
      setMyGuessIndex(undefined);
      
      // Only clear target if I am NOT the clue giver
      if (data.clueGiverId !== userId) {
        setTargetColor(undefined);
        setTargetIndex(undefined);
      }

      setShowResults(false);
    });

    // New round
    socket.on('new_round', (data: { round: number; cardColors: string[]; clueGiver: string }) => {
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              currentRound: data.round,
              currentPhase: 1,
              cardColors: data.cardColors,
              clue: undefined,
              guessDeadline: undefined,
            }
          : null
      );
      setClueGiverName(data.clueGiver);
      setHasGuessed(false);
      setMyGuessIndex(undefined);
      setTargetColor(undefined);
      setTargetIndex(undefined);
      setShowResults(false);
    });

    // Game over
    socket.on('game_over', (data: any) => {
      setGameOverData(data);
      setShowGameOver(true);
      setGameState(null);
    });

    return () => {
      socket.off('room_state');
      socket.off('chat_message');
      socket.off('game_started');
      socket.off('target_revealed');
      socket.off('clue_given');
      socket.off('guess_placed');
      socket.off('round_results');
      socket.off('phase_changed');
      socket.off('new_round');
      socket.off('game_over');
    };
  }, [socket]);

  const currentPlayer = roomState?.players.find((p) => p.id === socket?.id);
  const isHost = roomState?.hostId === socket?.id;
  const isClueGiver = currentPlayer?.name === clueGiverName;

  const handleReady = () => {
    if (!socket || !roomState) return;
    socket.emit('player_ready', { code: roomState.code, ready: !currentPlayer?.ready }, (response: any) => {
      if (!response.success) {
        alert(response.error);
      }
    });
  };

  const handleStartGame = () => {
    if (!socket || !roomState) return;
    socket.emit('start_game', { code: roomState.code }, (response: any) => {
      if (!response.success) {
        alert(response.error);
      }
    });
  };

  const handleSubmitClue = (clue: string) => {
    if (!socket || !roomState) return;
    socket.emit('send_clue', { code: roomState.code, clue }, (response: any) => {
      if (!response.success) {
        alert(response.error);
      }
    });
  };

  const handleSelectTarget = (targetIndex: number) => {
    if (!socket || !roomState) return;
    socket.emit('select_target_color', { code: roomState.code, targetIndex }, (response: any) => {
      if (!response.success) {
        alert(response.error);
      }
    });
  };

  const handlePlaceGuess = (guessIndex: number) => {
    if (!socket || !roomState) return;
    socket.emit('place_guess', { code: roomState.code, guessIndex }, (response: any) => {
      if (response.success) {
        setHasGuessed(true);
        setMyGuessIndex(guessIndex);
      } else {
        alert(response.error);
      }
    });
  };

  const handleSendMessage = (message: string) => {
    if (!socket || !roomState) return;
    socket.emit('chat_message', { code: roomState.code, message }, (response: any) => {
      if (!response.success) {
        console.error('Failed to send message:', response.error);
      }
    });
  };

  const handleNextRound = () => {
    if (!socket || !roomState) return;
    socket.emit('next_round', { code: roomState.code }, (response: any) => {
      if (response.success) {
        setShowResults(false);
      } else {
        alert(response.error);
      }
    });
  };

  const handleLeaveRoom = () => {
    if (!socket || !roomState) return;
    socket.emit('leave_room', { code: roomState.code }, (response: any) => {
      router.push('/');
    });
  };

  const handleBackToLobby = () => {
    setShowGameOver(false);
    setGameState(null);
  };

  // Helper functions
  const getAvatarColor = (name: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B4D0', '#ABEBC6'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isConnected || !roomState) {
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#00d9ff] mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading room...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (roomState.hasActiveGame && gameState) {
      return (
        <GameBoard
          cardColors={gameState.cardColors}
          currentPhase={gameState.currentPhase}
          currentRound={gameState.currentRound}
          roundsTotal={gameState.roundsTotal}
          clue={gameState.clue}
          clueGiver={clueGiverName}
          isClueGiver={isClueGiver}
          onSubmitClue={handleSubmitClue}
          onSelectTarget={handleSelectTarget}
          onPlaceGuess={handlePlaceGuess}
          guessDeadline={gameState.guessDeadline}
          hasGuessed={hasGuessed}
          myGuessIndex={myGuessIndex}
          targetColor={targetColor}
          targetIndex={targetIndex}
          players={roomState.players}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          clueGiverId={roomState.players.find((p) => p.name === clueGiverName)?.id}
        />
      );
    }

    // Waiting Room Layout
    return (
      <div className="min-h-screen bg-[#1e1e1e] flex">
        {/* LEFT PANEL (50%) - Settings */}
        <div className="w-1/2 p-12 border-r border-[#333] flex flex-col justify-center relative">
          <button 
            onClick={handleLeaveRoom}
            className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            ← Leave Room
          </button>

          <div className="max-w-md mx-auto w-full">
            <div className="mb-12">
              <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Waiting Room</h1>
              <p className="text-gray-400 text-lg">Invite your friends to join</p>
            </div>

            {/* Room Code */}
            <div className="mb-12 bg-[#2a2a2a] rounded-2xl p-6 border border-[#333]">
              <h2 className="text-sm text-gray-400 mb-3 uppercase tracking-wider font-semibold">Room Code</h2>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-[#00d9ff] font-mono tracking-widest flex-1">
                  {roomState.code}
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="btn-secondary px-6 py-3 hover:bg-[#00d9ff]/10 hover:text-[#00d9ff] hover:border-[#00d9ff]/50"
                >
                  📋 Copy Link
                </button>
              </div>
            </div>

            {/* Game Settings */}
            <div className="space-y-6 opacity-75 hover:opacity-100 transition-opacity">
              <div className="flex justify-between items-center">
                <label className="text-white font-medium">Rounds per player</label>
                <div className="text-[#00d9ff] font-bold text-xl">{roomState.settings.rounds}</div>
              </div>
              <div className="flex justify-between items-center">
                <label className="text-white font-medium">Max Players</label>
                <div className="text-[#00d9ff] font-bold text-xl">{roomState.settings.maxPlayers}</div>
              </div>
              {isHost && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  * Settings can be adjusted in the next update
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (50%) - Player Roster */}
        <div className="w-1/2 p-12 bg-[#1a1a1a] flex flex-col">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-bold text-white">
              Players <span className="text-[#00d9ff]">({roomState.players.length}/{roomState.settings.maxPlayers})</span>
            </h2>
            <div className="flex gap-2">
               {/* Ready Status Indicator */}
               <div className="flex items-center gap-2 text-sm text-gray-400">
                 <div className="w-2 h-2 rounded-full bg-[#10b981]"></div> Ready
                 <div className="w-2 h-2 rounded-full bg-gray-600 ml-2"></div> Not Ready
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 overflow-y-auto flex-1 content-start custom-scrollbar pr-2">
            {roomState.players.map(player => (
              <div 
                key={player.id}
                className={`p-4 rounded-xl flex items-center justify-between transition-all ${
                  player.ready 
                    ? 'bg-[#10b981]/10 border border-[#10b981]/30' 
                    : 'bg-[#2a2a2a] border border-[#333]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                    style={{ backgroundColor: getAvatarColor(player.name) }}
                  >
                    {getInitials(player.name)}
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">{player.name}</div>
                    {player.id === roomState.hostId && (
                      <div className="text-xs text-[#00d9ff] font-semibold tracking-wider">HOST</div>
                    )}
                  </div>
                </div>
                
                {player.ready && (
                  <div className="text-[#10b981] font-bold flex items-center gap-2">
                    <span>READY</span>
                    <div className="w-3 h-3 rounded-full bg-[#10b981] animate-pulse"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            <button
              onClick={handleReady}
              className={`w-full py-4 rounded-xl font-bold text-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                currentPlayer?.ready
                  ? 'bg-transparent border-2 border-gray-600 text-gray-400 hover:border-gray-500 hover:text-white'
                  : 'btn-primary shadow-[0_0_30px_rgba(0,217,255,0.2)]'
              }`}
            >
              {currentPlayer?.ready ? 'Cancel Ready' : '👋 I\'m Ready!'}
            </button>

            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!roomState.players.every(p => p.ready) || roomState.players.length < 2}
                className="w-full py-4 bg-[#10b981] hover:bg-[#059669] disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                🚀 Start Game
              </button>
            )}
            
            {isHost && !roomState.players.every(p => p.ready) && roomState.players.length >= 2 && (
              <p className="text-center text-gray-500 text-sm">
                Waiting for all players to be ready...
              </p>
            )}
             {isHost && roomState.players.length < 2 && (
              <p className="text-center text-gray-500 text-sm">
                Need at least 2 players to start...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}

      {/* Modals */}
      {roundResults && (
        <RoundResultsModal
          isOpen={showResults}
          targetIndex={roundResults.targetIndex}
          targetColor={roundResults.targetColor}
          results={roundResults.results}
          scoreboard={roundResults.scoreboard}
          phase={roundResults.phase}
          round={roundResults.round}
          onNext={handleNextRound}
          isHost={isHost}
        />
      )}

      {gameOverData && (
        <GameOverModal
          isOpen={showGameOver}
          winner={gameOverData.winner}
          finalScores={gameOverData.finalScores}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </>
  );
}
