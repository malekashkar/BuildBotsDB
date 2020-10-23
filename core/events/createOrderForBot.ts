import Main from "../../";
import embeds from "../utils/embeds";
import { emojis } from "../utils/storage";
import createBot from "../utils/createBot";
import _ from "lodash";

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
    if (!settings || message.id !== settings.createOrder.messageId) return;

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
        parent: settings.createOrder.categoryId,
      }
    );

    const modules = _.sortedUniq(
      client.commands.array().map((x) => x.module)
    ).filter((x) => x.toLowerCase() !== "createbot");
    const msg = await channel.send(
      embeds.normal(
        `Select Modules`,
        stripIndents`React with the ✅ whenever you have chosen all your modules.\n${modules
          .map((x, i) => `${emojis[i]} ${formatModule(x)}`)
          .join("\n")}`
      )
    );

    for (let i = 0; i < modules.length; i++) {
      msg.react(emojis[i]);
    }
    msg.react("✅");

    const collected = await msg.awaitReactions(
      (r, u) => u.id === user.id && r.emoji.name === "✅",
      { max: 1, time: 900000, errors: ["time"] }
    );

    const selectedEmojis = msg.reactions.cache
      .filter((x) => x.users.cache.size !== 1)
      .filter((x) => x.emoji.name !== "✅")
      .keyArray();

    if (!collected || !selectedEmojis.length) {
      channel.delete();
      user.send(
        embeds.error(
          `You order has been closed due to no emojis being sellected!`
        )
      );
    } else {
      msg.delete();
      const paid = await channel.send(
        // Make sure it checks for the payment
        embeds.normal(
          `Order Processing`,
          `[Click here](https://paypal.com) to pay for the following modules.\n${selectedEmojis
            .map((x) => `${x} ${formatModule(modules[emojis.indexOf(x)])}`)
            .join("\n")}`
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

        channel.send(embeds.question(`Please enter a prefix for your bot.`));
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

        if (!create.success) {
          channel.send(embeds.error(create.message));
        } else {
          channel.send(
            embeds.normal(
              `Bot Created Successfully`,
              `The bot ${create.username} has been created.`
            )
          );

          user.send(
            embeds.normal(
              `Bot Created Successfully`,
              `Your bot has been created! [Click here](https://discord.com/api/oauth2/authorize?client_id=${create.id}&permissions=8&scope=bot) for the invite link!`
            )
          );
        }
      }
    }
  }
}

function formatModule(str: string) {
  return str
    .split(" ")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
    .join(" ");
}
