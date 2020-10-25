import { ClientEvents } from "discord.js";
export type EventNameType = keyof ClientEvents;

export default abstract class Event {
  disabled = false;
  abstract name: string;

  abstract async handle(...args: unknown[]): Promise<void>;
}
