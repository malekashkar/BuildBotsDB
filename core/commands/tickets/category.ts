import { Message } from "discord.js";
import Command from "..";
import Main from "../../../";
import { DbGuild } from "../../models/guild";
import { DbUser } from "../../models/user";
import embeds from "../../utils/embeds";

export default class TicketsCommand extends Command {
  cmdName = "ticket category";
  description = "Set the category for a specific ticket type.";
  module = "tickets";
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

    const categoryName = args[2];
    if (!categoryName)
      return message.channel.send(
        embeds.error(
          `Please provide the name of the category you would like to assign.`
        )
      );
    const category = message.guild.channels.cache.find(
      (x) =>
        x.name.toLowerCase().includes(categoryName.toLowerCase()) &&
        x.type === "category"
    );
    if (!category)
      return message.channel.send(
        embeds.error(
          `I wasn't able to find any categories with the name \`${categoryName}\`.`
        )
      );

    const typeData = guildData.ticketTypes.find(
      (x) => x.name.toLowerCase() === type.toLowerCase()
    );
    typeData.categoryId = category.id;
    await guildData.save();

    return message.channel.send(
      embeds.normal(
        `Category Assigned`,
        `The ticket type \`${type}\` is not set to create tickets in the category \`${category.name}\`.`
      )
    );
  }
}
