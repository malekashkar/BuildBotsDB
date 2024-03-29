import Main from "../structures/client";
import { Message } from "discord.js";
import { DbUser } from "../models/user";
import { DbGuild } from "../models/guild";
export default abstract class Command {
  permission: string;
  disabled = false;
  usage = "";

  abstract cmdName: string;
  abstract description: string;
  abstract module: string;
  abstract async run(
    _client: Main,
    _message: Message,
    _args: string[],
    _userData?: DbUser,
    _guildData?: DbGuild,
    _command?: string
  ): Promise<Message | void>;
}
