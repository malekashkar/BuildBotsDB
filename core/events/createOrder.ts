import { Message, MessageReaction, User } from "discord.js";
import Main from "../..";
import { GuildModel } from "../models/guild";

export default class createOrder {
  name = "messageReactionAdd";

  async handle(client: Main, reaction: MessageReaction, user: User) {
    if (user.bot) return;
    if (reaction.message.partial) reaction.message.fetch();
    if (reaction.emoji.name !== "✅") return;

    const message = reaction.message;
    const embed = message.embeds[0];
    if (!embed) return;

    const guildData = await GuildModel.findOne({
      _id: message.guild.id,
    });
    if (!guildData) return;

    
  }
}
