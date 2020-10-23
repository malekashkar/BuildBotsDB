import Command from "..";
import Main from "../../../";
import { Message } from "discord.js";
import { DbUser } from "../../models/user";
import { DbGuild } from "../../models/guild";
import embeds from "../../utils/embeds";

export default class InvitesAddRoleCommand extends Command {
  cmdName = "invites addrole";
  description = "Add a role to the invite rewards.";
  module = "invites";
  permission = "ADMIN";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild
  ) {
    const role = message.mentions.roles.first();
    if (!role)
      return message.channel.send(
        embeds.error(`Please tag the role you would like to use!`)
      );

    const inviteAmount = args[2]
      ? !isNaN(parseInt(args[2]))
        ? parseInt(args[2])
        : false
      : false;
    if (!inviteAmount)
      return message.channel.send(
        embeds.error(`Please provide the amount of invites that is required!`)
      );

    guildData.invites.roles.push({
      role: role.id,
      invites: inviteAmount,
    });
    await guildData.save();

    return message.channel.send(
      embeds.normal(
        `Invite Role Added`,
        `The role ${role} is now an invite role with the requirement of \`${inviteAmount}\` invites.`
      )
    );
  }
}
