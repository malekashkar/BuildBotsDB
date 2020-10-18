import Command from "..";
import Main from "../../../";
import { Message } from "discord.js";
import { DbUser } from "../../models/user";
import { DbGuild } from "../../models/guild";
import embeds from "../../utils/embeds";

export default class InvitesLeaveChannelCommand extends Command {
  cmdName = "invites leavechannel";
  description = "Set the server leave message channel.";
  groupName = "invites";
  permissions = ["ADMIN"];

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild
  ) {
    const channel = message.mentions.channels.first();
    if (!channel)
      return message.channel.send(
        embeds.error(`Please mention the channel you would like to set.`)
      );

    guildData.invites.leave.channel = channel.id;
    await guildData.save();

    return message.channel.send(
      embeds.normal(
        `Leave Channel Set`,
        `All leave messages will now be sent to ${channel}.`
      )
    );
  }
}
