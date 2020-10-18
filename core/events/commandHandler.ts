import Main from "../../";
import Command from "../commands";
import embeds from "../utils/embeds";
import logger from "../utils/logger";

import { Message } from "discord.js";
import { DbGuild, GuildModel } from "../models/guild";
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

      const commandObj = client.commands
        .array()
        .find((commandObj) =>
          cmdName.startsWith(commandObj.cmdName.toLowerCase())
        );
      if (!commandObj) {
        message.channel.send(
          embeds.error(
            `**No command was found** for message \`${
              message.content.length > 15
                ? message.content.slice(0, 15) + "..."
                : message.content
            }\`!`,
            `Invalid Command`
          )
        );
        return;
      }

      const command = commandObj.cmdName;
      args = args.join(" ").slice(command.length).trim().split(" ");

      if (commandObj.disabled) {
        message.channel.send(
          embeds.error(
            `The command \`${command}\` is currently **disabled**!`,
            `Disabled Command`
          )
        );
        return;
      }

      if (!(await checkPermission(message, commandObj.permission, guildData))) {
        message.channel.send(
          embeds.error(
            `You don't have the **right permissions** to run the command \`${command}\`!`,
            `No Permission`
          )
        );
        return;
      }

      commandObj
        .run(client, message, args, userData, guildData)
        .catch((err) => logger.error(`${command.toUpperCase()}_ERROR`, err));
    } catch (err) {
      logger.error("COMMAND_HANDLER", err);
    }
  }
}

async function checkPermission(
  message: Message,
  permission: string,
  guildData: DbGuild
) {
  if (
    permission.toLowerCase().includes("admin") &&
    !message.member.permissions.has("ADMINISTRATOR")
  )
    return false;
  else if (
    permission.toLowerCase().includes("owner") &&
    message.member.guild.owner !== message.member
  )
    return false;
  else if (permission.toLowerCase().includes("giveaway")) {
    let total = 0;
    if (guildData.giveaways.adminUsers.includes(message.author.id)) total++;
    for (let i = 0; i < guildData.giveaways.bypassRoles.length; i++) {
      for (let j = 0; j < message.member.roles.cache.size; j++) {
        if (
          guildData.giveaways.bypassRoles[i] ===
          message.member.roles.cache.array()[j].id
        )
          total++;
      }
    }
    if (total < 1) return false;
  }

  return true;
}
