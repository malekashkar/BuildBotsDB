import { Message } from "discord.js";
import Command from "..";
import Main from "../../structures/client";
import embeds from "../../utils/embeds";
import { stripIndents } from "common-tags";
import { DbUser } from "../../models/user";
import { DbGuild } from "../../models/guild";

export default class CreateOrderMessage extends Command {
  cmdName = "ordermessage";
  description = "Create the order message";
  module = "createBot";
  permission = "ADMIN";

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
    msg.react("✅");

    guildData.createOrder.messageId = msg.id;
    if (!guildData.createOrder.categoryId) {
      guildData.createOrder.categoryId = (
        await message.guild.channels.create(`Order Tickets`, {
          type: "category",
        })
      ).id;
    }
    await guildData.save();
  }
}
