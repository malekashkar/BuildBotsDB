import Main from "../../";
import logger from "../utils/logger";

export default class botStarted {
  name = "ready";

  async handle(client: Main) {
    logger.info(
      `BOT_STARTED`,
      `The bot "${client.user.username}" has started successfully.`
    );
  }
}
