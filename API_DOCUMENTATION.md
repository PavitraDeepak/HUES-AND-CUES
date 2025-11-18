# 🔌 Hues & Cues - Socket.IO API Documentation

## Connection

### Establish Connection
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

---

## Client → Server Events

### 1. create_room
Create a new game room with custom settings.

**Emit:**
```typescript
socket.emit('create_room', {
  name: string,           // Player display name (max 20 chars)
  settings: {
    maxPlayers: number,   // 2-12 players (default: 8)
    rounds: number,       // 1-10 rounds (default: 3)
    isPrivate: boolean    // Private room? (default: false)
  }
}, (response) => {
  // Response callback
});
```

**Response:**
```typescript
{
  success: boolean,
  code?: string,         // 6-char room code (e.g., "ABC123")
  userId?: string,       // Generated user ID
  error?: string         // Error message if failed
}
```

**Example:**
```typescript
socket.emit('create_room', {
  name: 'Alice',
  settings: { maxPlayers: 6, rounds: 5, isPrivate: false }
}, (response) => {
  if (response.success) {
    console.log('Room created:', response.code);
    localStorage.setItem('userId', response.userId);
  }
});
```

---

### 2. join_room
Join an existing room by code.

**Emit:**
```typescript
socket.emit('join_room', {
  code: string,          // Room code (6 chars, case-insensitive)
  name: string,          // Player display name
  userId?: string        // Optional: for reconnection
}, (response) => {
  // Response callback
});
```

**Response:**
```typescript
{
  success: boolean,
  userId?: string,       // User ID (same or new)
  error?: string         // "Room not found" | "Room is full"
}
```

**Example:**
```typescript
socket.emit('join_room', {
  code: 'ABC123',
  name: 'Bob',
  userId: localStorage.getItem('userId')
}, (response) => {
  if (response.success) {
    localStorage.setItem('userId', response.userId);
  }
});
```

---

### 3. player_ready
Toggle ready status before game starts.

**Emit:**
```typescript
socket.emit('player_ready', {
  code: string,          // Current room code
  ready: boolean         // true = ready, false = unready
}, (response) => {
  // Response callback
});
```

**Response:**
```typescript
{
  success: boolean,
  error?: string
}
```

---

### 4. start_game
Start the game (host only).

**Emit:**
```typescript
socket.emit('start_game', {
  code: string           // Room code
}, (response) => {
  // Response callback
});
```

**Response:**
```typescript
{
  success: boolean,
  error?: string         // "Only host can start game" | "Not all players are ready"
}
```

**Validation:**
- Only host can start
- All players must be ready (except host)
- At least 2 players required

---

### 5. send_clue
Submit a clue (clue giver only).

**Emit:**
```typescript
socket.emit('send_clue', {
  code: string,          // Room code
  clue: string           // One or two words (validated)
}, (response) => {
  // Response callback
});
```

**Response:**
```typescript
{
  success: boolean,
  error?: string         // "Clue must be exactly 1 word(s)" | "Not your turn"
}
```

**Validation:**
- Only current clue giver can submit
- Phase 1: Must be exactly 1 word
- Phase 2: Must be exactly 2 words
- Words separated by whitespace

---

### 6. place_guess
Submit a color guess on the grid.

**Emit:**
```typescript
socket.emit('place_guess', {
  code: string,          // Room code
  guessIndex: number     // 0-479 (grid index)
}, (response) => {
  // Response callback
});
```

**Response:**
```typescript
{
  success: boolean,
  error?: string         // "Clue giver cannot guess"
}
```

**Behavior:**
- Clue giver cannot guess
- Can only guess once per phase
- Round auto-advances when all players guess

---

### 7. chat_message
Send a chat message in the room.

**Emit:**
```typescript
socket.emit('chat_message', {
  code: string,          // Room code
  message: string        // Max 200 characters
}, (response) => {
  // Response callback
});
```

**Response:**
```typescript
{
  success: boolean,
  error?: string
}
```

---

### 8. next_round
Advance to next phase or round (host only).

**Emit:**
```typescript
socket.emit('next_round', {
  code: string           // Room code
}, (response) => {
  // Response callback
});
```

**Response:**
```typescript
{
  success: boolean,
  error?: string         // "Only host can advance round"
}
```

**Behavior:**
- Phase 1 → Phase 2: Same target, new clue
- Phase 2 → Round N+1: New target, new clue giver
- Final round → Game over

---

### 9. leave_room
Leave the current room.

**Emit:**
```typescript
socket.emit('leave_room', {
  code: string           // Room code
}, (response?) => {
  // Optional callback
});
```

**Behavior:**
- Remove player from room
- Reassign host if leaving player was host
- Delete room if empty

---

## Server → Client Events

### 1. room_state
Broadcast when room data changes.

**Receive:**
```typescript
socket.on('room_state', (state) => {
  console.log('Room updated:', state);
});
```

**Data:**
```typescript
{
  code: string,
  hostId: string,        // Socket ID of host
  players: [
    {
      id: string,        // Socket ID
      name: string,
      ready: boolean,
      score: number
    }
  ],
  settings: {
    maxPlayers: number,
    rounds: number,
    isPrivate: boolean
  },
  hasActiveGame: boolean
}
```

---

### 2. game_started
Emitted when game begins.

**Receive:**
```typescript
socket.on('game_started', (data) => {
  console.log('Game starting!', data);
});
```

**Data:**
```typescript
{
  gameState: {
    currentRound: number,
    roundsTotal: number,
    currentPhase: number,      // 1 or 2
    cardColors: string[],      // Array of 4 hex colors
    clue?: string,
    guessDeadline?: number     // Unix timestamp
  },
  clueGiver: string            // Player name
}
```

