import Modules from "..";
import Main from "../../";
import placeholders from "../utils/placeholders";
import { GuildMember, TextChannel } from "discord.js";

export default class addInvites {
  name = "guildMemberAdd";

  async handle(modules: Modules, client: Main, member: GuildMember) {
    const guildInvites = await member.guild.fetchInvites();
    const ei = client.invites.get(member.guild.id);
    client.invites.set(member.guild.id, guildInvites);

    const invite =
      guildInvites.find((i) => {
        if (ei.get(i.code) && ei.get(i.code).uses)
          return ei.get(i.code).uses < i.uses;
      }) || guildInvites.find((i) => !ei.get(i.code) && i.uses >= 1);
    const inviter = invite.inviter;
    const invitesData = await modules.db.invites.find({
      inviterId: inviter.id,
    });

    await modules.db.invites.create({
      inviterId: inviter.id,
      userJoinedId: member.id,
    });

    const guildData = await modules.db.guilds.findById(member.guild.id);
    if (!guildData) return;
    const guild = client.guilds.resolve(guildData._id);

    if (guildData.invites.join) {
      const channel = guild.channels.resolve(
        guildData.invites.join.channel
      ) as TextChannel;
      if (channel) {
        channel.send(
          placeholders(
            guildData.invites.join.message,
            member,
            inviter,
            invitesData.length
          )
        );
      }
    }

    if (guildData.invites.roles) {
      const inviterMember = member.guild.members.resolve(inviter.id);

      for (let i = 0; i < guildData.invites.roles.length; i++) {
        if (guildData.invites.roles[i].invites <= invitesData.length) {
          inviterMember.roles.add(guildData.invites.roles[i].role);
        }
      }
    }
  }
}
