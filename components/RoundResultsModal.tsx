import React from 'react';
import { COLORS } from '@/lib/colors';

interface RoundResult {
  playerName: string;
  guessIndex: number;
  distance: number;
  points: number;
  autoGuess?: boolean;
}

interface RoundResultsModalProps {
  isOpen: boolean;
  targetIndex: number;
  targetColor: string;
  results: RoundResult[];
  scoreboard: { name: string; score: number }[];
  phase: number;
  round: number;
  onNext: () => void;
  isHost: boolean;
}

const RoundResultsModal: React.FC<RoundResultsModalProps> = ({
  isOpen,
  targetIndex,
  targetColor,
  results,
  scoreboard,
  phase,
  round,
  onNext,
  isHost,
}) => {
  if (!isOpen) return null;

  const sortedResults = [...results].sort((a, b) => b.points - a.points);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Round {round} - Phase {phase} Results
          </h2>

          {/* Target Color */}
          <div className="mb-6 text-center">
            <p className="text-gray-300 mb-2">Target Color:</p>
            <div className="inline-block">
              <div
                className="w-32 h-32 rounded-lg shadow-lg border-4 border-yellow-400 mx-auto"
                style={{ backgroundColor: targetColor }}
              />
              <p className="text-sm text-gray-400 mt-2">{targetColor}</p>
            </div>
          </div>

          {/* Results Table */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-3">Guesses:</h3>
            <div className="space-y-2">
              {sortedResults.map((result, idx) => (
                <div
                  key={idx}
                  className="bg-gray-700 p-4 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl font-bold text-gray-400">
                      #{idx + 1}
                    </div>
                    <div
                      className="w-12 h-12 rounded border-2 border-white"
                      style={{ backgroundColor: COLORS[result.guessIndex] }}
                    />
                    <div>
                      <p className="text-white font-bold">{result.playerName}</p>
                      <p className="text-sm text-gray-400">
                        Distance: {result.distance}
                        {result.autoGuess && ' (auto)'}
                      </p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">
                    +{result.points}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-3">Scoreboard:</h3>
            <div className="bg-gray-700 rounded-lg p-4">
              {scoreboard
                .sort((a, b) => b.score - a.score)
                .map((player, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-2 border-b border-gray-600 last:border-0"
                  >
                    <span className="text-white font-medium">
                      {idx + 1}. {player.name}
                    </span>
                    <span className="text-yellow-400 font-bold text-lg">
                      {player.score}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Next Button */}
          {isHost && (
            <button
              onClick={onNext}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-bold text-lg transition-colors"
            >
              Continue to Next Round
            </button>
          )}
          {!isHost && (
            <p className="text-center text-gray-400">
              Waiting for host to continue...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoundResultsModal;
