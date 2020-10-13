import fs from "fs-extra";
import path from "path";
import mongoose from "mongoose";

import Main from "..";
import Event from "./events";
import logger from "./utils/logger";

export interface ISettings {
  name: string;
  prefix: string;
  owner: string;
  token: string;
  mongoURL: string;
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
  constructor(client: Main, settings: ISettings) {
    client.login(settings.token);

    this.loadCommands(client);
    this.loadEvents(client);
    this.loadDatabase(settings.mongoURL + settings.name);
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

      const commandObj = require(commandPath);
      if (!commandObj || !commandObj.name) continue;

      if (client.commands.has(commandObj.name))
        return logger.error(
          `DUPLICATE_COMMAND`,
          `Duplicate command ${commandObj.name}.`
        );

      if (!commandObj.run)
        return logger.error(
          `NO_FUNCTION`,
          `The command ${commandObj.name} has no run function!`
        );

      client.commands.set(commandObj.name, commandObj);
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
}
