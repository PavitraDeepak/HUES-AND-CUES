import React, { useState, useEffect, useRef } from 'react';
import ColorGrid from './ColorGrid';

interface Player {
  id: string;
  name: string;
  ready: boolean;
  score: number;
}

interface ChatMessage {
  type: 'player' | 'system';
  playerName?: string;
  message: string;
  timestamp: Date;
}

interface GameBoardProps {
  cardColors: string[];
  currentPhase: number;
  currentRound: number;
  roundsTotal: number;
  clue?: string;
  clueGiver: string;
  isClueGiver: boolean;
  onSubmitClue: (clue: string) => void;
  onSelectTarget?: (index: number) => void;
  onPlaceGuess: (index: number) => void;
  guessDeadline?: number;
  hasGuessed: boolean;
  myGuessIndex?: number;
  targetColor?: string;
  targetIndex?: number;
  players: Player[];
  chatMessages: ChatMessage[];
  onSendMessage: (message: string) => void;
  clueGiverId?: string;
}

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

const GameBoard: React.FC<GameBoardProps> = ({
  cardColors,
  currentPhase,
  currentRound,
  roundsTotal,
  clue,
  clueGiver,
  isClueGiver,
  onSubmitClue,
  onPlaceGuess,
  guessDeadline,
  hasGuessed,
  myGuessIndex,
  targetColor,
  targetIndex,
  players,
  chatMessages,
  onSendMessage,
  clueGiverId,
}) => {
  const [clueInput, setClueInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(myGuessIndex ?? null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [scoreDiffs, setScoreDiffs] = useState<{ [key: string]: number }>({});
  const prevPlayersRef = useRef<Player[]>(players);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Track score changes for animations
  useEffect(() => {
    const diffs: { [key: string]: number } = {};
    let hasChanges = false;

    players.forEach(player => {
      const prevPlayer = prevPlayersRef.current.find(p => p.id === player.id);
      if (prevPlayer && player.score > prevPlayer.score) {
        diffs[player.id] = player.score - prevPlayer.score;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setScoreDiffs(diffs);
      // Clear diffs after animation
      const timer = setTimeout(() => {
        setScoreDiffs({});
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    prevPlayersRef.current = players;
  }, [players]);

  useEffect(() => {
    if (guessDeadline) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, guessDeadline - Date.now());
        setTimeLeft(remaining);
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [guessDeadline]);

  const validateClue = (clue: string): boolean => {
    const forbidden = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey'];
    const words = clue.toLowerCase().split(/\s+/);
    return !words.some(word => forbidden.includes(word));
  };

  const handleClueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const words = clueInput.trim().split(/\s+/);
    if (words.length === currentPhase) {
      if (!validateClue(clueInput)) {
        setShowValidationError(true);
        setTimeout(() => setShowValidationError(false), 500);
        return;
      }
      onSubmitClue(clueInput.trim());
      setClueInput('');
    }
  };

  const handleColorClick = (index: number) => {
    if (!isClueGiver && !hasGuessed) {
      setSelectedIndex(index);
    }
  };

  const handleGuessSubmit = () => {
    if (selectedIndex !== null) {
      onPlaceGuess(selectedIndex);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(chatInput.trim());
      setChatInput('');
    }
  };

  const expectedWords = currentPhase === 1 ? 'one word' : 'two words';
  const wordCount = clueInput.trim().split(/\s+/).length;

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex overflow-hidden">
      {/* LEFT SIDEBAR (15%) - Players & Turn Order */}
      <div className="w-[15%] bg-[#2a2a2a] border-r border-[#333] p-4 flex flex-col overflow-hidden">
        {/* Turn Phase Indicator */}
        <div className="mb-6 glass p-3 rounded-lg text-center shrink-0">
          <div className="text-xs text-gray-400 mb-1">PHASE</div>
          <div className="text-lg font-bold text-white">
            {currentPhase === 1 ? '1-Word Hint' : '2-Word Hint'}
          </div>
          <div className="text-xs text-[#00d9ff] mt-1">Round {currentRound}/{roundsTotal}</div>
        </div>

        {/* Player List (Vertical) */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
          {players.map(player => {
            const isActive = player.id === clueGiverId;
            const scoreDiff = scoreDiffs[player.id];
            
            return (
              <div 
                key={player.id}
                className={`p-3 rounded-lg transition-all relative ${
                  isActive ? 'animate-glow-pulse bg-[#00d9ff]/10 border border-[#00d9ff]/30' : 'bg-[#1e1e1e] border border-transparent'
                }`}
              >
                {scoreDiff > 0 && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce shadow-lg z-20">
                    +{scoreDiff}
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ backgroundColor: getAvatarColor(player.name) }}
                  >
                    {getInitials(player.name)}
                  </div>
                  <span className="text-white text-sm font-medium truncate">
                    {player.name}
                  </span>
                </div>
                <div className="text-xl font-bold text-[#00d9ff]">
                  {player.score} pts
                </div>
                {isActive && (
                  <div className="text-[10px] text-gray-400 mt-1">Current Cuer</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER STAGE (65%) - The Board */}
      <div className="w-[65%] flex flex-col bg-[#1e1e1e] relative">
        {/* Top HUD */}
        <div className="bg-[#2a2a2a] border-b border-[#333] px-6 py-4 shrink-0 z-10">
          {/* Timer Bar */}
          {timeLeft !== null && timeLeft > 0 && (
            <div className="w-full h-1 bg-[#333] rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-[#00d9ff] transition-all duration-100"
                style={{ width: `${(timeLeft / 60000) * 100}%` }}
              />
            </div>
          )}

          {/* Current Clue Display */}
          {clue ? (
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">CURRENT CLUE</div>
              <div className="text-4xl font-bold text-white tracking-wider animate-fade-in">
                "{clue.toUpperCase()}"
              </div>
            </div>
          ) : (
            <div className="text-center h-[60px] flex items-center justify-center">
              <div className="text-gray-500 animate-pulse">
                {isClueGiver ? 'Waiting for your clue...' : `Waiting for ${clueGiver} to give a clue...`}
              </div>
            </div>
          )}
        </div>

        {/* Board Container */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-[#1e1e1e] relative">
          <ColorGrid 
            onColorClick={isClueGiver ? undefined : handleColorClick}
            highlightedIndex={selectedIndex}
            disabled={hasGuessed || isClueGiver}
            targetIndex={isClueGiver ? targetIndex : undefined}
            showTarget={isClueGiver}
          />
        </div>

        {/* Bottom Dock (Context Aware) */}
        <div className="bg-[#2a2a2a] border-t border-[#333] px-8 py-6 shrink-0 z-10">
          {isClueGiver && !clue && (
            // Cuer View: Show card + input
            <div className="max-w-4xl mx-auto flex items-center gap-8 animate-slide-up">
              {/* Target Card Colors */}
              <div className="flex flex-col gap-2 shrink-0">
                <div className="text-xs text-gray-400 text-center uppercase tracking-wider">Select Target</div>
                <div className="flex gap-2">
                  {cardColors.map((color, idx) => {
                    const isSelected = targetColor === color;
                    return (
                      <div
                        key={idx}
                        onClick={() => onSelectTarget && onSelectTarget(idx)}
                        className={`group relative w-12 h-12 rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-[#00d9ff] scale-110 z-10 shadow-[0_0_15px_rgba(0,217,255,0.5)]' 
                            : 'opacity-60 hover:opacity-100 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        title={isSelected ? '🎯 TARGET SELECTED' : 'Click to select as target'}
                      >
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 text-lg animate-bounce">🎯</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleClueSubmit} className="flex-1 flex gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={clueInput}
                    onChange={(e) => setClueInput(e.target.value)}
                    placeholder={!targetColor ? "Select a target color first..." : `Enter ${expectedWords}...`}
                    disabled={!targetColor}
                    className={`input-field w-full ${
                      showValidationError ? 'border-red-500 animate-shake' : ''
                    } ${!targetColor ? 'opacity-50 cursor-not-allowed' : ''}`}
                    autoFocus
                  />
                  {showValidationError && (
                    <div className="absolute -top-10 left-0 bg-red-600 text-white px-3 py-1 rounded text-xs">
                      🚫 No color names allowed!
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={wordCount !== currentPhase || !targetColor}
                  className="btn-primary px-8 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </form>
            </div>
          )}

          {!isClueGiver && clue && (
            // Guesser View: Confirm button
            <div className="max-w-md mx-auto animate-slide-up">
              {!hasGuessed && selectedIndex !== null && (
                <button 
                  onClick={handleGuessSubmit}
                  className="btn-primary w-full py-3 text-lg shadow-[0_0_20px_rgba(0,217,255,0.3)] hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]"
                >
                  ✓ Confirm Placement
                </button>
              )}
              {hasGuessed && (
                <div className="text-center text-[#10b981] text-lg font-semibold flex items-center justify-center gap-2">
                  <span className="animate-bounce">✓</span> Guess submitted!
                </div>
              )}
            </div>
          )}
          
          {/* Empty state spacer if nothing to show */}
          {((isClueGiver && clue) || (!isClueGiver && !clue)) && (
            <div className="h-[60px] flex items-center justify-center text-gray-500 italic">
              {isClueGiver ? 'Players are guessing...' : 'Watch the board...'}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR (20%) - Chat & Logs */}
      <div className="w-[20%] bg-[#2a2a2a] border-l border-[#333] flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-[#333]">
          <button className="flex-1 py-3 text-sm font-medium text-[#00d9ff] border-b-2 border-[#00d9ff] bg-[#1e1e1e]">
            Chat
          </button>
          <button className="flex-1 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Game Log
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`${msg.type === 'system' ? 'chat-bubble-system' : 'chat-bubble'} animate-fade-in`}>
              {msg.type === 'player' && (
                <div className="text-xs text-[#00d9ff] font-semibold mb-1 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getAvatarColor(msg.playerName || '') }}></div>
                  {msg.playerName}
                </div>
              )}
              <div className={`text-sm ${msg.type === 'system' ? 'text-gray-400 italic text-center' : 'text-white'}`}>
                {msg.message}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-[#333] bg-[#2a2a2a]">
          <form onSubmit={handleChatSubmit}>
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="input-field w-full text-sm"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
