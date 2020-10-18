import { Message, MessageEmbed } from "discord.js";
import ms from "ms";
import Command from "..";
import Main from "../../..";
import { GiveawayModel } from "../../models/giveaway";

export default class TestGiveawayCommand extends Command {
  cmdName = "giveaways test";
  description = "Send the giveaway test.";
  groupName = "giveaways";
  permission = "GIVEAWAY";

  async run(client: Main, message: Message, args: string[]) {
    const winners = 1;
    const prize = `testing`;
    const time = `50s`;
    const requiredRoles: string[] = [];
    const requiredGuilds: string[] = [];
    const requiredInvites = 0;
    const requiredMessages = 0;

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

    const giveawayMsg = await message.channel.send(embed);
    giveawayMsg.react("🎉");

    GiveawayModel.create({
      status: "pending",
      prize,
      endTime: Date.now() + ms(time),
      winners,
      messageId: giveawayMsg.id,
      channelId: giveawayMsg.channel.id,
      guildId: giveawayMsg.guild.id,
      condition: {
        requiredRoles,
        requiredInvites,
        requiredGuilds,
        requiredMessages,
      },
    });
  }
}
