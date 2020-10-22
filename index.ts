import settings from "./settings.json";
import Command from "./core/commands";
import modules from "./core";
import dotenv from "dotenv";

import { Collection, Invite, Client } from "discord.js";

dotenv.config();

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
    });
  }
}

new modules(new Main(), settings, process.env);
