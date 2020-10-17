import Command from "..";
import { Message } from "discord.js";
import embeds from "../../utils/embeds";
import { getBorderCharacters, table } from "table";
import Main from "../../..";
import { UserModel } from "../../models/user";

export default class Commmand extends Command {
  cmdName = "leaderboard";
  description = "Check the leaderboard for users with most xp.";
  groupName = "levels";

  async run(client: Main, message: Message) {
    try {
      let guild = message.guild;
      let members = await UserModel.find();
      if (!members.length)
        return message.channel.send(
          embeds.error(`No one in this server has exp!`)
        );

      members.sort((a, b) => b.leveling.xp - a.leveling.xp);

      const membersLimited = [["Position 🏅", "Username 💬", "EXP 🧠"]];
      const condition = members.length > 9 ? 9 : members.length - 1;

      for (let i = 0; i <= condition; ++i) {
        if (!guild.members.cache.get(members[i].userId)) continue;

        membersLimited.push([
          `${this.getEmoji(i)} ${this.compute_number(i + 1)}`,
          this.validateUsername(
            guild.members.cache.get(members[i].userId).user.username
          ),
          members[i].leveling.xp.toString(),
        ]);
      }

      let index = members.findIndex(
        (member) => member.userId === message.member.id
      );

      if (index > 9) {
        membersLimited.push([
          this.compute_number(index + 1),
          this.validateUsername(
            guild.members.cache.get(members[index].userId).user.username
          ),
          members[index].leveling.xp.toString(),
        ]);
      }

      return message.channel.send(
        embeds.normal(
          "🎖️ Leaderboard",
          `\`\`\`${table(membersLimited, {
            border: getBorderCharacters(`void`),
          })}\`\`\``
        )
      );
    } catch (err) {
      console.log(err);
    }
  }

  compute_number = (n: number) => {
    if (n <= 9) return `0${n}.`;
    else return `${n}.`;
  };

  getEmoji = (n: number) => {
    if (n >= 3) return "📜";
    else return ["🥇", "🥈", "🥉"][n];
  };

  validateUsername = (username: string) => {
    if (username.length >= 15) return username.slice(0, 11) + "...";
    else return username;
  };
}
