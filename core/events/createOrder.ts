import { MessageReaction, User } from "discord.js";
import Event from ".";
import Main from "../..";
import { GuildModel } from "../models/guild";

export default class createOrder extends Event {
  name = "messageReactionAdd";

  async handle(client: Main, reaction: MessageReaction, user: User) {
    if (user.bot) return;
    if (reaction.message.partial) reaction.message.fetch();
    if (reaction.emoji.name !== "✅") return;

    const message = reaction.message;
    const embed = message.embeds[0];
    if (!embed) return;

    const guildData = await GuildModel.findOne({
      guildId: message.guild.id,
    });
    if (!guildData) return;
  }
}
