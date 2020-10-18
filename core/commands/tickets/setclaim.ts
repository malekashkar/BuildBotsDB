import { Message } from "discord.js";
import Command from "..";
import Main from "../../../";
import { DbGuild } from "../../models/guild";
import { DbUser } from "../../models/user";
import embeds from "../../utils/embeds";

export default class TicketsCommand extends Command {
  cmdName = "ticket setclaim";
  description = "Set the claim channel for a specific ticket type.";
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
    typeData.claimChannelId = message.channel.id;
    await guildData.save();

    return message.channel.send(
      embeds.normal(
        `Claim Channel Edited`,
        `The new claim channel for ticket type \`${type}\` is ${message.channel}`
      )
    );
  }
}
