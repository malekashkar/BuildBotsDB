import { Message, TextChannel } from "discord.js";
import Command from "..";
import Main from "../../..";
import { GiveawayModel } from "../../models/giveaway";
import embeds from "../../utils/embeds";

export default class GiveawayStopCommand extends Command {
  cmdName = "giveaways stop";
  description = "Stop one of the currently active giveaways, and don't pick winners.";
  groupName = "giveaways";
  permission = "GIVEAWAY";

  async run(client: Main, message: Message, args: string[]) {
    const messageId = args[1];
    const giveawayData = await GiveawayModel.findOne({ messageId });
    if (!messageId || !giveawayData)
      return message.channel.send(
        embeds.error(`Please provide a valid giveaway message id!`)
      );

    const giveawayMessage = await (message.guild.channels.resolve(
      giveawayData.channelId
    ) as TextChannel).messages.fetch(giveawayData.messageId);

    giveawayMessage.delete();
    GiveawayModel.deleteOne({ messageId });

    const finalMsg = await message.channel.send(
      embeds.normal(
        `Giveaway Stopped`,
        `The giveaway with id \`${messageId}\` has been stopped/deleted!`
      )
    );

    finalMsg.delete({ timeout: 10 * 1000 });
  }
}
