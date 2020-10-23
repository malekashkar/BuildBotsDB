import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import child_process from "child_process";

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

export interface ISettings {
  token: string;
  ownerId: string;
  modules: string[];
  clientId: string;
}

app.post("/create", async (req, res) => {
  const token = req.body.token;
  if (!token) {
    res.status(400);
    res.send("Please provide a valid discord token.");
    return;
  }

  const botReq = await fetch(`https://discord.com/api/users/@me`, {
    headers: {
      Authorization: `Bot ${token}`,
    },
  });
  if (!botReq.ok) {
    res.status(400);
    res.send("The token you provided is not a valid bot token.");
    return;
  }

  const ownerId = req.body.ownerId;
  if (!ownerId) {
    res.status(400);
    res.send("Please provide the owner ID of the bot.");
    return;
  }

  const modules = req.body.modules;
  if (!modules) {
    res.status(400);
    res.send("Please provide the modules the bot is allowed to use.");
    return;
  }

  const botJson = await botReq.json();
  if (!botJson.bot || !botJson.id) {
    res.status(400);
    res.send("The token you provided is not for a discord bot.");
    return;
  }

  const settings: ISettings = {
    token,
    ownerId,
    modules,
    clientId: botJson.id,
  };

  const botsDirectory = path.join(__dirname, "..", "bots");
  if (!fs.existsSync(botsDirectory)) fs.mkdirSync(botsDirectory);

  const botDirectory = path.join(botsDirectory, settings.clientId);
  if (fs.existsSync(botDirectory)) {
    res.send(400);
    res.send(`That bot is already being used with another instance.`);
    return;
  } else fs.mkdirSync(botDirectory);

  const templateCode = fs.readFileSync("./code.txt", "utf8");
  const indexFile = path.join(botDirectory, "index.ts");
  fs.writeFileSync(indexFile, templateCode);

  const settingsFile = path.join(botDirectory, "settings.json");
  fs.writeFileSync(settingsFile, JSON.stringify(settings));

  res.status(500);
  res.send({
    id: botJson.id,
    tag: botJson.username + botJson.discriminator,
  });
});

app.get("/start", (req, res) => {
  const clientId = req.params.id;

  const botsDirectory = path.join(__dirname, "..", "bots");
  const botDirectory = path.join(botsDirectory, clientId);
  if (!fs.existsSync(botDirectory)) {
    res.send(400);
    res.send(`No bot was located with the id ${clientId}.`);
    return;
  }

  child_process.exec(`pm2 start index.ts --name ${clientId}`, {
    cwd: botDirectory,
  });

  res.status(500);
  res.send(`Client with id ${clientId} is now turned on.`);
});

app.get("/stop", (req, res) => {
  const clientId = req.params.id;

  const botsDirectory = path.join(__dirname, "..", "bots");
  const botDirectory = path.join(botsDirectory, clientId);
  if (!fs.existsSync(botDirectory)) {
    res.send(400);
    res.send(`No bot was located with the id ${clientId}.`);
    return;
  }

  child_process.exec(`pm2 stop index.ts`, {
    cwd: botDirectory,
  });

  res.status(500);
  res.send(`Client with id ${clientId} is now turned off.`);
});

app.get("/restart", (req, res) => {
  const clientId = req.params.id;

  const botsDirectory = path.join(__dirname, "..", "bots");
  const botDirectory = path.join(botsDirectory, clientId);
  if (!fs.existsSync(botDirectory)) {
    res.send(400);
    res.send(`No bot was located with the id ${clientId}.`);
    return;
  }

  child_process.exec(`pm2 restart index.ts`, {
    cwd: botDirectory,
  });

  res.status(500);
  res.send(`Client with id ${clientId} has been restarted.`);
});
