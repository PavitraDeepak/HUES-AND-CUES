import React from 'react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#2a2a2a] border border-[#333] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d9ff]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#2a2a2a]/95 backdrop-blur py-2 z-20 border-b border-[#333]">
            <h2 className="text-3xl font-bold text-white tracking-tight">How to Play</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#333] text-gray-400 hover:text-white hover:bg-[#444] transition-all"
            >
              ✕
            </button>
          </div>

          <div className="space-y-8 text-gray-300 pb-4">
            <section>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-2xl bg-[#333] w-10 h-10 flex items-center justify-center rounded-lg">🎯</span> 
                The Objective
              </h3>
              <p className="leading-relaxed pl-[3.25rem]">
                Connect colors with words! As the <strong className="text-[#00d9ff]">Cuer</strong>, guide players to your specific color. 
                As a <strong className="text-[#00d9ff]">Guesser</strong>, place your cones as close to the target as possible.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-2xl bg-[#333] w-10 h-10 flex items-center justify-center rounded-lg">🎮</span> 
                Setup
              </h3>
              <ul className="list-disc list-inside space-y-2 pl-[3.25rem] marker:text-[#00d9ff]">
                <li>The board has 480 distinct color squares</li>
                <li>Each player gets 2 cones (first and second guess)</li>
                <li>Players take turns being the Cuer</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-2xl bg-[#333] w-10 h-10 flex items-center justify-center rounded-lg">🎪</span> 
                Turn Sequence
              </h3>
              
              <div className="space-y-4 pl-[3.25rem]">
                <div className="bg-[#1e1e1e] p-5 rounded-xl border border-[#333] hover:border-[#444] transition-colors">
                  <h4 className="font-bold text-[#00d9ff] mb-3 uppercase tracking-wider text-sm">Phase 1: One-Word Clue</h4>
                  <ol className="list-decimal list-inside space-y-2 marker:text-gray-500">
                    <li>Cuer draws a card with 4 colors and secretly picks one</li>
                    <li>Cuer gives a <strong>one-word</strong> hint (e.g., "Strawberry")</li>
                    <li>All players place their <strong>first cone</strong> on the board</li>
                  </ol>
                </div>

                <div className="bg-[#1e1e1e] p-5 rounded-xl border border-[#333] hover:border-[#444] transition-colors">
                  <h4 className="font-bold text-[#00d9ff] mb-3 uppercase tracking-wider text-sm">Phase 2: Two-Word Clue</h4>
                  <ol className="list-decimal list-inside space-y-2 marker:text-gray-500">
                    <li>Cuer gives a <strong>one or two-word</strong> hint (e.g., "Rotten Fruit")</li>
                    <li>Players place their <strong>second cone</strong> to refine their guess</li>
                    <li>Both cones stay on the board for scoring</li>
                  </ol>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-2xl bg-[#333] w-10 h-10 flex items-center justify-center rounded-lg">🏆</span> 
                Scoring
              </h3>
              <div className="space-y-3 pl-[3.25rem]">
                <div className="flex items-center gap-4 bg-[#1e1e1e] p-3 rounded-lg border border-[#333]">
                  <div className="w-12 h-12 bg-[#00d9ff] rounded-lg flex items-center justify-center font-bold text-xl text-black shadow-[0_0_10px_rgba(0,217,255,0.3)]">3</div>
                  <div>
                    <strong className="text-white block">Bullseye</strong>
                    <span className="text-sm text-gray-400">Exact match on target color</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-[#1e1e1e] p-3 rounded-lg border border-[#333]">
                  <div className="w-12 h-12 bg-[#10b981] rounded-lg flex items-center justify-center font-bold text-xl text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]">2</div>
                  <div>
                    <strong className="text-white block">Inner Ring</strong>
                    <span className="text-sm text-gray-400">8 adjacent squares (±1)</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-[#1e1e1e] p-3 rounded-lg border border-[#333]">
                  <div className="w-12 h-12 bg-[#f59e0b] rounded-lg flex items-center justify-center font-bold text-xl text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]">1</div>
                  <div>
                    <strong className="text-white block">Outer Ring</strong>
                    <span className="text-sm text-gray-400">16 surrounding squares (±2)</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-[#1e1e1e] p-3 rounded-lg border border-[#333]">
                  <div className="w-12 h-12 bg-[#ef4444] rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]">0</div>
                  <div>
                    <strong className="text-white block">Miss</strong>
                    <span className="text-sm text-gray-400">Outside the scoring zone</span>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-[#1e1e1e] rounded-lg border border-[#333] flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <p className="text-sm"><strong className="text-[#00d9ff]">Cuer Bonus:</strong> The Cuer earns 1 point for each cone inside the scoring frame!</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-2xl bg-[#333] w-10 h-10 flex items-center justify-center rounded-lg">🚫</span> 
                Restrictions
              </h3>
              <ul className="list-disc list-inside space-y-2 pl-[3.25rem] marker:text-red-500">
                <li><strong className="text-white">No color names:</strong> Can't say "Red," "Blue," "Light," "Dark," or "Green"</li>
                <li><strong className="text-white">No board references:</strong> Can't say "Top left" or "Near the purple part"</li>
                <li><strong className="text-white">No room references:</strong> Can't say "The color of that shirt"</li>
                <li><strong className="text-white">Grey area:</strong> Words like "Salmon" or "Lavender" are allowed (they're objects/plants)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="text-2xl bg-[#333] w-10 h-10 flex items-center justify-center rounded-lg">🎊</span> 
                Winning
              </h3>
              <ul className="list-disc list-inside space-y-2 pl-[3.25rem] marker:text-yellow-500">
                <li><strong className="text-white">Short Game:</strong> Each player acts as Cuer once</li>
                <li><strong className="text-white">Full Game:</strong> Each player acts as Cuer twice</li>
                <li>The player with the highest total score wins!</li>
              </ul>
            </section>
          </div>

          <div className="mt-8 sticky bottom-0 bg-[#2a2a2a]/95 backdrop-blur py-4 border-t border-[#333]">
            <button
              onClick={onClose}
              className="btn-primary w-full py-4 text-lg shadow-lg"
            >
              Got it! Let's Play
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToPlayModal;
