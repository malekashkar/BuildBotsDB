import { Message, MessageEmbed, Role, TextChannel, User } from "discord.js";
import Command from ".";
import Main from "../..";
import { DbGuild } from "../models/guild";
import { DbUser } from "../models/user";
import { DbGiveaways, GiveawayModel } from "../models/giveaway";
import question from "../utils/question";
import moment from "moment";
import ms from "ms";
import embeds from "../utils/embeds";
import _ from "underscore";

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

    GiveawayModel.create({
      status: "pending",
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
  };

  edit = async (
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) => {
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

    giveawayMessage.edit(embed);
    giveawayData.prize = prize;
    giveawayData.startTime = Date.now();
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
  };

  test = async (client: Main, message: Message, args: string[]) => {
    const winners = 1;
    const prize = `testing`;
    const time = `10s`;
    const requiredRoles: string[] = [];
    const requiredGuilds: string[] = [];
    const requiredInvites = 0;
    const requiredMessages = 0;

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

    const giveawayMsg = await message.channel.send(embed);
    giveawayMsg.react("🎉");

    GiveawayModel.create({
      status: "pending",
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
  };

  end = async (client: Main, message: Message, args: string[]) => {
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

    const giveawayChannel = message.guild.channels.resolve(
      giveawayData.channelId
    ) as TextChannel;
    const giveawayMessage = await giveawayChannel.messages.fetch(
      giveawayData.messageId
    );

    const reactedUsers = giveawayMessage.reactions
      .resolve("🎉")
      .users.cache.array()
      .filter((x: User) => !x.bot);

    if (reactedUsers.length < giveawayData.winners)
      return message.channel.send(
        embeds.error(
          `Not enough people entered the giveaway in order to draw winners!`
        )
      );

    const winners = _.sample(reactedUsers, giveawayData.winners);

    giveawayMessage.edit(
      `:tada: **GIVEAWAY ENDED** :tada:`,
      new MessageEmbed()
        .setColor("RANDOM")
        .setTitle(giveawayData.prize)
        .setDescription(
          `${giveawayData.winners > 1 ? `Winners` : `Winner`}: ${winners
            .map((x: User) => `<@${x.id}>`)
            .join(", ")}`
        )
        .setFooter(
          `${
            giveawayData.winners > 1 ? `${giveawayData.winners} Winners | ` : ``
          }Ended at`
        )
        .setTimestamp(Date.now())
    );

    giveawayChannel.send(
      `Congratulations ${winners
        .map((x: User) => `<@${x.id}>`)
        .join(", ")}! You${giveawayData.winners > 1 ? ` guys ` : ` `}won **${
        giveawayData.prize
      }**.\n${giveawayMessage.url}`
    );

    giveawayData.status = "ended";
    await giveawayData.save();

    const finalMsg = await message.channel.send(
      embeds.normal(
        `Giveaway Ended`,
        `The giveaway with id \`${messageId}\` has been ended!`
      )
    );

    finalMsg.delete({ timeout: 10 * 1000 });
  };

  reroll = async (client: Main, message: Message, args: string[]) => {
    const messageId = args[1];
    const giveawayData = await GiveawayModel.findOne({ messageId });
    if (!messageId || !giveawayData)
      return message.channel.send(
        embeds.error(`Please provide a valid giveaway message id!`)
      );

    if (giveawayData.status !== "ended")
      return message.channel.send(
        embeds.error(
          `The giveaway must be ended in order to reroll the winners!`
        )
      );

    const giveawayChannel = message.guild.channels.resolve(
      giveawayData.channelId
    ) as TextChannel;
    const giveawayMessage = await giveawayChannel.messages.fetch(
      giveawayData.messageId
    );

    const reactedUsers = giveawayMessage.reactions
      .resolve("🎉")
      .users.cache.array()
      .filter((x: User) => !x.bot);
    console.log(giveawayMessage.reactions.resolve("🎉").users.cache);

    if (reactedUsers.length < giveawayData.winners)
      return message.channel.send(
        embeds.error(
          `Not enough people entered the giveaway in order to draw winners!`
        )
      );

    const winners = _.sample(reactedUsers, giveawayData.winners);

    giveawayMessage.edit(
      `:tada: **GIVEAWAY ENDED** :tada:`,
      new MessageEmbed()
        .setColor("RANDOM")
        .setTitle(giveawayData.prize)
        .setDescription(
          `${giveawayData.winners > 1 ? `Winners` : `Winner`}: ${winners
            .map((x: User) => `<@${x.id}>`)
            .join(", ")}`
        )
        .setFooter(
          `${
            giveawayData.winners > 1 ? `${giveawayData.winners} Winners | ` : ``
          }Ended at`
        )
        .setTimestamp(Date.now())
    );

    giveawayChannel.send(
      `Congratulations ${winners
        .map((x: User) => `<@${x.id}>`)
        .join(", ")}! You${giveawayData.winners > 1 ? ` guys ` : ` `}won **${
        giveawayData.prize
      }**.\n${giveawayMessage.url}`
    );

    const finalMsg = await message.channel.send(
      embeds.normal(
        `Giveaway Rerolled`,
        `The giveaway with id \`${messageId}\` has been rerolled!`
      )
    );

    finalMsg.delete({ timeout: 10 * 1000 });
  };

  stop = async (client: Main, message: Message, args: string[]) => {
    const messageId = args[1];
    const giveawayData = await GiveawayModel.findOne({ messageId });
    if (!messageId || !giveawayData)
      return message.channel.send(
        embeds.error(`Please provide a valid giveaway message id!`)
      );

    const giveawayMessage = await (message.guild.channels.resolve(
      giveawayData.channelId
    ) as TextChannel).messages.fetch(giveawayData.messageId);

    giveawayMessage.delete();
    GiveawayModel.deleteOne({ messageId });

    const finalMsg = await message.channel.send(
      embeds.normal(
        `Giveaway Stopped`,
        `The giveaway with id \`${messageId}\` has been stopped/deleted!`
      )
    );

    finalMsg.delete({ timeout: 10 * 1000 });
  };

  admin = async (
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) => {
    const user = message.mentions.users.first();
    if (!user)
      return message.channel.send(
        embeds.error(
          `Please mention the user you would like to give admin giveaway perms to!`
        )
      );

    if (guildData.giveaways.adminUsers.includes(user.id)) {
      guildData.giveaways.adminUsers = guildData.giveaways.adminUsers.filter(
        (x: string) => x !== user.id
      );
      await guildData.save();

      return await message.channel.send(
        embeds.normal(
          `Admin Removed`,
          `I have taken away giveaway admin perms from ${user}.`
        )
      );
    } else {
      guildData.giveaways.adminUsers.push(user.id);
      await guildData.save();

      return await message.channel.send(
        embeds.normal(
          `Admin Added`,
          `I have given ${user} giveaway admin permissions.`
        )
      );
    }
  };

  bypass = async (
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) => {
    const role = message.mentions.users.first();
    if (!role)
      return message.channel.send(
        embeds.error(
          `Please mention the role you would like to give admin giveaway perms to!`
        )
      );

    if (guildData.giveaways.bypassRoles.includes(role.id)) {
      guildData.giveaways.bypassRoles = guildData.giveaways.bypassRoles.filter(
        (x: string) => x !== role.id
      );
      await guildData.save();

      return await message.channel.send(
        embeds.normal(
          `Admin Role Removed`,
          `I have taken away giveaway admin perms from ${role}.`
        )
      );
    } else {
      guildData.giveaways.bypassRoles.push(role.id);
      await guildData.save();

      return await message.channel.send(
        embeds.normal(
          `Admin Role Added`,
          `I have given ${role} giveaway admin permissions.`
        )
      );
    }
  };
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
