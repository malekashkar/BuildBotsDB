import Command from "..";
import Main from "../../..";
import { Message } from "discord.js";
import embeds from "../../utils/embeds";
import { DbUser } from "../../models/user";
import { DbGuild } from "../../models/guild";

export default class UnwarnCommand extends Command {
  cmdName = "unwarn";
  description = "Remove a users last warning.";
  usage: "<@user>";
  module = "moderation";
  permission = "ADMIN";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
  ) {
    const targetUser = message.mentions.members.first();
    if (!targetUser)
      return message.channel.send(
        embeds.error(`Please mention user from the discord server!`, this.usage)
      );

    const lastWarning = userData.warnings.pop();
    await userData.save();

    return message.channel.send(
      embeds.normal(
        `${targetUser.user.username} Unwarned`,
        `The user ${targetUser} has been unwarned.\nThe warning reason: ${lastWarning.reason}`
      )
    );
  }
}
