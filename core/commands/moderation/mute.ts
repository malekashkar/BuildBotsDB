import Command from "..";
import Main from "../../..";
import { Message } from "discord.js";
import embeds from "../../utils/embeds";
import { DbUser, UserModel } from "../../models/user";
import { DbGuild } from "../../models/guild";
import pretty from "pretty-ms";
import ms from "ms";

export default class ClearAllCommmand extends Command {
  cmdName = "mute";
  description = "Mute a user preventing them from talking anywhere.";
  usage: "<@user> [time]";
  module = "moderation";
  permission = "ADMIN";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
  ) {
    const targetUser = message.mentions.members.first();
    if (!targetUser)
      return message.channel.send(
        embeds.error(`Please mention user from the discord server!`, this.usage)
      );

    userData =
      (await UserModel.findOne({
        userId: targetUser.id,
      })) ||
      new UserModel({
        userId: targetUser.id,
      });

    const muteTime = args[1] ? (ms(args[1]) ? ms(args[1]) : false) : false;

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

    if (userData.muted || targetUser.roles.cache.has(muteRole.id))
      return message.channel.send(
        embeds.error(`The user ${targetUser} is already muted!`)
      );

    if (muteTime) {
      targetUser.roles.add(muteRole);
      userData.muted = {
        guild: message.guild.id,
        startedTime: Date.now(),
        muteTime,
      };
      await userData.save();
    } else {
      targetUser.roles.add(muteRole);
    }

    return message.channel.send(
      embeds.normal(
        `${targetUser.user.username} Muted`,
        `The user ${targetUser} has been muted${
          muteTime ? ` for **${pretty(muteTime)}**.` : `.`
        }`
      )
    );
  }
}
