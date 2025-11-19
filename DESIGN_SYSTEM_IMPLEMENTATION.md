# 🎨 Hues & Cues - Design System Implementation

## ✅ Completed Changes

### 1. Global Design System (globals.css)
- **Background**: Changed to #1e1e1e (dark mode only)
- **Font**: Added Inter font family import
- **Color Variables**: 
  - `--bg-primary`: #1e1e1e
  - `--neon-accent`: #00d9ff (Electric Blue)
  - `--border-subtle`: #333333
- **New CSS Classes**:
  - `.btn-primary` - Neon blue gradient buttons
  - `.btn-secondary` - Transparent with subtle borders
  - `.input-field` - Styled form inputs
  - `.chat-bubble` - Discord-style message bubbles
  - `.ghost-pawn` - Semi-transparent pawn preview
- **New Animations**:
  - `glow-pulse` - Pulsing neon glow
  - `gradient-shift` - Moving gradient background
- **Interaction Classes**:
  - Hover effects with white glow
  - Click sound effect hooks (ready for implementation)
  - Ghost pawn positioning

### 2. How To Play Modal (components/HowToPlayModal.tsx)
- Created comprehensive modal with game rules
- Sections: Objective, Setup, Turn Sequence, Scoring, Restrictions, Winning
- Visual scoring indicators (3/2/1/0 points)
- Cuer bonus explanation
- Styled with dark theme (#2a2a2a background)

### 3. Color System (lib/colors.js & lib/colors.ts)
- Proper grid-based scoring (3/2/1/0 points)
- Coordinate system (A-4, H-9, etc.)
- Distance calculation using grid positions

### 4. Game Logic (server.js)
- Two-phase turn system implemented
- Cone 1 placed after one-word clue
- Cone 2 placed after two-word clue
- Cuer scoring (1 point per cone in frame)
- Phase transitions with 3-second pause

## 🔨 Recommended Next Steps

### Priority 1: Waiting Room Redesign
**File**: `app/room/[code]/page.tsx`

Create split-screen layout when `!hasActiveGame`:

```tsx
<div className="min-h-screen bg-[#1e1e1e] flex">
  {/* LEFT PANEL (50%) - Settings */}
  <div className="w-1/2 p-8 border-r border-[#333]">
    <div className="max-w-md mx-auto">
      {/* Room Code with Copy Button */}
      <div className="mb-8">
        <h2 className="text-sm text-gray-400 mb-2">Room Code</h2>
        <div className="flex items-center gap-3">
          <div className="text-4xl font-bold text-white font-mono tracking-wider">
            {roomState.code}
          </div>
          <button className="btn-secondary px-4 py-2">
            📋 Copy Link
          </button>
        </div>
      </div>

      {/* Game Settings (Host Only) */}
      {isHost && (
        <div className="space-y-6">
          <div>
            <label className="text-white font-medium mb-2 block">
              Rounds per player
            </label>
            <input 
              type="range" 
              min="1" 
              max="5" 
              className="w-full"
            />
          </div>
          <div>
            <label className="text-white font-medium mb-2 block">
              Turn Timer (seconds)
            </label>
            <select className="input-field w-full">
              <option>30</option>
              <option>60</option>
              <option>90</option>
              <option>No limit</option>
            </select>
          </div>
        </div>
      )}
    </div>
  </div>

  {/* RIGHT PANEL (50%) - Player Roster */}
  <div className="w-1/2 p-8">
    <h2 className="text-2xl font-bold text-white mb-6">
      Players ({players.length}/{maxPlayers})
    </h2>
    <div className="grid grid-cols-2 gap-4">
      {players.map(player => (
        <div 
          key={player.id}
          className="glass p-4 rounded-xl flex items-center gap-3"
        >
          <div className="w-3 h-3 rounded-full" style={{
            backgroundColor: player.ready ? '#10b981' : '#6b7280'
          }} />
          <span className="text-white font-medium">{player.name}</span>
          {player.id === hostId && (
            <span className="text-xs text-[#00d9ff]">HOST</span>
          )}
        </div>
      ))}
    </div>

    {/* Start Button (Host Only) */}
    {isHost && (
      <button className="btn-primary w-full mt-8 py-4 text-xl">
        🚀 START GAME
      </button>
    )}
  </div>
</div>
```

### Priority 2: Game Dashboard 3-Column Layout
**File**: `components/GameBoard.tsx`

Replace entire return with:

```tsx
<div className="min-h-screen bg-[#1e1e1e] flex">
  {/* LEFT SIDEBAR (15%) - Players & Turn Order */}
  <div className="w-[15%] bg-[#2a2a2a] border-r border-[#333] p-4 overflow-y-auto">
    {/* Turn Phase Indicator */}
    <div className="mb-6 glass p-3 rounded-lg text-center">
      <div className="text-xs text-gray-400 mb-1">PHASE</div>
      <div className="text-lg font-bold text-white">
        {currentPhase === 1 ? '1-Word Hint' : '2-Word Hint'}
      </div>
    </div>

    {/* Player List (Vertical) */}
    <div className="space-y-3">
      {players.map(player => {
        const isActive = player.id === clueGiverId;
        return (
          <div 
            key={player.id}
            className={`p-3 rounded-lg transition-all ${
              isActive ? 'animate-glow-pulse bg-[#00d9ff]/10' : 'bg-[#1e1e1e]'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: getAvatarColor(player.name) }}
              >
                {getInitials(player.name)}
              </div>
              <span className="text-white text-sm font-medium truncate">
                {player.name}
              </span>
            </div>
            <div className="text-2xl font-bold text-[#00d9ff]">
              {player.score} pts
            </div>
          </div>
        );
      })}
    </div>
  </div>

  {/* CENTER STAGE (65%) - The Board */}
  <div className="flex-1 flex flex-col">
    {/* Top HUD */}
    <div className="bg-[#2a2a2a] border-b border-[#333] px-6 py-4">
      {/* Timer Bar */}
      {timeLeft && (
        <div className="w-full h-1 bg-[#333] rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-[#00d9ff] transition-all duration-100"
            style={{ width: `${(timeLeft / 60000) * 100}%` }}
          />
        </div>
      )}

      {/* Current Clue Display */}
      {clue && (
        <div className="text-center">
          <div className="text-sm text-gray-400 mb-1">CLUE</div>
          <div className="text-4xl font-bold text-white tracking-wider">
            "{clue.toUpperCase()}"
          </div>
        </div>
      )}
    </div>

    {/* Board Container (Pan & Zoom Ready) */}
    <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
      <ColorGrid 
        onColorClick={handleColorClick}
        highlightedIndex={selectedIndex}
        // Add pan/zoom props here
      />
    </div>

    {/* Bottom Dock (Context Aware) */}
    <div className="bg-[#2a2a2a] border-t border-[#333] px-8 py-6">
      {isClueGiver && !clue && (
        // Cuer View: Show card + input
        <CuerInterface 
          cardColors={cardColors}
          targetIndex={targetIndex}
          onSubmitClue={handleClueSubmit}
        />
      )}

      {!isClueGiver && clue && (
        // Guesser View: Confirm button
        <div className="max-w-md mx-auto">
          {!hasGuessed && selectedIndex !== null && (
            <button className="btn-primary w-full py-4 text-xl">
              ✓ Confirm Placement
            </button>
          )}
          {hasGuessed && (
            <div className="text-center text-[#10b981] text-lg font-semibold">
              ✓ Guess submitted! Waiting for others...
            </div>
          )}
        </div>
      )}
    </div>
  </div>

  {/* RIGHT SIDEBAR (20%) - Chat & Logs */}
  <div className="w-[20%] bg-[#2a2a2a] border-l border-[#333] flex flex-col">
    {/* Tabs */}
    <div className="flex border-b border-[#333]">
      <button className="flex-1 py-3 text-sm font-medium text-[#00d9ff] border-b-2 border-[#00d9ff]">
        Chat
      </button>
      <button className="flex-1 py-3 text-sm font-medium text-gray-400">
        Game Log
      </button>
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {chatMessages.map((msg, i) => (
        <div key={i} className={msg.type === 'system' ? 'chat-bubble-system' : 'chat-bubble'}>
          {msg.type === 'player' && (
            <div className="text-xs text-[#00d9ff] font-semibold mb-1">
              {msg.playerName}
            </div>
          )}
          <div className="text-sm text-white">
            {msg.message}
          </div>
        </div>
      ))}
    </div>

    {/* Chat Input */}
    <div className="p-4 border-t border-[#333]">
      <input 
        type="text"
        placeholder="Type a message..."
        className="input-field w-full"
      />
    </div>
  </div>
