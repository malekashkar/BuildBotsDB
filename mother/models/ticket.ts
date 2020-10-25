import mongoose, { Document } from "mongoose";

export interface DbTicket extends Document {
  ticketType: string;
  channelId: string;
  openedFor: string;
  claimMsg?: string;
}

export const TicketSchema = new mongoose.Schema({
  ticketType: { type: String, required: true },
  channelId: { type: String, required: true, unique: true },
  openedFor: { type: String, required: true },
  claimMsg: { type: String, unique: true },
});

export const TicketModel = mongoose.model<DbTicket>(`Ticket`, TicketSchema);
