import Main from "../../";
import Modules from "../";
import Command from "../commands";
import embeds from "../utils/embeds";
import logger from "../utils/logger";

import { Message } from "discord.js";

export default class commandHandler {
  name = "message";

  async handle(modules: Modules, client: Main, message: Message) {
    try {
      if (!message.guild || !message.author || message.author.bot) return;

      console.log(modules.db);

      const guildData =
        (await modules.db.guilds.findById(message.guild.id)) ||
        new modules.db.guilds({
          _id: message.guild.id,
        });

      const userData =
        (await modules.db.users.findOne({
          userId: message.author.id,
        })) ||
        (await modules.db.users.create({
          userId: message.author.id,
        }));

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
      if (!commandObj)
        return message.channel.send(
          embeds.error(
            `The command \`${command}\` does not exist!`,
            `Invalid Command`
          )
        );

      try {
        for (const commandObj of client.commands.array()) {
          if (commandObj.disabled) continue;
          if (commandObj.cmdName.toLowerCase() === command) {
            commandObj.run.bind(modules)(
              client,
              message,
              args,
              userData,
              guildData,
              commandObj.cmdName
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
