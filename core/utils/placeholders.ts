import { GuildMember, User } from "discord.js";

export default function placeholders(
  msg: string,
  member: GuildMember,
  inviter: User,
  invites: number
) {
  return msg
    .replace("(user)", `${member}`)
    .replace("(inviter)", `${inviter}`)
    .replace("(invites)", `${invites}`);
}
