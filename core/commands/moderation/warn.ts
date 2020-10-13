import embeds from "../../utils/embeds";
import Command from "..";
import Main from "../../..";
import { Message } from "discord.js";
import { DbUser, UserModel } from "../../models/user";
import { DbGuild } from "../../models/guild";
import { BanModel } from "../../models/ban";

export default class WarnCommand extends Command {
  cmdName = "warn";
  description = "Give a user a warning.";
  usage: "<@user> [reason]";
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

    args.shift();
    const reason = args.join(" ") ? args.join(" ") : `No reason provided.`;

    userData =
      (await UserModel.findOne({
        userId: targetUser.id,
      })) ||
      new UserModel({
        userId: targetUser.id,
      });

    userData.warnings.push({
      performerId: message.author.id,
      reason,
    });
    await userData.save();

    if (userData.warnings.length === 2) {
      let muteRole = message.guild.roles.cache.find(
        (x) => x.name === guildData.roles.mute
      );
      if (!muteRole) {
        try {
          muteRole = await message.guild.roles.create({
            data: {
              name: guildData.roles.mute,
              color: "RED",
            },
          });
          message.guild.channels.cache.forEach(async (channel) => {
            if (channel.type === "text") {
              await channel.updateOverwrite(muteRole, {
                SEND_MESSAGES: false,
                ADD_REACTIONS: false,
              });
            } else if (channel.type === "voice") {
              await channel.updateOverwrite(muteRole, {
                CONNECT: true,
                SPEAK: false,
              });
            }
          });
        } catch (e) {
          console.log(e.stack);
        }
      } else {
        message.guild.channels.cache.forEach(async (channel) => {
          if (channel.type === "text") {
            await channel.updateOverwrite(muteRole, {
              SEND_MESSAGES: false,
              ADD_REACTIONS: false,
            });
          } else if (channel.type === "voice") {
            await channel.updateOverwrite(muteRole, {
              CONNECT: true,
              SPEAK: false,
            });
          }
        });
      }

      if (!targetUser.roles.cache.has(muteRole.id))
        targetUser.roles.add(muteRole);
      userData.muted = {
        guild: message.guild.id,
        startedTime: Date.now(),
        muteTime: 24 * 60 * 60 * 1000,
      };

      message.channel.send(
        embeds.normal(
          `${targetUser.user.username} Tempmuted`,
          `The user ${targetUser} has been muted for **24 hours** because of their second warning.`
        )
      );
    } else if (userData.warnings.length === 3) {
      targetUser.kick();

      message.channel.send(
        embeds.normal(
          `${targetUser.user.username} Kicked`,
          `The user ${targetUser} has been kicked because of their third warning.`
        )
      );
    } else if (userData.warnings.length === 4) {
      targetUser.ban();
      new BanModel({
        _id: message.author.id,
        banTime: 7 * 24 * 60 * 60 * 1000,
      });

      message.channel.send(
        embeds.normal(
          `${targetUser.user.username} Tempbanned`,
          `The user ${targetUser} has been tempbanned for **7 days** because of their fourth warning.`
        )
      );
    } else if (userData.warnings.length === 5) {
      targetUser.ban();

      message.channel.send(
        embeds.normal(
          `${targetUser.user.username} Banned`,
          `The user ${targetUser} has been banned because of their fifth warning.`
        )
      );
    }

    return message.channel.send(
      embeds.normal(
        `${targetUser.user.username} Warned`,
        `The user ${targetUser} has been warned${
          reason !== `No reason provided.` ? ` for **${reason}**.` : `.`
        }`
      )
    );
  }
}
