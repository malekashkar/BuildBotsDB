import settings from "./settings.json";
import Command from "./core/commands";
import modules from "./core";

import { Collection, Invite, Client } from "discord.js";

export default class Main extends Client {
  commands: Collection<string, Command> = new Collection();
  invites: Collection<string, Collection<string, Invite>> = new Collection();

  constructor() {
    super({
      partials: ["MESSAGE", "CHANNEL", "REACTION"],
      presence: {
        activity: {
          name: `${settings.name} | Try out ${settings.prefix}help`,
        },
      },
      //ws: {
      //  intents: ["GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"],
      //},
    });
  }
}

new modules(new Main(), settings);
