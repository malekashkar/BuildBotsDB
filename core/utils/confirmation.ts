import { Message } from "discord.js";
import embeds from "./embeds";

export default async function confirmation(
  title: string,
  text: string,
  message: Message
) {
  const emojis = {
    yes: "✅",
    no: "❎",
  };

  const msg = await message.channel.send(
    embeds.normal(
      title,
      `${text}\nYou have 30 seconds to react with the ${emojis.yes} or ${emojis.no}.`
    )
  );

  msg.react(emojis.yes);
  msg.react(emojis.no);

  const reactions = await msg.awaitReactions(
    (reaction, user) =>
      user.id === message.author.id &&
      Object.values(emojis).includes(reaction.emoji.name),
    { max: 1, time: 30000 }
  );

  if (msg.deletable) msg.delete();

  if (!reactions.size || reactions.first().emoji.name !== emojis.yes)
    return false;
  else return true;
}
