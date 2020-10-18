import { Message } from "discord.js";
import Command from "..";
import Main from "../../..";
import embeds from "../../utils/embeds";
import { stripIndents } from "common-tags";
import { DbUser } from "../../models/user";
import { DbGuild } from "../../models/guild";

export default class CreateOrderMessage extends Command {
  cmdName = "ordermessage";
  description = "Create the order message";
  groupName = "createBot";
  permissions = ["ADMIN"];

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild
  ) {
    const channel = message.mentions.channels.first();
    if (!channel)
      return message.channel.send(
        embeds.error(
          `Please provide the channel you would like to send the mesasge to!`,
          this.usage
        )
      );

    const msg = await channel.send(
      embeds.normal(
        `Create An Order`,
        stripIndents`React with the ✅ to create an order.\n\nModules Available\n\n:one: Moderation\n:two: Giveaways\n:three: Polls, Changelogs and Feedback\n:four: Levels & Leaderboard\n:five: Invite Tracker\n:six: Payments & Gateways\n:seven: Tickets & Support\n:eight: Commissioner\n:nine: Music\n:keycap_ten: Copyright Removal`
      )
    );

    if (!msg)
      return message.channel.send(
        embeds.error(
          `I am not able to send the order message into the channel ${channel}.`
        )
      );
    else msg.react("✅");

    guildData.createOrder.messageId = msg.id;
    await guildData.save();
  }
}
