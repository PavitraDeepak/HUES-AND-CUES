import React, { useState } from 'react';
import ColorGrid from './ColorGrid';

interface GameBoardProps {
  cardColors: string[];
  currentPhase: number;
  currentRound: number;
  roundsTotal: number;
  clue?: string;
  clueGiver: string;
  isClueGiver: boolean;
  onSubmitClue: (clue: string) => void;
  onPlaceGuess: (index: number) => void;
  guessDeadline?: number;
  hasGuessed: boolean;
  myGuessIndex?: number;
}

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
}) => {
  const [clueInput, setClueInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(myGuessIndex ?? null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  React.useEffect(() => {
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

  const handleClueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const words = clueInput.trim().split(/\s+/);
    if (words.length === currentPhase) {
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

  const expectedWords = currentPhase === 1 ? 'one word' : 'two words';
  const wordCount = clueInput.trim().split(/\s+/).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">
            Round {currentRound} of {roundsTotal}
          </h2>
          <div className="text-xl font-bold text-yellow-400">
            Phase {currentPhase} ({currentPhase === 1 ? '1 word' : '2 words'})
          </div>
        </div>

        {/* Card Colors */}
        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-2">Card Colors:</p>
          <div className="flex gap-2">
            {cardColors.map((color, idx) => (
              <div
                key={idx}
                className="w-16 h-16 rounded-lg shadow-lg border-2 border-white"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Clue Giver Section */}
        {isClueGiver && !clue && (
          <form onSubmit={handleClueSubmit} className="space-y-3">
            <div>
              <label className="text-white font-medium mb-2 block">
                Give a clue ({expectedWords}):
              </label>
              <input
                type="text"
                value={clueInput}
                onChange={(e) => setClueInput(e.target.value)}
                placeholder={`Enter ${expectedWords}...`}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-lg"
                autoFocus
              />
              <div className="text-sm mt-1">
                <span
                  className={`${
                    wordCount === currentPhase
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {wordCount === 0 ? 'No words yet' : `${wordCount} word${wordCount > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={wordCount !== currentPhase}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold text-lg transition-colors"
            >
              Submit Clue
            </button>
          </form>
        )}

        {/* Display Clue */}
        {clue && (
          <div className="bg-yellow-600 p-4 rounded-lg">
            <p className="text-sm text-yellow-100 mb-1">
              Clue from {clueGiver}:
            </p>
            <p className="text-3xl font-bold text-white text-center">"{clue}"</p>
          </div>
        )}

        {/* Timer */}
        {timeLeft !== null && timeLeft > 0 && (
          <div className="mt-4">
            <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-yellow-500 h-full transition-all duration-100"
                style={{ width: `${(timeLeft / 60000) * 100}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-300 mt-1">
              {Math.ceil(timeLeft / 1000)}s remaining
            </p>
          </div>
        )}
      </div>

      {/* Color Grid */}
      {clue && !isClueGiver && (
        <div className="text-center">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-2">
              {hasGuessed ? 'Your guess:' : 'Select your guess:'}
            </h3>
            {!hasGuessed && (
              <p className="text-gray-400">Click a color on the grid below</p>
            )}
          </div>

          <div className="flex justify-center mb-4">
            <ColorGrid
              onColorClick={handleColorClick}
              highlightedIndex={selectedIndex}
              disabled={hasGuessed}
            />
          </div>

          {!hasGuessed && selectedIndex !== null && (
            <button
              onClick={handleGuessSubmit}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors shadow-lg"
            >
              Confirm Guess
            </button>
          )}

          {hasGuessed && (
            <p className="text-green-400 font-bold text-lg">
              ✓ Guess submitted! Waiting for other players...
            </p>
          )}
        </div>
      )}

      {clue && isClueGiver && (
        <div className="text-center text-gray-300 text-lg">
          Waiting for players to guess...
        </div>
      )}
    </div>
  );
};

export default GameBoard;
