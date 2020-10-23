import { Client, Collection, Invite } from "discord.js";
import Command from "../commands";

export default class Main extends Client {
  commands: Collection<string, Command> = new Collection();
  invites: Collection<string, Collection<string, Invite>> = new Collection();
}
