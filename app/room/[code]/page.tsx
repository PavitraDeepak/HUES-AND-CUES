'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/useSocket';
import PlayerList from '@/components/PlayerList';
import Chat from '@/components/Chat';
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
      setShowResults(false);
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
    socket.on('phase_changed', (data: { round: number; phase: number; clueGiver: string }) => {
      setGameState((prev) =>
        prev ? { ...prev, currentPhase: data.phase, clue: undefined, guessDeadline: undefined } : null
      );
      setClueGiverName(data.clueGiver);
      setHasGuessed(false);
      setMyGuessIndex(undefined);
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
    socket.emit('leave_room', { code: roomState.code });
    router.push('/');
  };

  const handleBackToLobby = () => {
    setShowGameOver(false);
    setGameState(null);
  };

  if (!isConnected || !roomState) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Room: <span className="text-yellow-400 font-mono">{roomState.code}</span>
            </h1>
            <p className="text-gray-400">
              {roomState.settings.rounds} rounds • Max {roomState.settings.maxPlayers} players
            </p>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Leave Room
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Left Column - Players & Chat */}
          <div className="space-y-4">
            <PlayerList
              players={roomState.players}
              hostId={roomState.hostId}
              currentUserId={socket?.id}
              isGameActive={roomState.hasActiveGame}
              clueGiverId={roomState.players.find((p) => p.name === clueGiverName)?.id}
            />

            {!roomState.hasActiveGame && (
              <div className="bg-gray-800 rounded-lg p-4 shadow-lg space-y-3">
                <button
                  onClick={handleReady}
                  className={`w-full px-6 py-3 rounded-lg font-bold transition-colors ${
                    currentPlayer?.ready
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {currentPlayer?.ready ? 'Unready' : 'Ready'}
                </button>

                {isHost && (
                  <button
                    onClick={handleStartGame}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold transition-colors"
                  >
                    Start Game
                  </button>
                )}

                {!isHost && (
                  <p className="text-center text-gray-400 text-sm">
                    Waiting for host to start...
                  </p>
                )}
              </div>
            )}

            <Chat messages={chatMessages} onSendMessage={handleSendMessage} />
          </div>

          {/* Right Column - Game Board */}
          <div className="lg:col-span-2">
            {!roomState.hasActiveGame && !gameState && (
              <div className="bg-gray-800 rounded-lg p-12 shadow-lg text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Waiting for game to start...
                </h2>
                <p className="text-gray-400 text-lg mb-6">
                  {roomState.players.filter((p) => p.ready || p.id === roomState.hostId).length} /{' '}
                  {roomState.players.length} players ready
                </p>
                <div className="text-left max-w-md mx-auto space-y-2 text-gray-300">
                  <p>📝 Each round has 2 phases:</p>
                  <p className="ml-4">• Phase 1: One-word clue</p>
                  <p className="ml-4">• Phase 2: Two-word clue</p>
                  <p className="mt-4">🎯 Goal: Guess the color closest to the target!</p>
                </div>
              </div>
            )}

            {gameState && (
              <GameBoard
                cardColors={gameState.cardColors}
                currentPhase={gameState.currentPhase}
                currentRound={gameState.currentRound}
                roundsTotal={gameState.roundsTotal}
                clue={gameState.clue}
                clueGiver={clueGiverName}
                isClueGiver={isClueGiver}
                onSubmitClue={handleSubmitClue}
                onPlaceGuess={handlePlaceGuess}
                guessDeadline={gameState.guessDeadline}
                hasGuessed={hasGuessed}
                myGuessIndex={myGuessIndex}
              />
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}
