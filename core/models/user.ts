import mongoose, { Document } from "mongoose";

export interface DbUser extends Document {
  userId: string;
  totalMessages?: number;
  warnings?: IWarnings[];
  messages?: IMessages;
  leveling?: ILeveling;
  muted?: IMute;
}

interface IMute {
  guild: string;
  startedTime: number;
  muteTime: number;
}

interface IWarnings {
  performerId: string;
  reason?: string;
}

interface IMessages {
  lastMessage: string;
  lastMessageTime: number;
  matchCount: number;
}

interface ILeveling {
  lastMessageTime: number;
  xp: number;
}

export const UserSchema = new mongoose.Schema({
  userId: String,
  totalMessages: { type: Number, required: true, default: 0 },
  warnings: [
    {
      performerId: { type: String, required: true },
      reason: String,
    },
  ],
  messages: {
    lastMessage: String,
    lastMessageTime: { type: Number, default: Date.now() },
    matchCount: { type: Number, default: 0 },
  },
  leveling: {
    lastMessageTime: { type: Number, default: Date.now() },
    xp: { type: Number, default: 0 },
  },
  muted: {
    type: {
      guild: { type: String, required: true },
      startedTime: { type: Number, required: true },
      muteTime: { type: Number, required: true },
    },
    default: null,
  },
});

export const UserModel = mongoose.model<DbUser>(`User`, UserSchema);
