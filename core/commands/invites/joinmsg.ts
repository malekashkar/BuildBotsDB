import Command from "..";
import Main from "../../structures/client";
import { Message } from "discord.js";
import { DbUser } from "../../models/user";
import { DbGuild } from "../../models/guild";
import embeds from "../../utils/embeds";

export default class InvitesJoinMessageCommand extends Command {
  cmdName = "invites joinmsg";
  description = "Set the server join message.";
  module = "invites";
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

    guildData.invites.join.message = msg;
    await guildData.save();

    return message.channel.send(
      embeds.normal(
        `Join Message Set`,
        `The join message has been set to \`\`\`${msg}\`\`\``
      )
    );
  }
}
