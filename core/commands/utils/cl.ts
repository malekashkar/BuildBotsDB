import embeds from "../../utils/embeds";
import Command from "..";
import { Message } from "discord.js";
import Main from "../../..";

export default class ClCommand extends Command {
  cmdName = "cl";
  description = "Create a change-log update.";
  usage = "<update amt> <title>";
  groupName = "utility";
  permission = "ADMIN";

  async run(client: Main, message: Message, args: string[]) {
    const amount = args[0]
      ? !isNaN(parseInt(args[0])) && parseInt(args[0]) < 24
        ? parseInt(args[0])
        : false
      : false;
    if (!amount)
      return message.channel.send(
        embeds.error(`Please provide an amount of updates.`, this.usage)
      );

    const title = args.splice(1).join(" ");
    if (!title)
      return message.channel.send(
        embeds.error(
          `Please make sure to provide a title for the change-log.`,
          this.usage
        )
      );

    const updates = [];
    for (let i = 0; i < amount; i++) {
      const question = await message.channel.send(
        embeds.question(`What would you like update #${i + 1} to be?`)
      );
      const update = await message.channel.awaitMessages(
        (x) => x.author.id === message.author.id,
        { max: 1, time: 900000, errors: ["time"] }
      );

      if (!update)
        return message.channel.send(
          embeds.error(
            `Update #${i + 1} was not provided, so the process has been ended.`
          )
        );

      if (question.deletable) question.delete();
      if (update.first().deletable) update.first().delete();
      updates.push(update.first().content);
    }

    return message.channel.send(
      embeds.normal(
        `Change-Log Updates | ${title}`,
        updates.map((x, i) => `${i + 1}. ${x}`).join("\n")
      )
    );
  }
}
