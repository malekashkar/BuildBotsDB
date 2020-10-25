import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import child_process, { execSync, spawn } from "child_process";
import pm2 from "pm2";

const app = express();
const PORT = process.env.PORT || 3000;

const botsDirectory = path.join(__dirname, "..", "slaves");
if (!fs.existsSync(botsDirectory)) fs.mkdirSync(botsDirectory);

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

app.get("/start", async (req, res) => {
  const clientId = req.query.id.toString();
  if (!clientId) {
    res.status(400);
    res.send(`Please provide the bot ID you would like to start.`);
    return;
  }

  const botDirectory = path.join(botsDirectory, clientId);
  if (!fs.existsSync(botDirectory)) {
    res.status(400);
    res.send(`No bot was located with the id ${clientId}.`);
    return;
  }

  pm2.connect(function (err: Error) {
    if (err) {
      console.error(err);
    }

    pm2.start(
      {
        name: clientId,
        script: `index.ts`,
        cwd: botDirectory,
        interpreter: "/usr/lib/node_modules/pm2/node_modules/.bin/ts-node",
      },
      (err: Error) => {
        pm2.disconnect();
        if (err) throw err;
      }
    );
  });

  /*
  const process = child_process.spawn(`ts-node`, ["index.ts"], {
    cwd: botDirectory,
  });

  process.stdout.on("data", function (data) {
    console.log(data.toString());
  });

  process.stderr.on("data", function (data) {
    console.log(data.toString());
  });

  process.on("close", function (code) {
    console.log("Finished with code " + code);
  });

  process.on("exit", function (code) {
    console.log("Finished with exit " + code);
  });
 */

  if (process) {
    res.status(500);
    res.send(`The bot with ID ${clientId} has been turned on.`);
  }
});
