import { Message, TextChannel } from "discord.js";
import Command from "..";
import Main from "../../../";
import { DbGuild } from "../../models/guild";
import { DbUser } from "../../models/user";
import embeds from "../../utils/embeds";

export default class TicketsCommand extends Command {
  cmdName = "ticket repost";
  description = "Report the ticket panel to a specific ticket type.";
  groupName = "tickets";
  permission = "ADMIN";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild
  ) {
    const type = args[1];
    if (!type)
      return message.channel.send(
        embeds.error(`Please provide the type of ticket you want to change.`)
      );
    else if (
      !guildData.ticketTypes.length ||
      !guildData.ticketTypes.some(
        (x) => x.name.toLowerCase() === type.toLowerCase()
      )
    )
      return message.channel.send(
        embeds.error(`The name \`${type}\` is not a ticket type!`)
      );

    const typeData = guildData.ticketTypes.find(
      (x) => x.name.toLowerCase() === type.toLowerCase()
    );

    const oldPanelMsg = client.channels.resolve(typeData.panelChannelId)
      ? (client.channels.resolve(
          typeData.panelChannelId
        ) as TextChannel).messages.resolve(typeData.panelMessageId)
      : false;
    if (oldPanelMsg && oldPanelMsg.deletable) oldPanelMsg.delete();

    const channel = client.channels.resolve(
      typeData.panelChannelId
    ) as TextChannel;
    const panelMsg = await channel.send(
      embeds.normal(
        `Open a ${
          type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
        } ticket.`,
        `In order to open a **${type.toLowerCase()}** ticket, please click the 🎫 below.`
      )
    );
    panelMsg.react("🎫");

    typeData.panelMessageId = panelMsg.id;
    await guildData.save();
  }
}