</div>
```

### Priority 3: Reveal Overlay
**File**: `components/RoundResultsModal.tsx`

```tsx
{showResults && (
  <div className="scoring-overlay animate-fade-in">
    <div className="max-w-4xl mx-auto mt-20 bg-[#2a2a2a] border border-[#333] rounded-2xl p-8">
      <h2 className="text-3xl font-bold text-white text-center mb-6">
        Round Complete!
      </h2>

      {/* Target Color Display */}
      <div className="text-center mb-8">
        <div className="text-gray-400 mb-2">TARGET COLOR</div>
        <div 
          className="w-32 h-32 mx-auto rounded-xl border-4 border-[#00d9ff] animate-pulse-glow"
          style={{ backgroundColor: targetColor }}
        />
        <div className="text-white font-mono mt-2">{getCoordinate(targetIndex)}</div>
      </div>

      {/* Scores with Animation */}
      <div className="space-y-4">
        {results.map((result, i) => (
          <div 
            key={i}
            className="flex items-center justify-between glass p-4 rounded-lg animate-slide-up"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full" style={{
                backgroundColor: getAvatarColor(result.playerName)
              }}>
                {getInitials(result.playerName)}
              </div>
              <span className="text-white font-medium">{result.playerName}</span>
            </div>
            <div className="text-3xl font-bold text-[#00d9ff] animate-score-float">
              +{result.totalPoints}
            </div>
          </div>
        ))}
      </div>

      {/* Next Round Timer */}
      <div className="mt-8 text-center">
        <div className="text-gray-400 mb-2">Next round in</div>
        <div className="text-5xl font-bold text-white">3</div>
      </div>
    </div>
  </div>
)}
```

### Priority 4: Interaction Polish

**Add to ColorGrid.tsx**:
```tsx
// Ghost Pawn on Hover
const [ghostPosition, setGhostPosition] = useState(null);

