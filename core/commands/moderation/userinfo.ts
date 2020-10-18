import Command from "..";
import Main from "../../..";
import { Message, MessageEmbed } from "discord.js";
import { DbUser, UserModel } from "../../models/user";
import { DbGuild } from "../../models/guild";
import moment from "moment";
import pretty from "pretty-ms";

export default class UserinfoCommand extends Command {
  cmdName = "userinfo";
  description = "Display the information of a user.";
  usage: "<@user>";
  groupName = "moderation";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
  ) {
    let targetUser = message.mentions.members.first();
    if (!targetUser) targetUser = message.member;

    userData =
      (await UserModel.findOne({
        userId: targetUser.id,
      })) ||
      new UserModel({
        userId: targetUser.id,
      });
    const muteData = userData.muted;

    return message.channel.send(
      new MessageEmbed()
        .setAuthor(targetUser.user.tag, targetUser.user.displayAvatarURL())
        .setDescription(`${targetUser}`)
        .setThumbnail(targetUser.user.displayAvatarURL())
        .addField(`Joined`, moment(targetUser.joinedAt).format("LLLL"), true)
        .addField(
          `Registered`,
          moment(targetUser.user.createdAt).format("LLLL"),
          true
        )
        .addField(
          `Roles`,
          targetUser.roles.cache
            .array()
            .map((x) => `${x}`)
            .join(" ")
        )
        .addField(
          `Warnings [${userData.warnings ? userData.warnings.length : `0`}]`,
          userData.warnings && userData.warnings.length
            ? userData.warnings
                .map(
                  (x) =>
                    `**Warned By:** <@${x.performerId}>\n**Reason:** \`${x.reason}\`\n`
                )
                .join("\n")
            : `This user has no warnings.`,
          true
        )
        .addField(
          `Mute Data`,
          muteData
            ? `${targetUser.user.username} got muted for **${pretty(
                muteData.muteTime
              )}**.`
            : `This user is not muted.`,
          true
        )
        .setFooter(`ID: ${targetUser.id}`)
        .setTimestamp()
        .setColor("RANDOM")
    );
  }
}
