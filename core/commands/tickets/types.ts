import { Message, MessageEmbed, CategoryChannel } from "discord.js";
import Command from "..";
import Main from "../../structures/client";
import { DbGuild } from "../../models/guild";
import { DbUser } from "../../models/user";
import embeds from "../../utils/embeds";

export default class TicketsCommand extends Command {
  cmdName = "ticket types";
  description = "Get a list of all the ticket types.";
  module = "tickets";
  permission = "ADMIN";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild
  ) {
    if (!guildData.ticketTypes.length)
      return message.channel.send(
        embeds.error(`You don't have any ticket types created right now!`)
      );

    const embed = new MessageEmbed()
      .setTitle(`Ticket Types`)
      .setDescription(`Below is a list of all the current ticket types.`)
      .setColor("RANDOM")
      .setTimestamp();
    for (const typeInfo of guildData.ticketTypes) {
      const panelChannel =
        client.channels.resolve(typeInfo.panelChannelId) || `N/A`;
      const category = client.channels.resolve(typeInfo.categoryId)
        ? (client.channels.resolve(typeInfo.categoryId) as CategoryChannel).name
        : `N/A`;
      const claimChannel =
        client.channels.resolve(typeInfo.claimChannelId) || `N/A`;

      embed.addField(
        typeInfo.name,
        `Panel Channel: ${panelChannel}\nCategory Name: ${category}\nTicket Claim Channel: ${claimChannel}`
      );
    }
    return message.channel.send(embed);
  }
}
