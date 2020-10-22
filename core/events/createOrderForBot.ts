import Main from "../../";
import embeds from "../utils/embeds";
import { emojis } from "../utils/storage";
import createBot from "../utils/createBot";

import { MessageReaction, User } from "discord.js";
import { GuildModel } from "../models/guild";
import Event from ".";
import { stripIndents } from "common-tags";

export default class createTicket extends Event {
  name = "messageReactionAdd";

  async handle(client: Main, reaction: MessageReaction, user: User) {
    if (user.bot) return;
    if (reaction.message.partial) reaction.message.fetch();
    if (reaction.emoji.name !== "✅") return;

    const message = reaction.message;
    reaction.users.remove(user);

    const settings = await GuildModel.findOne({ guildId: message.guild.id });
    if (!settings || !settings.private.orderParent) {
      user.send(
        embeds.error(
          `Contact an administrator regarding this issue.\`\`\`No settings were found for this server.\`\`\``
        )
      );
      return;
    }

    const channel = await message.guild.channels.create(
      `${user.username}-order`,
      {
        type: "text",
        permissionOverwrites: [
          {
            id: user.id,
            allow: ["SEND_MESSAGES", "READ_MESSAGE_HISTORY", "VIEW_CHANNEL"],
          },
          {
            id: message.guild.roles.everyone,
            deny: "VIEW_CHANNEL",
          },
        ],
        parent: settings.private.orderParent,
      }
    );

    const modules = [
      "Moderation",
      "Giveaways",
      "Polls, Changelogs and Feedback",
      "Levels & Leaderboard",
      "Invite Tracker",
      "Payments & Gateways",
      "Tickets & Support",
      "Commissioner",
      "Music",
      "Copyright Removal",
    ];
    const msg = await channel.send(
      embeds.normal(
        `Select Modules`,
        stripIndents`React with the ✅ whenever you have chosen all your modules.\n${modules.map(
          (x, i) => `${emojis[i]} ${x}\n`
        )}`
      )
    );

    for (let i = 0; i < modules.length; i++) {
      msg.react(emojis[i]);
    }

    const collected = await msg.awaitReactions(
      (r, u) => u.id === user.id && r.emoji.name === "✅",
      { max: 1, time: 900000, errors: ["time"] }
    );

    const selectedEmojis = Object.keys(collected.first().message.reactions);
    if (!collected) {
      // if there is no emoji other than the ✅ then return too
      channel.delete();
      user.send(
        embeds.error(
          `You order has been closed due to no emojis being sellected!`
        )
      );
      return;
    }

    msg.delete();
    const paid = await channel.send(
      // Make sure it checks for the payment
      embeds.normal(
        `[Click here](https://paypal.com) to pay for the following modules.\n${selectedEmojis.map(
          (x) => `${x} ${modules[emojis.indexOf(x)]}\n`
        )}`,
        `Order Processing`
      )
    );

    if (paid) {
      const selectedModules = selectedEmojis.map(
        (x) => modules[emojis.indexOf(x)]
      );

      channel.send(embeds.question(`What is the token of your discord bot?`));
      const token = await channel.awaitMessages(
        (x) => x.author.id === user.id,
        {
          max: 1,
          time: 900000,
          errors: ["time"],
        }
      );

      channel.send(embeds.question(`Please entire a prefix for your bot.`));
      const prefix = await channel.awaitMessages(
        (x) => x.author.id === user.id,
        {
          max: 1,
          time: 900000,
          errors: ["time"],
        }
      );

      const create = await createBot(
        token.first().content,
        prefix.first().content,
        user.id,
        selectedModules
      );

      channel.send(embeds.normal(create, `Final`));
    }
  }
}
