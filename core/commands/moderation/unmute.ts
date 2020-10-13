import Command from "..";
import Main from "../../..";
import { Message } from "discord.js";
import embeds from "../../utils/embeds";
import { DbUser } from "../../models/user";
import { DbGuild } from "../../models/guild";

export default class UnmuteCommand extends Command {
  cmdName = "unmute";
  description = "Unmute a user which gives them back their access to speaking.";
  usage: "<@user>";
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

    const muteRole = message.guild.roles.cache.find(
      (x) => x.name === guildData.roles.mute
    );

    if (!muteRole)
      return message.channel.send(
        embeds.error(
          `Please run the mute command in order to create the mute role before unmuting.`
        )
      );
    else if (!targetUser.roles.cache.get(muteRole.id))
      return message.channel.send(
        embeds.error(`The user ${targetUser} is not muted!`)
      );

    userData.muted = null;
    await userData.save();
    targetUser.roles.remove(muteRole);

    return message.channel.send(
      embeds.normal(
        `${targetUser.user.username} Unmuted`,
        `The user ${targetUser} has been unmuted.`
      )
    );
  }
}
