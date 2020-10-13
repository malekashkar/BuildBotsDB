import { spawn } from "child_process";
import fetch from "node-fetch";
import fs from "fs-extra";
import modules from "..";
import path from "path";
import mongoose from "mongoose";

export interface IModules {
  giveaways: boolean;
  invites: boolean;
  leveling: boolean;
  moderation: boolean;
  payments: boolean;
  tickets: boolean;
  utils: boolean;
}

export default async function createBot(
  token: string,
  owner: string,
  modules: IModules
) {
  const response = await fetch(`https://discord.com/api/users/@me`, {
    headers: {
      Authorization: `Bot ${token}`,
    },
  });

  const json = await response.json();

  if (!response.ok || !json.bot || !json.bot.username)
    throw `The token you provided is invalid.`;

  const botName = json.username;

  const templateDirectory = path.join(__dirname, "..", "..", "template");
  const templateFolder = fs.existsSync(templateDirectory);
  if (!templateFolder) throw `There is no template bot available.`;

  const botsDirectory = path.join(__dirname, "..", "..", "bots");
  const botsFolder = fs.existsSync(botsDirectory);
  if (!botsFolder) fs.mkdirSync(botsDirectory);

  const botDirectory = path.join(botsDirectory, botName);
  const botFolder = fs.existsSync(path.join(botsDirectory, botName));
  if (botFolder) throw `The bot name ${botName} is already taken!`;

  fs.copySync(templateDirectory, botDirectory);
  fs.writeFile(
    botDirectory,
    JSON.stringify({
      name: botName,
      owner,
      token,
      modules,
      mongoURL: "mongodb://localhost/",
    })
  );

  const node = spawn(`node`, ["index.js"], {
    cwd: botDirectory,
  });

  node.stdout.on(`data`, (data) => console.log(data.toString()));
  node.stderr.on(`data`, (data) => console.log(data.toString()));
  return `The bot ${botName} has been created and started!`;
}
