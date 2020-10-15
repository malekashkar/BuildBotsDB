import Main from "../../";
import moment from "moment";
import embeds from "../utils/embeds";

import { MessageReaction, TextChannel, User } from "discord.js";
import { MessageEmbed } from "discord.js";
import { GuildModel } from "../models/guild";
import { TicketModel } from "../models/ticket";

export default class createTicket {
  name = "messageReactionAdd";

  async handle(client: Main, reaction: MessageReaction, user: User) {
    if (user.bot) return;
    if (reaction.message.partial) reaction.message.fetch();
    if (reaction.emoji.name !== "🎫") return;

    const message = reaction.message;
    reaction.users.remove(user);

    const settings = await GuildModel.findById(message.guild.id);
    if (!settings) return;

    const tickets = await TicketModel.find({
      openedFor: user.id,
    });
    if (tickets.length === 3) return;

    const typeData = settings.ticketTypes.find(
      (x) => x.panelMessageId === message.id
    );
    if (!typeData) return;

      console.log(user.id)

    const channel = await message.guild.channels.create(
      `${user.username}-ticket`,
      {
        type: "text",
        permissionOverwrites: [
          {
            id: user.id,
            allow: ["SEND_MESSAGES", "READ_MESSAGE_HISTORY", "VIEW_CHANNEL"],
          },
          {
            id: message.guild.roles.everyone,
            deny: "VIEW_CHANNEL",
          },
        ],
      }
    );

    if (typeData.categoryId) channel.setParent(typeData.categoryId);
    await channel.send(
      embeds.normal(
        `${
          typeData.name.charAt(0).toUpperCase() +
          typeData.name.slice(1).toLowerCase()
        } Ticket`,
        typeData.joinMsg
      )
    );

    const ticketData = new TicketModel({
      ticketType: typeData.name,
      channelId: channel.id,
      openedFor: user.id,
    });

    if (typeData.claimChannelId) {
      const claimChannel = client.channels.resolve(
        typeData.claimChannelId
      ) as TextChannel;
      if (!claimChannel) return;

      const claimMsg = await claimChannel.send(
        new MessageEmbed()
          .setTitle(`Claim This Ticket`)
          .setColor(`RANDOM`)
          .setDescription(
            `Who would like to claim the ticket with the info below?`
          )
          .addFields(
            {
              name: `Ticket Type`,
              value: typeData.name,
              inline: true,
            },
            {
              name: `Time Opened`,
              value: moment(Date.now()).format("LLL"),
              inline: true,
            },
            {
              name: `Opened By`,
              value: user.tag,
              inline: true,
            }
          )
      );

      claimMsg.react("✅");

      ticketData.claimMsg = claimMsg.id;
      await ticketData.save();
    }
  }
}
