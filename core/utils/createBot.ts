import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import child_process from "child_process";

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
  if (!response.ok)
    return {
      success: false,
      message: `The token you provided is invalid.`,
    };

  const botJson = await response.json();
  if (!botJson.bot)
    return {
      success: false,
      message: `That's not a discord bot.`,
    };

  const templateFile = path.join(
    __dirname,
    "..",
    "..",
    "bots",
    "Template",
    "index.ts"
  );
  const templateFolder = fs.existsSync(templateFile);
  if (!templateFolder)
    return {
      success: false,
      message: `The template bot file cannot be located, please let an administrator know of this issue.`,
    };

  const botsDirectory = path.join(__dirname, "..", "..", "bots");
  const botsFolder = fs.existsSync(botsDirectory);
  if (!botsFolder) fs.mkdirSync(botsDirectory);

  const botFolder = path.join(botsDirectory, botJson.username);
  const botFolderExists = fs.existsSync(botFolder);
  if (botFolderExists)
    return {
      success: false,
      message: `The bot name ${botJson.username} is already taken!`,
    };
  else fs.mkdirSync(botFolder);

  // Create the index.ts file.
  fs.copyFileSync(templateFile, path.join(botFolder, "index.ts"));

  // Set the settings.json file up.
  fs.writeFileSync(
    path.join(botFolder, "settings.json"),
    JSON.stringify({
      name: botJson.username.toLowerCase().replace(" ", "_"),
      prefix,
      owner,
      modules,
      token
    })
  );

  // Set the package.json file up.
  fs.writeFileSync(
    path.join(botFolder, "package.json"),
    JSON.stringify({
      name: botJson.username.toLowerCase().replace(" ", "_"),
      version: "1.0.0",
      main: "index.ts",
      scripts: {},
      keywords: [],
      author: "Deposit#0001",
      license: "ISC",
      dependencies: {},
    })
  );

  child_process.exec(
    `pm2 start index.ts --name ${botJson.username}`, // ts-node index.ts
    {
      cwd: botFolder,
    },
    (error: Error, stdout: string | Buffer, stderr: string | Buffer) => {
      console.log(error, stdout, stderr);
    }
  );

  return {
    success: true,
    id: botJson.id,
    username: botJson.username,
    tag: botJson.username + botJson.discriminator,
    message: `The bot ${botJson.username} has been created and started!`,
  };
}
