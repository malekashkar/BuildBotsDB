import { Message, TextChannel } from "discord.js";
import confirmation from "../../utils/confirmation";
import Command from "..";
import Main from "../../../";
import embeds from "../../utils/embeds";
import { TicketModel } from "../../models/ticket";

export default class TicketsCommand extends Command {
  cmdName = "ticket close";
  description = "Close a ticket channel.";
  groupName = "tickets";

  async run(client: Main, message: Message) {
    const ticketData = await TicketModel.findOne({
      channelId: message.channel.id,
    });
    if (!ticketData)
      return message.channel.send(`You may only do this in ticket channels!`);
    else
      await TicketModel.deleteOne({
        channelId: message.channel.id,
      });

    const conf = await confirmation(
      `Close Confirmation`,
      `Are you sure you would like to close this channel?`,
      message
    );

    if (!conf)
      return message.channel.send(
        embeds.normal(
          `Close Cancelled`,
          `The close process has been cancelled.`
        )
      );

    message.channel.send(
      embeds.normal(`Warning`, `This ticket is closing in 10 seconds.`)
    );

    setTimeout(async () => {
      if ((message.channel as TextChannel).deletable) message.channel.delete();
      await TicketModel.deleteOne({
        channelId: message.channel.id,
      });
    }, 10 * 1000);
  }
}
