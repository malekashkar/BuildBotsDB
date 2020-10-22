import ms from "ms";
import path from "path";
import fs from "fs-extra";
import _ from "underscore";
import mongoose from "mongoose";

import Main from "..";
import Event from "./events";
import logger from "./utils/logger";
import Command from "./commands";

import { GiveawayModel } from "./models/giveaway";
import { MessageEmbed, TextChannel, User } from "discord.js";

export interface ISettings {
  name: string;
  prefix: string;
  owner: string;
  modules: IModules;
}

export interface IModules {
  giveaways: boolean;
  invites: boolean;
  leveling: boolean;
  moderation: boolean;
  payments: boolean;
  tickets: boolean;
  utils: boolean;
}

export default class Modules {
  constructor(client: Main, settings: ISettings, env: any) {
    client.login(env.DISCORD_TOKEN);
    this.loadDatabase(env.MONGO);

    this.loadCommands(client);
    this.loadEvents(client);
    this.initGarbageCollectors(client);
  }

  loadDatabase(url: string) {
    mongoose.connect(
      url,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        connectTimeoutMS: 60000,
        socketTimeoutMS: 60000,
        serverSelectionTimeoutMS: 60000,
      },
      (err) => {
        if (err) logger.error("DATABASE", err);
      }
    );
  }

  loadCommands(
    client: Main,
    directory: string = path.join(__dirname, "commands")
  ) {
    const directoryStats = fs.statSync(directory);
    if (!directoryStats.isDirectory()) return;

    const commandFiles = fs.readdirSync(directory);
    for (const commandFile of commandFiles) {
      const commandPath = path.join(directory, commandFile);
      const commandFileStats = fs.statSync(commandPath);
      if (!commandFileStats.isFile()) {
        this.loadCommands(client, commandPath);
        continue;
      }
      if (
        !commandFileStats.isFile() ||
        !/^.*\.(js|ts|jsx|tsx)$/i.test(commandFile) ||
        path.parse(commandPath).name === "index"
      )
        continue;

      const tmpCommand = require(commandPath);
      const command =
        typeof tmpCommand !== "function" &&
        typeof tmpCommand.default === "function"
          ? tmpCommand.default
          : typeof tmpCommand === "function"
          ? tmpCommand
          : null;

      try {
        const commandObj: Command = new command(this);
        if (commandObj && commandObj.cmdName) {
          if (client.commands.has(commandObj.cmdName)) {
            logger.error(
              `DUPLICATE_COMMAND`,
              `Duplicate command ${commandObj.cmdName}.`
            );
          } else client.commands.set(commandObj.cmdName, commandObj);
        }
      } catch (e) {}
    }
  }

  loadEvents(client: Main, directory = path.join(__dirname, "events")) {
    const directoryStats = fs.statSync(directory);
    if (!directoryStats.isDirectory()) return;

    const eventFiles = fs.readdirSync(directory);
    for (const eventFile of eventFiles) {
      const eventPath = path.join(directory, eventFile);
      const eventFileStats = fs.statSync(eventPath);
      if (
        !eventFileStats.isFile() ||
        !/^.*\.(js|ts|jsx|tsx)$/i.test(eventFile) ||
        path.parse(eventPath).name === "index"
      )
        continue;

      const tmpEvent = require(eventPath);
      const event =
        typeof tmpEvent.default === "function" ? tmpEvent.default : null;
      if (!event) return;

      try {
        const eventObj: Event = new event(this);
        if (eventObj && eventObj.name) {
          client.addListener(eventObj.name, (...args) =>
            eventObj.handle.bind(eventObj)(client, ...args)
          );
        }
      } catch (ignored) {}
    }
  }

  initGarbageCollectors(client: Main) {
    setInterval(async () => {
      const giveaways = await GiveawayModel.find();

      for (const giveaway of giveaways) {
        if (giveaway.endTime > Date.now()) {
          const giveawayGuild = client.guilds.resolve(giveaway.guildId);
          if (!giveawayGuild) {
            await GiveawayModel.deleteOne({ messageId: giveaway.messageId });
            continue;
          }

          const giveawayChannel = giveawayGuild.channels.resolve(
            giveaway.channelId
          ) as TextChannel;
          if (!giveawayChannel) {
            await GiveawayModel.deleteOne({ messageId: giveaway.messageId });
            continue;
          }

          const giveawayMessage = giveawayChannel.messages.resolve(
            giveaway.messageId
          );
          if (!giveawayMessage || giveawayMessage.deleted) {
            await GiveawayModel.deleteOne({ messageId: giveaway.messageId });
            continue;
          }

          giveawayMessage.embeds[0].fields[0] = {
            name: "Time Left",
            value: `<:timer:765595933027074070> **${ms(
              giveaway.endTime - Date.now()
            )}**`,
            inline: true,
          };

          giveawayMessage.edit(giveawayMessage.embeds[0]);
        } else {
          if (giveaway.status === "ended") continue;

          const giveawayGuild = client.guilds.resolve(giveaway.guildId);
          if (!giveawayGuild) {
            await GiveawayModel.deleteOne({ messageId: giveaway.messageId });
            continue;
          }

          const giveawayChannel = giveawayGuild.channels.resolve(
            giveaway.channelId
          ) as TextChannel;
          if (!giveawayChannel) {
            await GiveawayModel.deleteOne({ messageId: giveaway.messageId });
            continue;
          }

          const giveawayMessage = giveawayChannel.messages.resolve(
            giveaway.messageId
          );
          if (!giveawayMessage || giveawayMessage.deleted) {
            await GiveawayModel.deleteOne({ messageId: giveaway.messageId });
            continue;
          }

          const reactedUsers = giveawayMessage.reactions
            .resolve("🎉")
            .users.cache.array()
            .filter((x: User) => !x.bot);

          if (reactedUsers.length < giveaway.winners) {
            giveawayMessage.edit(
              `:tada: **GIVEAWAY ENDED** :tada:`,
              new MessageEmbed()
                .setColor("RANDOM")
                .setTitle(giveaway.prize)
                .setDescription(
                  `Not enough members entered the giveaway for me to draw a winner...`
                )
                .setFooter(`0 Winners | Ended at`)
                .setTimestamp(Date.now())
            );
          } else {
            const winners = _.sample(reactedUsers, giveaway.winners);

            giveawayMessage.edit(
              `:tada: **GIVEAWAY ENDED** :tada:`,
              new MessageEmbed()
                .setColor("RANDOM")
                .setTitle(giveaway.prize)
                .setDescription(
                  `${
                    giveaway.winners > 1 ? `Winners` : `Winner`
                  }: ${winners.map((x: User) => `<@${x.id}>`).join(", ")}`
                )
                .setFooter(
                  `${
                    giveaway.winners > 1 ? `${giveaway.winners} Winners | ` : ``
                  }Ended at`
                )
                .setTimestamp(Date.now())
            );

            giveawayChannel.send(
              `Congratulations ${winners
                .map((x: User) => `<@${x.id}>`)
                .join(", ")}! You${
                giveaway.winners > 1 ? ` guys ` : ` `
              }won **${giveaway.prize}**.\n${giveawayMessage.url}`
            );
          }

          giveaway.status = "ended";
          await giveaway.save();
        }
      }
    }, 11 * 1000);
  }
}
