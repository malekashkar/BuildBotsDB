import Main from "../../";
import Modules from "..";
import logger from "../utils/logger";

export default class botStarted {
  name = "ready";

  async handle(modules: Modules, client: Main) {
    logger.info(
      `BOT_STARTED`,
      `The bot ${client.user.username} has started successfully (${client.user.id})`
    );
  }
}
