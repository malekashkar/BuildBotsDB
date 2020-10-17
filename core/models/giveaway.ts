import mongoose, { Document } from "mongoose";

export interface DbGiveaways extends Document {
  status: string;
  prize: string;
  startTime: number;
  endTime: number;
  winners: number;
  messageId: string;
  channelId: string;
  condition: {
    requiredRoles: string[];
    requiredInvites: number;
    requiredGuilds: string[];
    requiredMessages: number;
  };
}

export const GiveawaySchema = new mongoose.Schema({
  status: String,
  prize: String,
  startTime: Number,
  endTime: Number,
  winners: Number,
  messageId: { type: String, unique: true },
  channelId: String,
  condition: {
    requiredRoles: [String],
    requiredInvites: Number,
    requiredGuilds: [String],
    requiredMessages: Number,
  },
});

export const GiveawayModel = mongoose.model<DbGiveaways>(`Giveaway`, GiveawaySchema);
