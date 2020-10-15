import { Message, MessageEmbed, Role, TextChannel } from "discord.js";
import Command from ".";
import Main from "../..";
import { DbGuild } from "../models/guild";
import { DbUser } from "../models/user";
import question from "../utils/question";
import moment from "moment";
import ms from "ms";
import embeds from "../utils/embeds";

export default class GiveawayCommand extends Command {
  cmdName = "giveaway";
  description = "Interact with the giveaway commands.";
  groupName = "giveaways";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
    const options = Object.keys(this).filter(
      (x) => typeof (this as any)[x] === "function"
    );
    type Option = typeof options[number];
    const option = args[0] as Option;
    if (!option)
      return message.channel.send(
        embeds.error(
          `Please provide one of the following arguments: \`${options.join(
            ", "
          )}\``
        )
      );

    try {
      (this as any)[option](
        client,
        message,
        args,
        userData,
        guildData,
        command
      );
    } catch (e) {
      message.channel.send(
        embeds.error(
          `\`${option}\` is not a \`${this.cmdName}\` command option.`
        )
      );
    }
  }

  create = async (
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) => {
    const channel = await getChannelQuestion(
      `Where would you like to post the giveaway?\n\`Please tag the channel.\``,
      message
    );

    const time = await question(
      `How long would you like this giveaway to last?\n\`Example would be 1s, 10h, 2w.\``,
      message
    );

    const winners = await getNumberQuestion(
      `How many winners is this giveaway going to have?\n\`Please provide a number.\``,
      message
    );

    const prize = await question(
      `What would you like the giveaway prize to be?\n\`Only provide the name of the item or service.\``,
      message
    );

    const requiredRoles = await getRolesQuestion(
      `What roles should have access to this giveaway?\n\`Tag all the roles, if there is no requirement say 0.\``,
      message
    );

    const requiredInvites = await getNumberQuestion(
      `What is the invites requirement for this giveaway?\n\`Please provide a number, if there is no requirement say 0.\``,
      message
    );

    const requiredGuilds = await getGuildsQuestion(
      `What servers must the user be in to enter this giveaway?\n\`Please provide invite codes to the servers with a space in between each, if there is no requirement say 0.\``,
      message,
      client
    );

    const requiredMessages = await getNumberQuestion(
      `How many messages must a user have in this server?\n\`Please provide a number of messages only, if there is no requirement say 0.\``,
      message
    );

    const embed = new MessageEmbed()
      .setColor("RANDOM")
      .setTitle(`${winners > 1 ? `x${winners} ` : ``}${prize}`)
      .setDescription(`React with :tada: to enter this giveaway!`)
      .addField(
        `Ending Time`,
        moment(Date.now() + ms(time)).format("LLL"),
        true
      )
      .addField(`Winners`, winners, true)
      .setFooter(`Ends at`)
      .setTimestamp(Date.now() + ms(time));

    if (
      requiredRoles.length ||
      requiredInvites ||
      requiredGuilds.length ||
      requiredMessages
    ) {
      embed.addField(
        `Conditions`,
        `${
          !requiredRoles.length
            ? ``
            : `Required Roles:` + requiredRoles.map((x) => `<@&${x}>`)
        }
         ${requiredInvites ? `Required Invites: ${requiredInvites}` : ``}\n
        ${
          !requiredGuilds.length
            ? `Required Guilds:` +
              requiredGuilds
                .map((x: string) => client.guilds.resolve(x).name)
                .join(", ")
            : ``
        }\n${requiredMessages ? `Required Messages: ${requiredMessages}` : ``}`,
        true
      );
    }

    const giveawayMsg = await channel.send(embed);
    giveawayMsg.react("🎉");

    guildData.giveaways.giveawayList.push({
      prize,
      startTime: Date.now(),
      endTime: Date.now() + ms(time),
      winners,
      messageId: giveawayMsg.id,
      channelId: giveawayMsg.channel.id,
      condition: {
        requiredRoles,
        requiredInvites,
        requiredGuilds,
        requiredMessages,
      },
    });

    async function getGuildsQuestion(
      question: string,
      message: Message,
      client: Main
    ) {
      const msg = await message.channel.send(question);
      const answer = await message.channel.awaitMessages(
        (x) => x.author.id === message.author.id,
        {
          max: 1,
          time: 900000,
          errors: ["time"],
        }
      );

      if (msg.deletable) msg.delete();
      if (answer.first().deletable) answer.first().delete();

      if (!answer || answer.first().content === "0") return [];

      const codes = answer.first().content.split(" ");
      const guilds = Promise.all(
        codes
          .map(async (code: string) => {
            const invite = await client.fetchInvite(code);
            if (invite && invite.guild) return invite.guild.id;
          })
          .filter((x) => !!x)
      );

      return guilds;
    }

    async function getChannelQuestion(question: string, message: Message) {
      const msg = await message.channel.send(question);
      const answer = await message.channel.awaitMessages(
        (x) =>
          (x.author.id === message.author.id && x.mentions.channels.size) ||
          x.content === "0",
        {
          max: 1,
          time: 900000,
          errors: ["time"],
        }
      );

      if (msg.deletable) msg.delete();
      if (answer.first().deletable) answer.first().delete();

      return answer
        ? (answer.first().mentions.channels.first() as TextChannel)
        : null;
    }

    async function getRolesQuestion(question: string, message: Message) {
      const msg = await message.channel.send(question);
      const answer = await message.channel.awaitMessages(
        (x) =>
          (x.author.id === message.author.id && x.mentions.roles.size) ||
          x.content === "0",
        {
          max: 1,
          time: 900000,
          errors: ["time"],
        }
      );

      if (msg.deletable) msg.delete();
      if (answer.first().deletable) answer.first().delete();

      return answer.first().content === "0"
        ? []
        : answer.first().mentions.roles
        ? answer.first().mentions.roles.map((x: Role) => x.id)
        : null;
    }

    async function getNumberQuestion(question: string, message: Message) {
      const msg = await message.channel.send(question);
      const answer = await message.channel.awaitMessages(
        (x) => x.author.id === message.author.id && !isNaN(parseInt(x.content)),
        {
          max: 1,
          time: 900000,
          errors: ["time"],
        }
      );

      if (msg.deletable) msg.delete();
      if (answer.first().deletable) answer.first().delete();

      return answer ? parseInt(answer.first().content) : null;
    }
  };
}
