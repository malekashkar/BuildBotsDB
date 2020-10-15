import { Message } from "discord.js";

export default async function question(
  question: string,
  message: Message,
  required?: string[]
) {
  const msg = await message.channel.send(question);
  const answer = await message.channel.awaitMessages(
    (x) =>
      x.author.id === message.author.id && required && required.length
        ? required.includes(x.content)
        : true,
    {
      max: 1,
      time: 900000,
      errors: ["time"],
    }
  );

  if (msg.deletable) msg.delete();
  if (answer.first().deletable) answer.first().delete();

  return answer ? answer.first().content : null;
}
