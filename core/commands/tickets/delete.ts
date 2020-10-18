import { Message, TextChannel } from "discord.js";
import Command from "..";
import Main from "../../../";
import { DbGuild } from "../../models/guild";
import { DbUser } from "../../models/user";
import embeds from "../../utils/embeds";

export default class TicketsCommand extends Command {
  cmdName = "ticket delete";
  description = "Delete one of the ticket types.";
  groupName = "tickets";
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
        embeds.error(
          `Please provide a name of the ticket type you would like to delete!`
        )
      );
    else if (
      !guildData.ticketTypes.length ||
      !guildData.ticketTypes.some(
        (x) => x.name.toLowerCase() === name.toLowerCase()
      )
    )
      return message.channel.send(
        embeds.error(`There is no ticket type with the name \`${name}\`!`)
      );

    const typeData = guildData.ticketTypes.find(
      (x) => x.name.toLowerCase() === name.toLowerCase()
    );
    const panelMessage = client.channels.resolve(typeData.panelChannelId)
      ? (client.channels.resolve(
          typeData.panelChannelId
        ) as TextChannel).messages.resolve(typeData.panelMessageId)
      : false;
    if (panelMessage && panelMessage.deletable) panelMessage.delete();

    guildData.ticketTypes = guildData.ticketTypes.filter((x) => x !== typeData);
    await guildData.save();

    message.channel.send(
      embeds.normal(
        `Ticket Type Deleted`,
        `The ticket type \`${name}\` has been deleted.`
      )
    );
  }
}
