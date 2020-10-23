import { Message } from "discord.js";
import Command from "..";
import Main from "../../../";
import { DbGuild } from "../../models/guild";
import { DbUser } from "../../models/user";
import embeds from "../../utils/embeds";

export default class TicketsCommand extends Command {
  cmdName = "ticket create";
  description = "Create a new ticket type.";
  module = "tickets";
  permission = "ADMIN";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild
  ) {
    const name = args[1];
    if (!name)
      return message.channel.send(
        embeds.error(`Please provide a name for this new ticket type!`)
      );
    else if (
      guildData.ticketTypes.some(
        (x) => x.name.toLowerCase() === name.toLowerCase()
      )
    )
      return message.channel.send(
        embeds.error(
          `The name \`${name}\` is already used by another ticket type!`
        )
      );
    else if (
      guildData.ticketTypes.length &&
      guildData.ticketTypes.some((x) => x.panelChannelId === message.channel.id)
    )
      return message.channel.send(
        embeds.error(
          `This channel is already being used for another ticket type!`
        )
      );

    const panelMsg = await message.channel.send(
      embeds.normal(
        `Open a ${
          name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
        } ticket.`,
        `In order to open a **${name.toLowerCase()}** ticket, please click the 🎫 below.`
      )
    );
    panelMsg.react("🎫");

    guildData.ticketTypes.push({
      name,
      panelChannelId: message.channel.id,
      panelMessageId: panelMsg.id,
    });
    await guildData.save();

    const tempMsg = await message.channel.send(
      embeds.normal(
        `Ticket Type Created`,
        `The ticket type \`${name}\` has been created with a default panel channel of ${message.channel}.`
      )
    );

    if (tempMsg.deletable) tempMsg.delete({ timeout: 7000 });
  }
}
