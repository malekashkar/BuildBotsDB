import Command from "..";
import Main from "../../..";
import { Message } from "discord.js";
import embeds from "../../utils/embeds";
import { DbUser } from "../../models/user";
import { DbGuild } from "../../models/guild";
import pretty from "pretty-ms";
import ms from "ms";
import { BanModel } from "../../models/ban";

export default class TempBanCommand extends Command {
  cmdName = "tempban";
  description = "Temporarily ban a user from the discord server.";
  usage: "<@user> <time>";
  groupName = "moderation";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
    const targetUser = message.mentions.members.first();
    if (!targetUser)
      return message.channel.send(
        embeds.error(`Please mention user from the discord server!`, this.usage)
      );

    const banTime = args[1] ? ms(args[1]) : false;
    if (!banTime)
      return message.channel.send(
        embeds.error(
          `Please provide the time you would like to tempban ${targetUser} for!`,
          this.usage
        )
      );

    targetUser.ban();
    new BanModel({
      _id: message.author.id,
      banTime,
    });

    return message.channel.send(
      embeds.normal(
        `${targetUser.user.username} Tempbanned`,
        `The user ${targetUser} has been tempbanned for **${pretty(banTime)}**.`
      )
    );
  }
}
