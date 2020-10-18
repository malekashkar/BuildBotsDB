import Main from "../../";
import Command from "../commands";
import embeds from "../utils/embeds";
import logger from "../utils/logger";

import { Message } from "discord.js";
import { GuildModel } from "../models/guild";
import { UserModel } from "../models/user";
import Event from ".";

export default class commandHandler extends Event {
  name = "message";

  async handle(client: Main, message: Message) {
    try {
      if (!message.guild || !message.author || message.author.bot) return;

      const guildData =
        (await GuildModel.findOne({ guildId: message.guild.id })) ||
        new GuildModel({
          guildId: message.guild.id,
        });

      const userData =
        (await UserModel.findOne({
          userId: message.author.id,
        })) ||
        new UserModel({
          userId: message.author.id,
        });

      userData.totalMessages += 1;
      await userData.save();

      const prefix = guildData.prefix;
      if (!prefix || message.content.indexOf(prefix) !== 0) return;

      let args = message.content
        .slice(prefix.length)
        .trim()
        .replace(/ /g, "\n")
        .split(/\n+/g);
      if (!args) return;

      const cmdName = args.join(" ")?.toLowerCase();
      if (!cmdName) return;

      const command = client.commands
        .array()
        .find((commandObj) =>
          cmdName.startsWith(commandObj.cmdName.toLowerCase())
        ).cmdName;
      if (!command) {
        message.channel.send(
          embeds.error(
            `No command was found in the message \`${message.content}\`!`,
            `Invalid Command`
          )
        );
        return;
      }

      args = args.join(" ").slice(command.length).trim().split(" ");

      const commandObj = client.commands.find(
        (x: Command) => x.cmdName === command
      );
      if (!commandObj) {
        message.channel.send(
          embeds.error(
            `The command \`${command}\` does not exist!`,
            `Invalid Command`
          )
        );
        return;
      }

      try {
        for (const commandObj of client.commands.array()) {
          if (commandObj.disabled) continue;
          if (commandObj.cmdName.toLowerCase() === command) {
            commandObj
              .run(
                client,
                message,
                args,
                userData,
                guildData,
                commandObj.cmdName
              )
              .catch((err) =>
                logger.error(`${command.toUpperCase()}_ERROR`, err)
              );
          }
        }
      } catch (err) {
        logger.error("COMMAND_HANDLER", err);
      }
    } catch (err) {
      logger.error("COMMAND_HANDLER", err);
    }
  }
}
