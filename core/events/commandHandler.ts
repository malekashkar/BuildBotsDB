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

      const prefixRegex = new RegExp(
        `^${guildData.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
      );
      const prefixMatch = message.content.match(prefixRegex);

      const prefix = prefixMatch ? prefixMatch[0] : null;
      if (!prefix || message.content.indexOf(prefix) !== 0) return;

      const args = message.content
        .slice(prefix.length)
        .trim()
        .replace(/ /g, "\n")
        .split(/\n+/g);
      const command = args.shift().toLowerCase();

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
