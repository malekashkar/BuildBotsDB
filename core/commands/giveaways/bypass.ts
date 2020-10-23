import { Message } from "discord.js";
import Command from "..";
import Main from "../../structures/client";
import { DbGuild } from "../../models/guild";
import { DbUser } from "../../models/user";
import embeds from "../../utils/embeds";

export default class GiveawayBypassCommand extends Command {
  cmdName = "giveaways bypass";
  description = "Give a role access to admin giveaway commands.";
  module = "giveaways";
  permission = "ADMIN";
  
  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild
  ) {
    const role = message.mentions.users.first();
    if (!role)
      return message.channel.send(
        embeds.error(
          `Please mention the role you would like to give admin giveaway perms to!`
        )
      );

    if (guildData.giveaways.bypassRoles.includes(role.id)) {
      guildData.giveaways.bypassRoles = guildData.giveaways.bypassRoles.filter(
        (x: string) => x !== role.id
      );
      await guildData.save();

      return await message.channel.send(
        embeds.normal(
          `Admin Role Removed`,
          `I have taken away giveaway admin perms from ${role}.`
        )
      );
    } else {
      guildData.giveaways.bypassRoles.push(role.id);
      await guildData.save();

      return await message.channel.send(
        embeds.normal(
          `Admin Role Added`,
          `I have given ${role} giveaway admin permissions.`
        )
      );
    }
  }
}
