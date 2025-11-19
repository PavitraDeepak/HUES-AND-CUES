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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[#2a2a2a] border border-[#333] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8">
          <h2 className="text-4xl font-bold text-white mb-8 text-center tracking-tight">
            Round {round} <span className="text-[#00d9ff]">•</span> Phase {phase}
          </h2>

          {/* Target Color */}
          <div className="mb-10 text-center">
            <p className="text-gray-400 mb-3 text-sm uppercase tracking-widest font-bold">TARGET COLOR</p>
            <div className="inline-block relative group">
              <div
                className="w-32 h-32 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border-4 border-white mx-auto transition-transform transform group-hover:scale-105"
                style={{ backgroundColor: targetColor }}
              />
              <div className="absolute -top-3 -right-3 bg-[#00d9ff] text-black font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                🎯
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📊</span> Round Results
            </h3>
            <div className="space-y-3">
              {sortedResults.map((result, idx) => (
                <div
                  key={idx}
                  className="bg-[#1e1e1e] p-4 rounded-xl flex items-center justify-between border border-[#333] hover:border-[#00d9ff]/30 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl font-bold text-gray-500 w-8">
                      #{idx + 1}
                    </div>
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-white/20 shadow-sm"
                      style={{ backgroundColor: COLORS[result.guessIndex] }}
                    />
                    <div>
                      <p className="text-white font-bold text-lg">{result.playerName}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        Distance: {result.distance}
                        {result.autoGuess && ' (auto)'}
                      </p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-[#00d9ff] drop-shadow-[0_0_10px_rgba(0,217,255,0.3)]">
                    +{result.points}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🏆</span> Leaderboard
            </h3>
            <div className="bg-[#1e1e1e] rounded-xl p-4 border border-[#333]">
              {scoreboard
                .sort((a, b) => b.score - a.score)
                .map((player, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-3 border-b border-[#333] last:border-0"
                  >
                    <span className="text-white font-medium flex items-center gap-3">
                      <span className={`text-sm font-bold w-6 ${idx < 3 ? 'text-yellow-400' : 'text-gray-600'}`}>
                        {idx + 1}.
                      </span>
                      {player.name}
                    </span>
                    <span className="text-white font-bold text-lg">
                      {player.score} <span className="text-xs text-gray-500 font-normal">pts</span>
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Next Button */}
          {isHost && (
            <button
              onClick={onNext}
              className="btn-primary w-full py-4 text-xl shadow-lg"
            >
              Continue to Next Round →
            </button>
          )}
          {!isHost && (
            <div className="text-center p-4 bg-[#1e1e1e] rounded-xl border border-[#333] text-gray-400 animate-pulse">
              Waiting for host to continue...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoundResultsModal;
