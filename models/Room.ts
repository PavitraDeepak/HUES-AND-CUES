import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer {
  socketId: string;
  userId?: string;
  name: string;
  ready: boolean;
  score: number;
}

export interface IRoomSettings {
  maxPlayers: number;
  rounds: number;
  isPrivate: boolean;
}

export interface IRoom extends Document {
  code: string;
  hostId: string;
  players: IPlayer[];
  settings: IRoomSettings;
  currentGame: any;
  createdAt: Date;
}

const RoomSchema: Schema = new Schema({
  code: { type: String, unique: true, required: true },
  hostId: { type: String, required: true },
  players: [
    {
      socketId: String,
      userId: String,
      name: String,
      ready: { type: Boolean, default: false },
      score: { type: Number, default: 0 },
    },
  ],
  settings: {
    maxPlayers: { type: Number, default: 8 },
    rounds: { type: Number, default: 3 },
    isPrivate: { type: Boolean, default: false },
  },
  currentGame: { type: Object, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