const handleMouseMove = (e) => {
  // Calculate tile index from mouse position
  const tileIndex = getTileFromMousePosition(e);
  setGhostPosition(tileIndex);
};

return (
  <div className="relative" onMouseMove={handleMouseMove}>
    {/* Color Grid */}
    {/* ... */}

    {/* Ghost Pawn */}
    {ghostPosition !== null && (
      <div 
        className="ghost-pawn absolute"
        style={{
          left: calculateX(ghostPosition),
          top: calculateY(ghostPosition)
        }}
      >
        <div className="pawn-marker" style={{ color: playerColor }} />
      </div>
    )}
  </div>
);
```

**Add Input Validation**:
```tsx
// In Cuer input handler
const validateClue = (text) => {
  const forbidden = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 
                     'pink', 'brown', 'black', 'white', 'gray', 'grey',
                     'light', 'dark'];
  const words = text.toLowerCase().split(/\s+/);
  
  for (const word of words) {
    if (forbidden.includes(word)) {
      setShowError(true);
      inputRef.current.classList.add('animate-shake');
      setTimeout(() => {
        setShowError(false);
        inputRef.current.classList.remove('animate-shake');
      }, 500);
      return false;
    }
  }
  return true;
};
```

## 📱 Mobile Responsiveness Notes

For mobile (<768px), use this structure:

```tsx
<div className="min-h-screen flex flex-col">
  {/* Top Bar */}
  <div className="h-16 bg-[#2a2a2a] flex items-center justify-between px-4">
    <div className="text-white font-bold">{clue || 'Waiting...'}</div>
    <div className="text-[#00d9ff]">{timeLeft}s</div>
  </div>

  {/* Board (Full Screen) */}
  <div className="flex-1 overflow-auto">
    <ColorGrid />
  </div>

  {/* Bottom Bar */}
  <div className="h-20 bg-[#2a2a2a] flex items-center justify-center gap-4">
    <button className="btn-secondary px-4 py-2">💬 Chat</button>
    <button className="btn-secondary px-4 py-2">🏆 Scores</button>
    <button className="btn-primary px-6 py-3">Confirm</button>
  </div>
</div>
```

## 🎵 Sound Effects (Ready to Add)

Add these audio files to `/public/sounds/`:
- `click.mp3` - When placing a cone
- `success.mp3` - When scoring points
- `phase-change.mp3` - When moving to phase 2
- `round-end.mp3` - When round completes

```tsx
const playSound = (soundName) => {
  const audio = new Audio(`/sounds/${soundName}.mp3`);
  audio.volume = 0.3;
  audio.play();
};
```

## ✨ Polish Checklist

- [ ] Add click sound when placing cone
- [ ] Implement pan/zoom on board (use react-zoom-pan-pinch library)
- [ ] Add emoji reactions floating over board
- [ ] Animate score counting up (use countup.js or similar)
- [ ] Add "thinking..." indicator when waiting for guesses
- [ ] Implement smooth transitions between phases
- [ ] Add confetti on round win
- [ ] Add keyboard shortcuts (Space = confirm, Escape = cancel)

---

**Total Implementation Status**: 35% Complete
**Estimated Time to Full Completion**: 8-12 hours
