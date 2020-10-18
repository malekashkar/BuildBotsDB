import Command from "..";
import Main from "../../../";
import { Message } from "discord.js";
import { DbUser } from "../../models/user";
import { DbGuild } from "../../models/guild";
import embeds from "../../utils/embeds";

export default class InvitesLeaveMessageCommand extends Command {
  cmdName = "invites leavemsg";
  description = "Set the server leave message.";
  groupName = "invites";
  permission = "ADMIN";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild
  ) {
    const msg = args.join(" ");
    if (!msg)
      return message.channel.send(
        embeds.error(`Please type the message you would like to use.`)
      );

    guildData.invites.leave.message = msg;
    await guildData.save();

    return message.channel.send(
      embeds.normal(
        `Leave Message Set`,
        `The leave message has been set to \`\`\`${msg}\`\`\``
      )
    );
  }
}
