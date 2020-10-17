import Event from ".";
import Main from "../../";

export default class createGuildInvites extends Event {
  name = "ready";

  async handle(client: Main) {
    for (let i = 0; i < client.guilds.cache.size; i++) {
      const guild = client.guilds.cache.array()[i];
      client.invites.set(guild.id, await guild.fetchInvites());
    }
  }
}
