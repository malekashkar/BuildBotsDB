import { ClientEvents } from "discord.js";

import Bot from "../../";

export type EventNameType = keyof ClientEvents;

export default abstract class Event {
  bot: Bot;
  disabled = false;
  abstract name: string;

  constructor(bot: Bot) {
    this.bot = bot;
  }

  abstract async handle(...args: unknown[]): Promise<void>;
}
