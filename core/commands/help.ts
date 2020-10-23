import Command from ".";
import Main from "../..";
import { Message, MessageEmbed, Collection } from "discord.js";
import { DbUser } from "../models/user";
import { DbGuild } from "../models/guild";
import { emojis } from "../utils/storage";
import { groupEmojis } from "../utils/storage";

interface IGroup {
  commands: string[];
  descriptions: string[];
}

export default class HelpCommand extends Command {
  cmdName = "help";
  description = "Get a list of all the commands.";
  module = "utility";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild
  ) {
    const help: Collection<string, IGroup> = new Collection();

    for (const command of client.commands.array()) {
      if (command.module.toLowerCase() === "createbot") continue;
      const group = help.get(toTitleCase(command.module));
      if (!group) {
        help.set(toTitleCase(command.module), {
          commands: [command.cmdName],
          descriptions: [command.description],
        });
      } else {
        group.commands.push(command.cmdName);
        group.descriptions.push(command.description);
      }
    }

    const modules: string[] = Array.from(help).map(([name, value]) => name);
    const fields = modules.map((name: string) => {
      return {
        name: `**${name}** commands`,
        value: `*react with ${groupEmojis[name.toLowerCase()]} to view*`,
        inline: true,
      };
    });

    if (!args[0]) {
      const helpMessage = await message.channel.send(
        new MessageEmbed()
          .addFields(fields)
          .setTitle(`Help Menu`)
          .setColor("RANDOM")
          .setFooter(`Build A Bot v1.0`)
          .setTimestamp()
      );

      for (const module of modules) {
        helpMessage.react(groupEmojis[module.toLowerCase()]);
      }

      helpMessage
        .awaitReactions(
          (r, u) =>
            u.id === message.author.id &&
            Object.values(groupEmojis).includes(r.emoji.name),
          { max: 1, time: 60000, errors: ["time"] }
        )
        .then(async (category) => {
          const categoryName = toTitleCase(
            Object.keys(groupEmojis)[
              Object.values(groupEmojis).indexOf(category.first().emoji.name)
            ]
          );
          const groupInfo = help.get(categoryName);

          let description = ``;
          for (let i = 0; i < groupInfo.commands.length; i++) {
            description += `**${guildData.prefix}${groupInfo.commands[i]}** ~ ${groupInfo.descriptions[i]}\n`;
          }

          helpMessage.reactions.removeAll();
          helpMessage.edit(
            new MessageEmbed()
              .setColor("RANDOM")
              .setFooter(`Build A Bot v1.0`)
              .setTimestamp()
              .setTitle(categoryName + ` | Commands Info`)
              .setDescription(description)
          );
        })
        .catch(async () => await helpMessage.reactions.removeAll());
    } else if (modules.includes(toTitleCase(args[0]))) {
      const categoryName = toTitleCase(args[0]);
      const groupInfo = help.get(categoryName);

      let description = ``;
      for (let i = 0; i < groupInfo.commands.length; i++) {
        description += `**${guildData.prefix}${groupInfo.commands[i]}** ~ ${groupInfo.descriptions[i]}\n`;
      }

      message.channel.send(
        new MessageEmbed()
          .setTitle(categoryName + ` | Commands Info`)
          .setDescription(description)
          .setColor("RANDOM")
          .setFooter(`Build A Bot v1.0`)
          .setTimestamp()
      );
    }
  }
}

function toTitleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
