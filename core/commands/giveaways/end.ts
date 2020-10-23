import { Message, MessageEmbed, TextChannel, User } from "discord.js";
import Command from "..";
import Main from "../../structures/client";
import { GiveawayModel } from "../../models/giveaway";
import embeds from "../../utils/embeds";
import _ from "lodash";

export default class GiveawayEndCommand extends Command {
  cmdName = "giveaways end";
  description = "End a currently running giveaway, and pick winners.";
  module = "giveaways";
  permission = "GIVEAWAY";

  async run(client: Main, message: Message, args: string[]) {
    const messageId = args[1];
    const giveawayData = await GiveawayModel.findOne({ messageId });
    if (!messageId || !giveawayData)
      return message.channel.send(
        embeds.error(`Please provide a valid giveaway message id!`)
      );

    if (giveawayData.status === "ended")
      return message.channel.send(
        embeds.error(
          `The giveaway with id \`${messageId}\` has already been ended!`
        )
      );

    const giveawayChannel = message.guild.channels.resolve(
      giveawayData.channelId
    ) as TextChannel;
    const giveawayMessage = await giveawayChannel.messages.fetch(
      giveawayData.messageId
    );

    const reactedUsers = giveawayMessage.reactions
      .resolve("🎉")
      .users.cache.array()
      .filter((x: User) => !x.bot);

    if (reactedUsers.length < giveawayData.winners)
      return message.channel.send(
        embeds.error(
          `Not enough people entered the giveaway in order to draw winners!`
        )
      );

    const winners = _.sampleSize(reactedUsers, giveawayData.winners);

    giveawayMessage.edit(
      `:tada: **GIVEAWAY ENDED** :tada:`,
      new MessageEmbed()
        .setColor("RANDOM")
        .setTitle(giveawayData.prize)
        .setDescription(
          `${giveawayData.winners > 1 ? `Winners` : `Winner`}: ${winners
            .map((x: User) => `<@${x.id}>`)
            .join(", ")}`
        )
        .setFooter(
          `${
            giveawayData.winners > 1 ? `${giveawayData.winners} Winners | ` : ``
          }Ended at`
        )
        .setTimestamp(Date.now())
    );

    giveawayChannel.send(
      `Congratulations ${winners
        .map((x: User) => `<@${x.id}>`)
        .join(", ")}! You${giveawayData.winners > 1 ? ` guys ` : ` `}won **${
        giveawayData.prize
      }**.\n${giveawayMessage.url}`
    );

    giveawayData.status = "ended";
    await giveawayData.save();

    const finalMsg = await message.channel.send(
      embeds.normal(
        `Giveaway Ended`,
        `The giveaway with id \`${messageId}\` has been ended!`
      )
    );

    finalMsg.delete({ timeout: 10 * 1000 });
  }
}
