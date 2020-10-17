import Main from "../../";
import embeds from "../utils/embeds";
import Event from ".";

import { MessageReaction, TextChannel, User } from "discord.js";
import { GuildModel } from "../models/guild";
import { TicketModel } from "../models/ticket";

export default class claimTickets extends Event {
  name = "messageReactionAdd";

  async handle(client: Main, reaction: MessageReaction, user: User) {
    if (user.bot) return;
    if (reaction.message.partial) reaction.message.fetch();
    if (reaction.emoji.name !== "✅") return;

    const message = reaction.message;

    const settings = await GuildModel.findById(message.guild.id);
    if (!settings) return;

    const ticketData = await TicketModel.findOne({
      claimMsg: message.id,
    });
    if (!ticketData) return;

    const typeData = settings.ticketTypes.find(
      (x) => x.name === ticketData.ticketType
    );
    if (!typeData) return;

    await message.reactions.removeAll();
    await message.edit(
      embeds.normal(
        `Ticket Claimed`,
        `This ticket has been claimed by ${user.username}`
      )
    );

    const ticketChannel = client.channels.resolve(
      ticketData.channelId
    ) as TextChannel;
    if (!ticketChannel) {
      await user
        .send(
          embeds.error(
            `The ticket channel you just claimed seemed to be deleted.`
          )
        )
        .catch((e) => console.error);
      return;
    }

    ticketChannel.send(
      embeds.normal(
        `Staff Member Claimed`,
        `The user ${user} has claimed this ticket and will be helping you today!`
      )
    );

    ticketChannel.updateOverwrite(user, {
      VIEW_CHANNEL: true,
      SEND_MESSAGES: true,
      READ_MESSAGE_HISTORY: true,
    });

    ticketData.claimMsg = null;
    await ticketData.save();
  }
}
