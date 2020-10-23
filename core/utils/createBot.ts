import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import pm2 from "pm2";

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
  console.log(botJson);
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

  const botDirectory = path.join(botsDirectory, botJson.username);
  const botFolder = fs.existsSync(path.join(botsDirectory, botJson.username));
  if (botFolder)
    return {
      success: false,
      message: `The bot name ${botJson.username} is already taken!`,
    };
  else fs.mkdirSync(botDirectory);

  // Create the index.ts file.
  fs.copyFileSync(templateFile, path.join(botDirectory, "index.ts"));

  // Set the settings.json file up.
  fs.writeFileSync(
    path.join(botDirectory, "settings.json"),
    JSON.stringify({
      name: botJson.username.toLowerCase().replace(" ", "_"),
      prefix,
      owner,
      modules,
    })
  );

  // Set the .env file up.
  const envContent = `DISCORD_TOKEN=${token}`;
  fs.writeFileSync(path.join(botDirectory, ".env"), envContent, "utf8");

  // Set the package.json file up.
  fs.writeFileSync(
    path.join(botDirectory, "package.json"),
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

  pm2.connect((err: Error) => {
    pm2.start(
      {
        name: botJson.username.toLowerCase().replace(" ", "_"),
        script: "index.ts",
        cwd: botDirectory,
      },
      (err: Error) => {
        pm2.disconnect();
        if (err) throw err;
      }
    );
  });

  return {
    success: true,
    id: botJson.id,
    username: botJson.username,
    tag: botJson.username + botJson.discriminator,
    message: `The bot ${botJson.username} has been created and started!`,
  };
}
