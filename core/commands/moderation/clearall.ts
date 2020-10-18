import Command from "..";
import Main from "../../..";
import { Message } from "discord.js";
import embeds from "../../utils/embeds";
import confirmation from "../../utils/confirmation";

export default class ClearAllCommmand extends Command {
  cmdName = "clearall";
  description = "Clear all the mesasges in a specific channel.";
  groupName = "moderation";
  permissions = ["ADMIN"];

  async run(client: Main, message: Message) {
    const conf = await confirmation(
      `Clear All Messages`,
      `Are you sure you would like to clear this channel?`,
      message
    );

    if (!conf) return;

    let saved = message.channel.lastMessageID;
    const msg = await message.channel.messages.fetch(saved);
    if (msg.author.id === client.user.id && msg.deletable) msg.delete();

    do {
      let messages = await message.channel.messages.fetch({
        limit: 100,
        before: saved,
      });
      if (!messages.size) {
        saved = "0";
        message.channel.send(
          embeds.normal(
            `Clear All`,
            `The channel has been cleared by user ${message.author}`
          )
        );
      }

      saved = messages.last().id;
      messages = messages.filter((m) => !m.system);

      messages.forEach((m) => {
        if (m.deletable) m.delete({ timeout: 1000 });
      });
    } while (saved !== "0");
  }
}
