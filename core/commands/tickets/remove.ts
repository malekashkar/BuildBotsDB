import { Message, GuildChannel } from "discord.js";
import Command from "..";
import Main from "../../structures/client";
import embeds from "../../utils/embeds";
import { TicketModel } from "../../models/ticket";

export default class TicketsCommand extends Command {
  cmdName = "ticket remove";
  description = "Remove someone from your ticket channel.";
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

    if (!member.permissionsIn(message.channel).has("VIEW_CHANNEL"))
      return message.channel.send(
        embeds.error(`The user ${member} doesn't have access to this channel!`)
      );

    (message.channel as GuildChannel).updateOverwrite(member, {
      VIEW_CHANNEL: false,
    });

    return message.channel.send(
      embeds.normal(
        `User Removed`,
        `The user ${member} has been removed from the ticket.`
      )
    );
  }
}
