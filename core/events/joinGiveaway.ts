import Main from "../../";
import embeds from "../utils/embeds";
import Event from ".";

import { MessageReaction, User } from "discord.js";
import { UserModel } from "../models/user";
import { GuildModel } from "../models/guild";
import { GiveawayModel } from "../models/giveaway";
import { InviteModel } from "../models/invite";

export default class joinGiveaway extends Event {
  name = "messageReactionAdd";

  async handle(client: Main, reaction: MessageReaction, user: User) {
    if (user.bot) return;
    if (reaction.message.partial) reaction.message.fetch();
    if (reaction.emoji.name !== "🎉") return;

    const message = reaction.message;
    const member = message.guild.members.resolve(user.id);

    const guldData = await GuildModel.findById(message.guild.id);
    if (!guldData) return;

    const userData =
      (await UserModel.findOne({
        userId: user.id,
      })) ||
      new UserModel({
        userId: user.id,
      });

    const giveawayData = await GiveawayModel.findOne({
      messageId: message.id,
    });
    if (!giveawayData) return;

    if (giveawayData.condition.requiredRoles.length) {
      for (let i = 0; i < giveawayData.condition.requiredRoles.length; i++) {
        if (!member.roles.cache.has(giveawayData.condition.requiredRoles[i])) {
          const role = message.guild.roles.resolve(
            giveawayData.condition.requiredRoles[i]
          );
          if (!role) continue;

          user.send(
            embeds.error(
              `In order to join the giveaway **${giveawayData.prize}**, you need the **${role.name}** role.`
            )
          );
          reaction.users.remove(user);
          return;
        }
      }
    }

    if (giveawayData.condition.requiredGuilds.length) {
      for (let i = 0; i < giveawayData.condition.requiredGuilds.length; i++) {
        const guild = client.guilds.resolve(
          giveawayData.condition.requiredGuilds[i]
        );
        if (!guild) continue;

        if (!guild.members.resolve(user.id)) {
          user.send(
            embeds.error(
              `In order to join the giveaway **${giveawayData.prize}**, you need to be in the **${guild.name}** server.`
            )
          );
          reaction.users.remove(user);
          return;
        }
      }
    }

    if (giveawayData.condition.requiredInvites) {
      const invites = await InviteModel.find({
        inviterId: user.id,
      });

      if (invites.length < giveawayData.condition.requiredInvites) {
        user.send(
          embeds.error(
            `In order to join the giveaway for **${
              giveawayData.prize
            }**, you need **${
              giveawayData.condition.requiredInvites - invites.length
            }** more invites.`
          )
        );
        reaction.users.remove(user);
        return;
      }
    }

    if (giveawayData.condition.requiredMessages) {
      if (userData.totalMessages < giveawayData.condition.requiredMessages) {
        user.send(
          embeds.error(
            `In order to join the giveaway for **${
              giveawayData.prize
            }**, you need **${
              giveawayData.condition.requiredMessages - userData.totalMessages
            }** more messages.`
          )
        );
        reaction.users.remove(user);
        return;
      }
    }

    user.send(
      embeds.normal(
        `Giveaway Entered`,
        `You have successfully entered the giveaway for **${giveawayData.prize}**.`
      )
    );
  }
}
