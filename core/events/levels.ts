import Bot from "..";
import Modules from "..";
import Main from "../../";

import { Message } from "discord.js";

export default class levels {
  name = "message";

  async handle(modules: Modules, client: Main, message: Message) {
    if (!message.guild || !message.author || message.author.bot) return;

    const userData =
      (await modules.db.users.findOne({
        userId: message.author.id,
      })) ||
      (await modules.db.users.create({
        userId: message.author.id,
      }));

    if (!userData.leveling.lastMessageTime) {
      userData.leveling.lastMessageTime = Date.now();
      await userData.save();
      return;
    } else if (Date.now() - userData.leveling.lastMessageTime >= 10000) {
      userData.leveling.xp += 10;
      userData.leveling.lastMessageTime = Date.now();
      await userData.save();
    }
  }
}
