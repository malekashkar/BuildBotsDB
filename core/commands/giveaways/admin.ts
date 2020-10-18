import { Message } from "discord.js";
import Command from "..";
import Main from "../../..";
import { DbGuild } from "../../models/guild";
import { DbUser } from "../../models/user";
import embeds from "../../utils/embeds";

export default class GiveawayAdminCommand extends Command {
  cmdName = "giveaways admin";
  description = "Give a user access to admin giveaway commands.";
  groupName = "giveaways";
  permission = "ADMIN";
  
  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild
  ) {
    const user = message.mentions.users.first();
    if (!user)
      return message.channel.send(
        embeds.error(
          `Please mention the user you would like to give admin giveaway perms to!`
        )
      );

    if (guildData.giveaways.adminUsers.includes(user.id)) {
      guildData.giveaways.adminUsers = guildData.giveaways.adminUsers.filter(
        (x: string) => x !== user.id
      );
      await guildData.save();

      return await message.channel.send(
        embeds.normal(
          `Admin Removed`,
          `I have taken away giveaway admin perms from ${user}.`
        )
      );
    } else {
      guildData.giveaways.adminUsers.push(user.id);
      await guildData.save();

      return await message.channel.send(
        embeds.normal(
          `Admin Added`,
          `I have given ${user} giveaway admin permissions.`
        )
      );
    }
  }
}
