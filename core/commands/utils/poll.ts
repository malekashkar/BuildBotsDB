import embeds from "../../utils/embeds";
import Command from "..";
import { Message, MessageEmbed } from "discord.js";
import { emojis } from "../../utils/storage";
import Main from "../../..";

export default class PollCommmand extends Command {
  cmdName = "poll";
  description = "Create a poll for users to vote on.";
  usage = "<option amt> <question>";
  groupName = "utils";

  async run(client: Main, message: Message, args: string[]) {
    const amount = args[0]
      ? !isNaN(parseInt(args[0])) && parseInt(args[0]) < 10
        ? parseInt(args[0])
        : false
      : false;
    if (!amount)
      return message.channel.send(
        embeds.error(
          `Please provide an amount of options, you only have up to 9 options.`,
          this.usage
        )
      );

    const question = args.splice(1).join(" ");
    if (!question)
      return message.channel.send(
        embeds.error(
          `Please make sure to provide a question for the poll.`,
          this.usage
        )
      );

    const options = [];
    for (let i = 0; i < amount; i++) {
      const question = await message.channel.send(
        embeds.question(`What would you like option ${i + 1} to be?`)
      );
      const option = await message.channel.awaitMessages(
        (x) => x.author.id === message.author.id,
        { max: 1, time: 900000, errors: ["time"] }
      );

      if (!option)
        return message.channel.send(
          embeds.error(
            `Option #${i + 1} was not provided, so the process has been ended.`
          )
        );

      if (question.deletable) question.delete();
      if (option.first().deletable) option.first().delete();
      options.push(option.first().content);
    }

    const embed = new MessageEmbed()
      .setTitle(question)
      .setColor("RANDOM")
      .setTimestamp();

    for (const option of options) {
      embed.addField(`Option ${emojis[options.indexOf(option)]}`, option, true);
    }

    const poll = await message.channel.send(embed);

    for (const option of options) {
      poll.react(emojis[options.indexOf(option)]);
    }
  }
}
