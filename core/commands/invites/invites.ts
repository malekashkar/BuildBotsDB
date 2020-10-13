import Command from "..";
import Main from "../../../";
import { Message, MessageEmbed } from "discord.js";
import { DbUser } from "../../models/user";
import { DbGuild } from "../../models/guild";
import embeds from "../../utils/embeds";
import confirmation from "../../utils/confirmation";

export default class InvitesCommand extends Command {
  cmdName: "invoice";
  description: "Create or delete invoices.";
  groupName: "payments";

  async run(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
    console.log(this);
    
    const options = ["create"];
    type Option = typeof options[number];
    const option = args[0]
      ? options.includes(args[0])
        ? (args[0] as Option)
        : null
      : null;

    (this as any)[option](client, message, args, userData, guildData, command);
  }

  async addrole(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
    const role = message.mentions.roles.first();
    if (!role)
      return message.channel.send(
        embeds.error(`Please tag the role you would like to use!`)
      );

    const inviteAmount = args[2]
      ? !isNaN(parseInt(args[2]))
        ? parseInt(args[2])
        : false
      : false;
    if (!inviteAmount)
      return message.channel.send(
        embeds.error(`Please provide the amount of invites that is required!`)
      );

    guildData.invites.roles.push({
      role: role.id,
      invites: inviteAmount,
    });
    await guildData.save();

    return message.channel.send(
      embeds.normal(
        `Invite Role Added`,
        `The role ${role} is now an invite role with the requirement of \`${inviteAmount}\` invites.`
      )
    );
  }

  async removerole(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
    const role = message.mentions.roles.first();
    if (!role || !guildData.invites.roles.some((x) => x.role === role.id))
      return message.channel.send(
        embeds.error(`Please tag a valid invite role!`)
      );

    guildData.invites.roles = guildData.invites.roles.filter(
      (x) => x.role !== role.id
    );
    await guildData.save();

    return message.channel.send(
      embeds.normal(
        `Invite Role Removed`,
        `The role ${role} has been removed from the invite roles.`
      )
    );
  }

  async reset(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
    const user = message.mentions.users.first();
    if (!user)
      return message.channel.send(
        embeds.error(`Please mention the target user of this operation!`)
      );

    const conf = await confirmation(
      `Invites Reset Confirmation`,
      `Are you sure you would like to delete all of ${user}'s invites?`,
      message
    );

    if (!conf) return;

    await this.bot.db.invites.deleteMany({
      invitedId: user.id,
    });

    return message.channel.send(
      embeds.normal(
        `Invites Reset`,
        `The invites of user ${user} have been reset to \`0\`.`
      )
    );
  }

  async roles(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
    const embed = new MessageEmbed()
      .setTitle(`Invite Roles`)
      .setDescription(
        guildData.invites.roles.length
          ? `Below are the invite roles currently available.`
          : `There are no invite roles available currently.`
      )
      .setColor("RANDOM")
      .setTimestamp();

    for (let roleInfo of guildData.invites.roles) {
      const role = message.guild.roles.resolve(roleInfo.role);
      if (!role) {
        guildData.invites.roles = guildData.invites.roles.filter(
          (x) => x.role !== roleInfo.role
        );
        await guildData.save();
        continue;
      }

      embed.addField(role.name, roleInfo.invites, true);
    }

    return message.channel.send(embed);
  }

  async set(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
    const user = message.mentions.users.first();
    if (!user)
      return message.channel.send(
        embeds.error(`Please mention the target user of this operation!`)
      );

    const amount = args[2]
      ? !isNaN(parseInt(args[2]))
        ? parseInt(args[2])
        : false
      : false;
    if (!amount)
      return message.channel.send(
        embeds.error(
          `Please provide the number of invites you would like to give them!`
        )
      );

    const conf = await confirmation(
      `Invites Set Confirmation`,
      `Are you sure you would like to give ${user}'s \`${amount}\` invites?`,
      message
    );

    if (!conf) return;

    const currentInvites = await this.bot.db.invites.find({
      inviterId: user.id,
    });

    if (amount <= currentInvites.length)
      return message.channel.send(
        embeds.error(`${user} already has ${amount} or more invites!`)
      );

    for (let i = 0; i < amount - currentInvites.length; i++) {
      await this.bot.db.invites.create({
        inviterId: user.id,
      });
    }

    return message.channel.send(
      embeds.normal(
        `Invites Set`,
        `The invites of user ${user} have been set to \`${amount}\`.`
      )
    );
  }

  async setjoinchannel(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
    const channel = message.mentions.channels.first();
    if (!channel)
      return message.channel.send(
        embeds.error(`Please mention the channel you would like to set.`)
      );

    guildData.invites.join.channel = channel.id;
    await guildData.save();

    return message.channel.send(
      embeds.normal(
        `Join Channel Set`,
        `All join messages will now be sent to ${channel}.`
      )
    );
  }

  async setjoinmsg(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
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

  async setleavechannel(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
  ) {
    const channel = message.mentions.channels.first();
    if (!channel)
      return message.channel.send(
        embeds.error(`Please mention the channel you would like to set.`)
      );

    guildData.invites.leave.channel = channel.id;
    await guildData.save();

    return message.channel.send(
      embeds.normal(
        `Leave Channel Set`,
        `All leave messages will now be sent to ${channel}.`
      )
    );
  }

  async setleavemsg(
    client: Main,
    message: Message,
    args: string[],
    userData: DbUser,
    guildData: DbGuild,
    command: string
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
