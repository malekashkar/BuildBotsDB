import { Collection, Invite, Client } from "discord.js";
import settings from "./settings.json";
import Command from "../../core/commands";
import modules from "../../core";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

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