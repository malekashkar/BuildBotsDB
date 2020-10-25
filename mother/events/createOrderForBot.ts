import Main from "../structures/client";
import embeds from "../utils/embeds";
import { emojis } from "../utils/storage";
import _ from "lodash";
import { MessageReaction, User } from "discord.js";
import { GuildModel } from "../models/guild";
import Event from ".";
import { stripIndents } from "common-tags";
import fetch from "node-fetch";

export default class createTicket extends Event {
  name = "messageReactionAdd";

  async handle(client: Main, reaction: MessageReaction, user: User) {
    try {
      if (user.bot) return;
      if (reaction.message.partial) reaction.message.fetch();
      if (reaction.emoji.name !== "✅") return;

      const message = reaction.message;
      reaction.users.remove(user);

      console.log(`passed settings check`)
      const settings = await GuildModel.findOne({ guildId: message.guild.id });
      console.log(settings);
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
        msg.reactions.removeAll();
        msg.edit(
          embeds.normal(
            `Order Processing`,
            `[Click here](https://paypal.com) to pay for the following modules.\n${selectedEmojis
              .map((x) => `${x} ${formatModule(modules[emojis.indexOf(x)])}`)
              .join("\n")}`
          )
        );

        // Order must be paid before going this far.

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

        // Send the request to the api
        const createReq = await fetch(`http://localhost:3000/create`, {
          method: "POST",
          body: JSON.stringify({
            token: token.first().content,
            ownerId: user.id,
            modules: selectedModules,
          }),
        });
        if (!createReq.ok) {
          message.channel.send(
            embeds.error(
              `There was an error creating the bot!\n\`\`\`${await createReq.text()}\`\`\``
            )
          );
        }
        const create = await createReq.json();

        const startReq = await fetch(
          `http://localhost:3000/start?id=${create.clientId}`
        );
        if (!startReq.ok) {
          message.channel.send(
            embeds.error(
              `There was an error starting the bot!\n\`\`\`${await startReq.text()}\`\`\``
            )
          );
        }

        channel.send(
          embeds.normal(
            `Bot Created Successfully`,
            `The bot **${create.tag}** has been created.\nThis channel will be deleted in the next 10 seconds!`
          )
        );

        user.send(
          embeds.normal(
            `Bot Created Successfully`,
            `Your bot **${create.tag}** has been created! [Click here](https://discord.com/api/oauth2/authorize?client_id=${create.clientId}&permissions=8&scope=bot) for the invite link!`
          )
        );
      }
    } catch (e) {
      console.log(e);
    }
  }
}

function formatModule(str: string) {
  return str
    .split(" ")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
    .join(" ");
}