---

### 3. clue_given
Emitted when clue giver submits a clue.

**Receive:**
```typescript
socket.on('clue_given', (data) => {
  console.log('Clue:', data.clue);
});
```

**Data:**
```typescript
{
  clue: string,
  phase: number,               // 1 or 2
  clueGiver: string,           // Player name
  deadline: number             // Unix timestamp (60s from now)
}
```

---

### 4. guess_placed
Notification when a player guesses.

**Receive:**
```typescript
socket.on('guess_placed', (data) => {
  console.log(`${data.playerName} guessed!`);
});
```

**Data:**
```typescript
{
  playerName: string,
  totalGuesses: number,
  expectedGuesses: number      // Total players - 1 (clue giver)
}
```

---

### 5. round_results
Show scoring results after a phase.

**Receive:**
```typescript
socket.on('round_results', (data) => {
  console.log('Round complete!', data);
});
```

**Data:**
```typescript
{
  targetIndex: number,         // 0-479 (grid index)
  targetColor: string,         // Hex color
  results: [
    {
      playerName: string,
      guessIndex: number,
      distance: number,        // Euclidean distance
      points: number,          // 0-100
      autoGuess?: boolean      // True if timed out
    }
  ],
  scoreboard: [
    {
      name: string,
      score: number            // Total score
    }
  ],
  phase: number,               // 1 or 2
  round: number
}
```

---

### 6. phase_changed
Transition from phase 1 to phase 2.

**Receive:**
```typescript
socket.on('phase_changed', (data) => {
  console.log('Moving to phase 2');
});
```

**Data:**
```typescript
{
  round: number,
  phase: 2,
  clueGiver: string            // Same as phase 1
}
```

---

### 7. new_round
Start a new round with new target.

**Receive:**
```typescript
socket.on('new_round', (data) => {
  console.log('New round started!', data);
});
```

**Data:**
```typescript
{
  round: number,
  cardColors: string[],        // New set of 4 colors
  clueGiver: string            // Rotated to next player
}
```

---

### 8. game_over
Final scores and winner.

**Receive:**
```typescript
socket.on('game_over', (data) => {
  console.log('Winner:', data.winner);
});
```

**Data:**
```typescript
{
  winner: string,              // Player name
  finalScores: [
    {
      name: string,
      score: number
    }
  ],
  roundHistory: [              // Full game history
    {
      round: number,
      phase: number,
      clue: string,
      targetIndex: number,
      results: [...]
    }
  ]
}
```

---

### 9. chat_message
Broadcast chat message to room.

**Receive:**
```typescript
socket.on('chat_message', (message) => {
  console.log('Chat:', message);
});
```

**Data:**
```typescript
{
  type: 'player' | 'system',
  playerName?: string,         // If type = 'player'
  message: string,
  timestamp: Date
}
```

**System Messages:**
- Player joined/left
- Host changed
- Game started/ended

---

## Error Handling

All emit callbacks follow this pattern:
```typescript
{
  success: boolean,
  error?: string
}
```

Common errors:
- `"Room not found"` - Invalid room code
- `"Room is full"` - Max players reached
- `"Only host can start game"` - Permission denied
- `"Not all players are ready"` - Cannot start yet
- `"Clue must be exactly N word(s)"` - Word count validation
- `"Not your turn to give clue"` - Wrong player
- `"Clue giver cannot guess"` - Role restriction

---

## Connection Events

```typescript
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Auto-cleanup on server side
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

---

## Reconnection Flow

1. Client stores `userId` in localStorage
2. On disconnect, client attempts reconnect
3. On reconnect, client emits `join_room` with `userId`
4. Server finds player by `userId`, updates `socketId`
5. Client receives current `room_state` and `gameState`

**Example:**
```typescript
const userId = localStorage.getItem('userId');
const roomCode = sessionStorage.getItem('roomCode');

socket.on('connect', () => {
  if (userId && roomCode) {
    socket.emit('join_room', {
      code: roomCode,
      name: localStorage.getItem('playerName'),
      userId
    }, (response) => {
      if (response.success) {
        console.log('Reconnected successfully!');
      }
    });
  }
});
```

---

## TypeScript Types

```typescript
interface Player {
  id: string;
  userId?: string;
  name: string;
  ready: boolean;
  score: number;
}

interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  isPrivate: boolean;
}

interface GameState {
  currentRound: number;
  roundsTotal: number;
  currentPhase: 1 | 2;
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
```

---

## Rate Limiting (Recommended)

Implement server-side rate limits:
- `create_room`: 5 per minute per IP
- `join_room`: 10 per minute per IP
- `send_clue`: 1 per phase
- `place_guess`: 1 per phase
- `chat_message`: 10 per minute per player

---

## Testing with Socket.IO Client

```bash
npm install -g socket.io-client-cli

socket.io-client http://localhost:3000
> emit create_room {"name":"TestPlayer","settings":{"maxPlayers":4,"rounds":2}}
> on room_state
```

---

## Best Practices

1. **Always use callbacks** for critical operations
2. **Validate on server** - Never trust client input
3. **Handle disconnects** gracefully
4. **Store userId** in localStorage for reconnection
5. **Show loading states** during socket operations
6. **Display errors** from server responses
7. **Clean up listeners** on component unmount

```typescript
useEffect(() => {
  socket.on('room_state', handleRoomState);
  
  return () => {
    socket.off('room_state', handleRoomState);
  };
}, []);
```

---

**Documentation Version**: 1.0  
**Last Updated**: November 18, 2025  
**Socket.IO Version**: 4.8.1
