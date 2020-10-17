import Main from "../../";
import logger from "../utils/logger";
import Event from ".";
export default class botStarted extends Event {
  name = "ready";

  async handle(client: Main) {
    logger.info(
      `BOT_STARTED`,
      `The bot "${client.user.username}" has started successfully.`
    );
  }
}
