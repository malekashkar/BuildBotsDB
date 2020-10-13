import Command from "..";
import Main from "../../..";
import { Message } from "discord.js";
import embeds from "../../utils/embeds";

export default class ClearAllCommmand extends Command {
  cmdName = "kick";
  description = "Kick a user from the discord server.";
  usage: "<@user>";
  groupName = "moderation";

  async run(client: Main, message: Message) {
    const targetUser = message.mentions.members.first();
    if (!targetUser)
      return message.channel.send(
        embeds.error(`Please mention user from the discord server!`, this.usage)
      );

    targetUser.kick();

    return message.channel.send(
      embeds.normal(
        `${targetUser.user.username} Kicked`,
        `The user ${targetUser} has been kicked.`
      )
    );
  }
}
