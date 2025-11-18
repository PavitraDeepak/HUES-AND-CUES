# 🎨 Hues & Cues - Multiplayer Color Game

A real-time multiplayer color guessing game built with Next.js, Socket.IO, and MongoDB Atlas. Players take turns giving one or two-word clues to help others guess a target color on a 480-color grid.

![Hues & Cues Game](https://img.shields.io/badge/Game-Multiplayer-blue) ![Next.js](https://img.shields.io/badge/Next.js-16.0-black) ![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)

## ✨ Features

- 🎮 **Real-time Multiplayer** - Play with 2-12 players using Socket.IO
- 🎨 **480-Color Grid** - Algorithmically generated HSL color palette
- 🎯 **Two-Phase Rounds** - Give one-word then two-word clues
- 💬 **In-Room Chat** - Communicate with other players
- 🏆 **Distance-Based Scoring** - Closer guesses earn more points
- 🔄 **Reconnect Support** - Rejoin games if disconnected
- 📱 **Mobile Responsive** - Play on any device
- 💾 **MongoDB Persistence** - Save game history and room data

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HUES-AND-CUES
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your MongoDB connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hues-and-cues
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
   PORT=3000
   NODE_ENV=development
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 How to Play

1. **Create or Join a Room**
   - Enter your name
   - Create a new room or join with a room code

2. **Wait for Players**
   - Players mark themselves as ready
   - Host starts the game when all are ready

3. **Gameplay Loop**
   - One player is the **Clue Giver** each round
   - Clue Giver sees 4 colors and one is the target
   - **Phase 1**: Give a ONE-word clue
   - All other players guess by clicking the 480-color grid
   - **Phase 2**: Give a TWO-word clue
   - Players guess again to refine their answer

4. **Scoring**
   - Points awarded based on distance from target color
   - Closer guesses = higher scores
   - Formula: `score = (1 - distance/maxDistance) × 100`

5. **Win Condition**
   - Player with highest score after all rounds wins!

## 📁 Project Structure

```
/hues-and-cues
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home/lobby page
│   ├── globals.css          # Global styles
│   └── room/[code]/
│       └── page.tsx         # Game room page
├── components/              # React components
│   ├── ColorGrid.tsx        # 480-color grid display
│   ├── PlayerList.tsx       # Player list with scores
│   ├── Chat.tsx             # In-room chat
│   ├── GameBoard.tsx        # Main game interface
│   ├── RoundResultsModal.tsx # Round results display
│   └── GameOverModal.tsx    # Final scores display
├── lib/
│   ├── colors.ts            # Color palette & utilities
│   ├── useSocket.ts         # Socket.IO client hook
│   └── mongodb.ts           # MongoDB connection
├── models/                  # Mongoose schemas
│   ├── User.ts
│   ├── Room.ts
│   └── GameHistory.ts
├── types/
│   └── global.d.ts          # TypeScript global types
├── server.js                # Express + Socket.IO server
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── .env.example
```

## 🔧 Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js + Express** - Custom server
- **Socket.IO Server** - WebSocket handling
- **MongoDB + Mongoose** - Database & ODM
- **Next.js API** - Integrated with custom server

## 🌐 Socket.IO Events

### Client → Server
- `create_room` - Create a new game room
- `join_room` - Join existing room
- `player_ready` - Toggle ready status
- `start_game` - Begin game (host only)
- `send_clue` - Submit clue (clue giver only)
- `place_guess` - Submit color guess
- `chat_message` - Send chat message
- `next_round` - Advance to next round (host only)
- `leave_room` - Leave the room

### Server → Client
- `room_state` - Room data update
- `game_started` - Game initialization
- `clue_given` - Clue broadcast to players
- `guess_placed` - Guess confirmation
- `round_results` - Round scoring results
- `phase_changed` - Phase transition
- `new_round` - New round started
- `game_over` - Final scores
- `chat_message` - Chat message broadcast

## 🎨 Color Grid System

- **Grid Size**: 24 columns × 20 rows = 480 colors
- **Generation**: HSL color space with 20 lightness levels and 24 hues
- **Distribution**: Evenly spaced for visual distinction
- **Scoring**: Euclidean distance on grid coordinates

## 🚀 Deployment

### Vercel (Frontend) + Railway/Heroku (Backend)

**Frontend (Next.js on Vercel)**
1. Connect your GitHub repo to Vercel
2. Add environment variable: `NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app`
3. Deploy

**Backend (Socket.IO on Railway/Heroku)**
1. Create new project on Railway/Heroku
2. Connect your GitHub repo
3. Add environment variables:
   - `MONGODB_URI`
   - `PORT=3000`
   - `NODE_ENV=production`
4. Deploy with start command: `node server.js`

### All-in-One (DigitalOcean/AWS)
1. Deploy as a single Node.js application
2. Run `npm run build` to build Next.js
3. Start with `npm start` (runs server.js)

### MongoDB Atlas Setup
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist your IP or use `0.0.0.0/0` for development
4. Copy connection string to `.env`

## 🧪 Testing

```bash
# Run the development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🔒 Security Considerations

- ✅ Server-side validation for all game actions
- ✅ Only host can start games
- ✅ Only clue giver can submit clues
- ✅ Input sanitization on clues and chat messages
- ✅ Rate limiting recommended for production
- ⚠️ Add authentication for persistent accounts (NextAuth.js)

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO server URL | `http://localhost:3000` or `https://api.yourdomain.com` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` or `production` |

## 🎯 Future Enhancements

- [ ] Persistent user accounts with NextAuth.js
- [ ] Player avatars and profiles
- [ ] Custom color palettes
- [ ] Spectator mode
- [ ] Game history and statistics
- [ ] AI clue suggestions
- [ ] Ranked matchmaking
- [ ] Mobile app (React Native)

## 📄 License

MIT License - Feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📧 Support

For issues or questions, please open a GitHub issue.

---

**Built with ❤️ using Next.js, Socket.IO, and MongoDB Atlas**

Happy color guessing! 🎨✨