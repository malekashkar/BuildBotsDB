import Command from "..";
import Main from "../../structures/client";
import { Message, MessageEmbed } from "discord.js";
import { DbUser } from "../../models/user";
import { DbGuild } from "../../models/guild";

export default class InvitesRolesCommand extends Command {
  cmdName = "invites roles";
  description = "Check the current invite roles available.";
  module = "invites";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild
  ) {
    const embed = new MessageEmbed()
      .setTitle(`Invite Roles`)
      .setDescription(
        guildData.invites.roles.length
          ? `Below are the invite roles currently available.`
          : `There are no invite roles available currently.`
      )
      .setColor("RANDOM")
      .setTimestamp();

    for (let roleInfo of guildData.invites.roles) {
      const role = message.guild.roles.resolve(roleInfo.role);
      if (!role) {
        guildData.invites.roles = guildData.invites.roles.filter(
          (x) => x.role !== roleInfo.role
        );
        await guildData.save();
        continue;
      }

      embed.addField(role.name, roleInfo.invites, true);
    }

    return message.channel.send(embed);
  }
}
