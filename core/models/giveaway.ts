import mongoose, { Document } from "mongoose";

export interface DbGiveaways extends Document {
  status: string;
  prize: string;
  endTime: number;
  winners: number;
  messageId: string;
  channelId: string;
  guildId: string;
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
  endTime: Number,
  winners: Number,
  messageId: { type: String, unique: true },
  channelId: String,
  guildId: String,
  condition: {
    requiredRoles: [String],
    requiredInvites: Number,
    requiredGuilds: [String],
    requiredMessages: Number,
  },
});

export const GiveawayModel = mongoose.model<DbGiveaways>(
  `Giveaway`,
  GiveawaySchema
);
