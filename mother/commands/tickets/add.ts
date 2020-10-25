import { Message, TextChannel } from "discord.js";
import Command from "..";
import Main from "../../structures/client";
import embeds from "../../utils/embeds";
import { TicketModel } from "../../models/ticket";

export default class TicketsCommand extends Command {
  cmdName = "ticket add";
  description = "Add someone to your ticket channel.";
  module = "tickets";

  async run(client: Main, message: Message) {
    const ticketData = await TicketModel.findOne({
      channelId: message.channel.id,
    });
    if (!ticketData)
      return message.channel.send(`You may only do this in ticket channels!`);

    const member = message.mentions.members.first();
    if (!member)
      return message.channel.send(
        embeds.error(`Please remember to tag the target user!`)
      );

    if (
      member.permissionsIn(message.channel).has("VIEW_CHANNEL") &&
      member.permissionsIn(message.channel).has("SEND_MESSAGES")
    )
      return message.channel.send(
        embeds.error(`The user ${member} already has access to this channel!`)
      );

    (message.channel as TextChannel).updateOverwrite(member, {
      VIEW_CHANNEL: true,
      SEND_MESSAGES: true,
      READ_MESSAGE_HISTORY: true,
    });

    return message.channel.send(
      embeds.normal(
        `User Added`,
        `The user ${member} has been added to the ticket.`
      )
    );
  }
}
