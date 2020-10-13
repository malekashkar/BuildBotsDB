import Main from "../../";
import Modules from "..";

export default class createGuildInvites {
  name = "ready";

  async handle(modules: Modules, client: Main) {
    for (let i = 0; i < client.guilds.cache.size; i++) {
      const guild = client.guilds.cache.array()[i];
      client.invites.set(guild.id, await guild.fetchInvites());
    }
  }
}
