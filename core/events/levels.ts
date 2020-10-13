import Main from "../../";

import { Message } from "discord.js";
import { UserModel } from "../models/user";

export default class levels {
  name = "message";

  async handle(client: Main, message: Message) {
    if (!message.guild || !message.author || message.author.bot) return;

    const userData =
      (await UserModel.findOne({
        userId: message.author.id,
      })) ||
      new UserModel({
        userId: message.author.id,
      });

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
