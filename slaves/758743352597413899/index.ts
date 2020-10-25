import { Collection, Invite, Client } from "discord.js";
import Command from "../../mother/commands";
import settings from "./settings.json";
import modules from "../../mother";

export default class Main extends Client {
  commands: Collection<string, Command> = new Collection();
  invites: Collection<string, Collection<string, Invite>> = new Collection();

  constructor() {
    super({
      partials: ["MESSAGE", "CHANNEL", "REACTION"],
    });
  }
}

new modules(new Main(), settings);
