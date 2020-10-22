import { spawn } from "child_process";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";

export default async function createBot(
  token: string,
  prefix: string,
  owner: string,
  modules: string[]
) {
  const response = await fetch(`https://discord.com/api/users/@me`, {
    headers: {
      Authorization: `Bot ${token}`,
    },
  });
  if (!response.ok) return `The token you provided is invalid.`;

  const botJson = await response.json();
  if (!botJson.bot || !botJson.bot.username) return `That's not a discord bot!`;

  const templateFile = path.join(__dirname, "..", "..", "index.ts");
  const templateFolder = fs.existsSync(templateFile);
  if (!templateFolder) return `There is no template bot available.`;

  const botsDirectory = path.join(__dirname, "..", "..", "bots");
  const botsFolder = fs.existsSync(botsDirectory);
  if (!botsFolder) fs.mkdirSync(botsDirectory);

  const botDirectory = path.join(botsDirectory, botJson.username);
  const botFolder = fs.existsSync(path.join(botsDirectory, botJson.username));
  if (botFolder) return `The bot name ${botJson.username} is already taken!`;

  // Create the index.ts file.
  fs.copyFileSync(templateFile, path.join(botDirectory, "index.ts"));

  // Set the settings.json file up.
  fs.writeFileSync(
    path.join(botDirectory, "settings.json"),
    JSON.stringify({
      name: botJson.username,
      prefix,
      owner,
      modules,
    })
  );

  // Set the .env file up.
  fs.writeFileSync(
    path.join(botDirectory, ".env"),
    `DISCORD_TOKEN=${token}
    MONGO=mongodb://localhost/${name}`
  );

  // Set the package.json file up.
  fs.writeFileSync(
    path.join(botDirectory, "package.json"),
    JSON.stringify({
      name: botJson.username,
      version: "1.0.0",
      main: "index.ts",
      scripts: {
        start: "ts-node index.ts",
      },
      keywords: [],
      author: "Deposit#0001",
      license: "ISC",
      dependencies: {},
    })
  );

  const node = spawn(`yarn start`, ["index.ts"], {
    cwd: botDirectory,
  });

  node.stdout.on(`data`, (data) => console.log(data.toString()));
  node.stderr.on(`data`, (data) => console.log(data.toString()));
  return `The bot ${botJson.username} has been created and started!`;
}
