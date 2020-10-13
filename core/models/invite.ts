import mongoose, { Document } from "mongoose";

export interface DbInvite extends Document {
  inviterId: string;
  userJoinedId?: string;
}

export const InviteSchema = new mongoose.Schema({
  inviterId: { type: String, required: true },
  userJoinedId: { type: String, unique: true },
});

export const InviteModel = mongoose.model<DbInvite>(`Invite`, InviteSchema);
