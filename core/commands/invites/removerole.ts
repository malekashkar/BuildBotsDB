import Command from "..";
import Main from "../../../";
import { Message } from "discord.js";
import { DbUser } from "../../models/user";
import { DbGuild } from "../../models/guild";
import embeds from "../../utils/embeds";

export default class InvitesRemoveRoleCommand extends Command {
  cmdName = "invites removerole";
  description = "Remove a role from the invite rewards.";
  module = "invites";
  permission = "ADMIN";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
  ) {
    const role = message.mentions.roles.first();
    if (!role || !guildData.invites.roles.some((x) => x.role === role.id))
      return message.channel.send(
        embeds.error(`Please tag a valid invite role!`)
      );

    guildData.invites.roles = guildData.invites.roles.filter(
      (x) => x.role !== role.id
    );
    await guildData.save();

    return message.channel.send(
      embeds.normal(
        `Invite Role Removed`,
        `The role ${role} has been removed from the invite roles.`
      )
    );
  }
}
