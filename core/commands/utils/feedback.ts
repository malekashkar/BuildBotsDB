import embeds from "../../utils/embeds";
import Command from "..";
import { Message } from "discord.js";
import Main from "../../..";

export default class FeedbackCommmand extends Command {
  cmdName = "feedback";
  description = "Create a message on your server to receive feedback.";
  groupName = "utility";

  async run(client: Main, message: Message) {
    const msg = await message.channel.send(
      embeds.normal(
        `Feedback Message`,
        `Please react below depending on how you feel on this server reputation wise, community wise, and just in general.`
      )
    );

    msg.react("✅");
    msg.react("❌");
  }
}
