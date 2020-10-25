import Command from "..";
import Main from "../../structures/client";
import { Message } from "discord.js";
import embeds from "../../utils/embeds";
import confirmation from "../../utils/confirmation";
import { InviteModel } from "../../models/invite";

export default class InvitesResetCommand extends Command {
  cmdName = "invites reset";
  description = "Reset the amount of invites a user has.";
  module = "invites";
  permission = "ADMIN";

  async run(client: Main, message: Message) {
    const user = message.mentions.users.first();
    if (!user)
      return message.channel.send(
        embeds.error(`Please mention the target user of this operation!`)
      );

    const conf = await confirmation(
      `Invites Reset Confirmation`,
      `Are you sure you would like to delete all of ${user}'s invites?`,
      message
    );

    if (!conf) return;

    await InviteModel.deleteMany({
      invitedId: user.id,
    });

    return message.channel.send(
      embeds.normal(
        `Invites Reset`,
        `The invites of user ${user} have been reset to \`0\`.`
      )
    );
  }
}
