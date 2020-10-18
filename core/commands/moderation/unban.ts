import Command from "..";
import Main from "../../..";
import { Message } from "discord.js";
import embeds from "../../utils/embeds";
import { DbUser } from "../../models/user";
import { DbGuild } from "../../models/guild";
import { BanModel } from "../../models/ban";

export default class UnbanCommand extends Command {
  cmdName = "unban";
  description = "Unban a user from the discord server.";
  usage: "<user>";
  groupName = "moderation";
  permissions = ["ADMIN"];

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
    const targetUser = args[0];
    if (!targetUser)
      return message.channel.send(
        embeds.error(`Please provide the user tag or ID!`, this.usage)
      );

    const bannedUsers = await message.guild.fetchBans();
    if (!bannedUsers.size)
      return message.channel.send(
        embeds.error(`There are no banned members in this server!`)
      );

    const user = bannedUsers.find(
      (user) =>
        user.user.id === targetUser ||
        user.user.username === targetUser ||
        user.user.username + "#" + user.user.discriminator === targetUser
    );

    if (!user)
      return message.channel.send(
        embeds.error(`The user ${targetUser} is not banned!`)
      );

    const banData = await BanModel.findById(user.user.id);
    if (banData) await BanModel.deleteOne({ _id: user.user.id });

    message.guild.members.unban(user.user.id);
    return message.channel.send(
      embeds.normal(
        `${user.user.username} Unbanned`,
        `The user ${user.user.username} has been unbanned!`
      )
    );
  }
}
