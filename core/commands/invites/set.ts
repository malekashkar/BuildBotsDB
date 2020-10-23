import Command from "..";
import Main from "../../../";
import { Message } from "discord.js";
import embeds from "../../utils/embeds";
import confirmation from "../../utils/confirmation";
import { InviteModel } from "../../models/invite";

export default class InvitesSetCommand extends Command {
  cmdName = "invites set";
  description = "Set the amount of invites a user has.";
  module = "invites";
  permission = "ADMIN";

  async run(client: Main, message: Message, args: string[]) {
    const user = message.mentions.users.first();
    if (!user)
      return message.channel.send(
        embeds.error(`Please mention the target user of this operation!`)
      );

    const amount = args[2]
      ? !isNaN(parseInt(args[2]))
        ? parseInt(args[2])
        : false
      : false;
    if (!amount)
      return message.channel.send(
        embeds.error(
          `Please provide the number of invites you would like to give them!`
        )
      );

    const conf = await confirmation(
      `Invites Set Confirmation`,
      `Are you sure you would like to give ${user}'s \`${amount}\` invites?`,
      message
    );

    if (!conf) return;

    const currentInvites = await InviteModel.find({
      inviterId: user.id,
    });

    if (amount <= currentInvites.length)
      return message.channel.send(
        embeds.error(`${user} already has ${amount} or more invites!`)
      );

    for (let i = 0; i < amount - currentInvites.length; i++) {
      new InviteModel({
        inviterId: user.id,
      });
    }

    return message.channel.send(
      embeds.normal(
        `Invites Set`,
        `The invites of user ${user} have been set to \`${amount}\`.`
      )
    );
  }
}
