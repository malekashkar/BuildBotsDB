import mongoose, { Document } from "mongoose";

export interface DbBan extends Document {
  _id: string;
  banTime: number;
}

export const BanSchema = new mongoose.Schema({
  _id: String,
  banTime: { type: Number, required: true },
});

export const BanModel = mongoose.model<DbBan>(`Ban`, BanSchema);
