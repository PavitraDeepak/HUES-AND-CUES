import mongoose, { Schema, Document } from 'mongoose';

export interface IGamePlayer {
  name: string;
  score: number;
}

export interface IGameRound {
  roundNumber: number;
  clues: string[];
  targetIndex: number;
  clueGiver: string;
}

export interface IGameHistory extends Document {
  roomCode: string;
  players: IGamePlayer[];
  rounds: IGameRound[];
  winner?: string;
  createdAt: Date;
}

const GameHistorySchema: Schema = new Schema({
  roomCode: { type: String, required: true },
  players: [
    {
      name: String,
      score: Number,
    },
  ],
  rounds: [
    {
      roundNumber: Number,
      clues: [String],
      targetIndex: Number,
      clueGiver: String,
    },
  ],
  winner: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.GameHistory ||
  mongoose.model<IGameHistory>('GameHistory', GameHistorySchema);
