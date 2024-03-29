import Command from "..";
import { Message, MessageEmbed } from "discord.js";
import { getLevel, xpUntilNextLevel } from "../../utils/levels";
import { DbUser } from "../../models/user";
import Main from "../../structures/client";
import { UserModel } from "../../models/user";

export default class Commmand extends Command {
  cmdName = "level";
  description = "Check your own or another users level information.";
  usage = "[@user]";
  module = "levels";

  async run(client: Main, message: Message, args: string[], userData: DbUser) {
    const user = message.mentions.users.first() || message.author;
    if (user !== message.author)
      userData = await UserModel.findOne({
        userId: user.id,
      });
    const xp =
      userData && userData.leveling && userData.leveling.xp
        ? userData.leveling.xp
        : 0;

    return message.channel.send(
      new MessageEmbed()
        .setTitle(`Level Information`)
        .addFields(
          {
            name: `Current XP`,
            value: xp + "XP",
            inline: true,
          },
          {
            name: `Current Level`,
            value: `Level ` + getLevel(xp),
            inline: true,
          },
          {
            name: `XP Until Next Level`,
            value: xpUntilNextLevel(xp) + `XP`,
            inline: true,
          }
        )
        .setColor("RANDOM")
        .setTimestamp()
    );
  }
}
