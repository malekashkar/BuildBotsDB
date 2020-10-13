import {
  Message,
  MessageEmbed,
  CategoryChannel,
  TextChannel,
  GuildChannel,
} from "discord.js";
import confirmation from "../../utils/confirmation";
import Command from "..";
import Main from "../../..";
import { DbGuild } from "../../models/guild";
import { DbUser } from "../../models/user";
import embeds from "../../utils/embeds";
import { TicketModel } from "../../models/ticket";

export default class TicketCommand extends Command {
  cmdName = "tickets";
  groupName = "tickets";
  description = "Run one of the ticket commands.";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
    console.log(this);

    const options = ["create"];
    type Option = typeof options[number];
    const option = args[0]
      ? options.includes(args[0])
        ? (args[0] as Option)
        : null
      : null;

    (this as any)[option](client, message, args, userData, guildData, command);
  }

  async types(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
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

  async setclaim(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
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

  async repost(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
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

  async remove(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
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

  async joinmsg(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
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

    const joinMsg = args.slice(2).join(" ");
    if (!joinMsg)
      return message.channel.send(
        embeds.error(`Please provide the join message you would like to send.`)
      );

    const typeData = guildData.ticketTypes.find(
      (x) => x.name.toLowerCase() === type.toLowerCase()
    );
    typeData.joinMsg = joinMsg;
    await guildData.save();

    return message.channel.send(
      embeds.normal(
        `Join Message Edited`,
        `The new join message for ticket type \`${type}\` is \`\`\`${joinMsg}\`\`\``
      )
    );
  }

  async delete(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
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

  async create(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
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

  async close(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
    const ticketData = await TicketModel.findOne({
      channelId: message.channel.id,
    });
    if (!ticketData)
      return message.channel.send(`You may only do this in ticket channels!`);

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

    ticketData.closedBy = message.author.id;
    await ticketData.save();

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

  async category(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
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

  async add(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
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
