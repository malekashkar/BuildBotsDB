import { Message } from "discord.js";
import Command from "..";
import Main from "../../..";
import embeds from "../../utils/embeds";
import pretty from "pretty-ms";
import ms from "ms";
import { BanModel } from "../../models/ban";

export default class BanCommand extends Command {
  cmdName = "ban";
  description = "Ban a user from your discord server.";
  usage = "<@user>";
  groupName = "moderation";

  async run(client: Main, message: Message, args: string[]) {
    const targetUser = message.mentions.members.first();
    if (!targetUser)
      return message.channel.send(
        embeds.error(`Please mention user from the discord server!`, this.usage)
      );

    const banTime = args[1] ? ms(args[1]) : false;

    if (banTime) {
      targetUser.ban();
      new BanModel({
        _id: message.author.id,
        banTime,
      });
    } else {
      targetUser.ban();
    }

    return message.channel.send(
      embeds.normal(
        `${targetUser.user.username} Banned`,
        `The user ${targetUser} has been banned${
          banTime ? ` for **${pretty(banTime)}**.` : `.`
        }`
      )
    );
  }
}
