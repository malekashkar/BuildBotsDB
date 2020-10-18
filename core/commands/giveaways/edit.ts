import { Message, MessageEmbed, Role, TextChannel } from "discord.js";
import ms from "ms";
import Command from "..";
import Main from "../../..";
import { GiveawayModel } from "../../models/giveaway";
import embeds from "../../utils/embeds";
import question from "../../utils/question";

export default class EditGiveawayCommand extends Command {
  cmdName = "giveaways edit";
  description = "Edit a giveaway to new settings.";
  groupName = "giveaways";
  permission = "GIVEAWAY";

  async run(client: Main, message: Message, args: string[]) {
    const messageId = args[1];
    const giveawayData = await GiveawayModel.findOne({ messageId });
    if (!messageId || !giveawayData)
      return message.channel.send(
        embeds.error(`Please provide a valid giveaway message id!`)
      );

    if (giveawayData.status === "ended")
      return message.channel.send(
        embeds.error(
          `The giveaway with id \`${messageId}\` has already been ended!`
        )
      );

    const time = await question(
      `How long would you like this giveaway to last?\n\`Example would be 1s, 10h, 2w.\``,
      message
    );

    if (ms(time) > 30 * 24 * 60 * 60 * 1000)
      return message.channel.send(
        embeds.error(`You cannot make a giveaway longer than 30 days!`)
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

    const giveawayChannel = message.guild.channels.resolve(
      giveawayData.channelId
    ) as TextChannel;
    const giveawayMessage = await giveawayChannel.messages.fetch(
      giveawayData.messageId
    );

    const embed = new MessageEmbed()
      .setColor("RANDOM")
      .setTitle(
        `<:giveaway:765595890554896384> ${
          winners > 1 ? `x${winners} ` : ``
        }${prize}`
      )
      .setDescription(
        `<:desc:765597022505402418> React with :tada: to enter this giveaway!`
      )
      .addField(
        `Time Left`,
        `<:timer:765595933027074070> **${ms(ms(time))}**`,
        true
      )
      .addField(`Winners`, `<:winner:765597646433026108> **${winners}**`, true)
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
           ${requiredInvites ? `Required Invites: ${requiredInvites}\n` : ``}
          ${
            !requiredGuilds.length
              ? `Required Guilds:` +
                requiredGuilds
                  .map((x: string) => client.guilds.resolve(x).name)
                  .join(", ") +
                `\n`
              : ``
          }${
          requiredMessages ? `Required Messages: ${requiredMessages}\n` : ``
        }`,
        true
      );
    }

    giveawayMessage.edit(embed);
    giveawayData.prize = prize;
    giveawayData.endTime = Date.now() + ms(time);
    giveawayData.winners = winners;
    giveawayData.condition = {
      requiredRoles,
      requiredInvites,
      requiredGuilds,
      requiredMessages,
    };
    await giveawayData.save();

    const finalMsg = await message.channel.send(
      embeds.normal(
        `Giveaway Edited`,
        `The giveaway with id \`${messageId}\` has been edited!`
      )
    );

    finalMsg.delete({ timeout: 10 * 1000 });
  }
}

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
